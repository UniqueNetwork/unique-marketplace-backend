import { Inject, Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  CrossAddressStructOutput,
  MarketEventNames,
  TokenIsApprovedEvent,
  TokenIsPurchasedEvent,
  TokenRevokeEvent,
  TokenIsUpForSaleEvent,
  TokenPriceChangedEvent,
} from '@app/contracts/assemblies/3/market';
import { OfferEventType, OfferStatus } from '@app/common/modules/types';
import { ContractEntity, ContractService, OfferEntity, OfferEventEntity, OfferService } from '@app/common/modules/database';
import { OfferEventService } from '@app/common/modules/database/services/offer-event.service';
import { getContractAbi } from '@app/contracts/scripts';
import { Address } from '@unique-nft/utils';
import { CollectionsService } from '../../../collections/collections.service';
import { TokensService } from '../../../collections/tokens.service';
import { formatCrossAccount } from '@app/common/src/lib/utils';

// Types for new indexer events
interface IndexerEvent {
  eventId: string;
  extrinsicHash: string;
  blockNumber: string;
  section: string;
  method: string;
  data: {
    log?: string; // JSON string containing the actual log data
  };
  asHex: string;
  createdAt: string;
  blockTimestamp: string;
}

interface ContractLog {
  address: string;
  topics: string[];
  data: string;
}

interface ParsedContractEvent {
  address: string;
  blockNumber: number;
  data: string;
  topics: string[];
  extrinsicHash: string;
  eventId: string;
}

type LogEventHandler = (
  event: ParsedContractEvent,
  contractEntity: ContractEntity,
  args:
    | TokenIsUpForSaleEvent.OutputObject
    | TokenIsApprovedEvent.OutputObject
    | TokenRevokeEvent.OutputObject
    | TokenIsPurchasedEvent.OutputObject,
) => Promise<void>;

@Injectable()
export class ContractEventsHandler {
  private readonly logger = new Logger(ContractEventsHandler.name);

  private readonly eventHandlers: Record<string, LogEventHandler>;
  private readonly abiByAddress: Map<string, ethers.Interface> = new Map();

  constructor(
    @Inject(OfferService)
    private readonly offerService: OfferService,
    @Inject(ContractService)
    private readonly contractService: ContractService,
    @Inject(OfferEventService)
    private readonly offerEventService: OfferEventService,
    @Inject(CollectionsService)
    private readonly collectionsService: CollectionsService,
    @Inject(TokensService)
    private readonly tokensService: TokensService,
  ) {
    this.eventHandlers = {
      TokenIsUpForSale: this.tokenIsUpForSale.bind(this),
      TokenPriceChanged: this.tokenPriceChanged.bind(this),
      TokenIsPurchased: this.tokenIsPurchased.bind(this),
      TokenRevoke: this.tokenRevoke.bind(this),
      TokenIsApproved: this.tokenIsApproved.bind(this),
    };
  }

  public getAllContract() {
    return this.contractService.getAll();
  }

  public async initializeContract(address: string, version: string) {
    try {
      // Convert string version to number if needed
      const versionNumber = parseInt(version, 10);
      const abi = getContractAbi(versionNumber);
      const contractInterface = new ethers.Interface(abi);
      this.abiByAddress.set(address.toLowerCase(), contractInterface);
      
      this.logger.log(`✅ Initialized contract ABI for ${address} v${version}`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize contract ABI for ${address}:`, error);
    }
  }

  /**
   * Handle raw contract events from the new indexer
   * @param events Array of indexer events from subscription
   */
  async handleContractEvents(contractAddress: string, events: IndexerEvent[]) {
    for (const event of events) {
      try {
        // Only process EVM Log events
        if (event.section === 'evm' && event.method === 'Log' && event.data?.log) {
          const parsedEvent = this.parseIndexerEvent(event);
          if (parsedEvent) {
            // Use contractAddress from subscription instead of relying on log data
            await this.processContractEvent(contractAddress, parsedEvent);
          }
        }
      } catch (error) {
        this.logger.error(`Error processing indexer event ${event.eventId}:`, error);
      }
    }
  }

  private parseIndexerEvent(event: IndexerEvent): ParsedContractEvent | null {
    try {
      if (!event.data?.log) {
        this.logger.warn(`No log data in event ${event.eventId}`);
        return null;
      }

      // Parse the JSON string in data.log
      const logData: ContractLog = JSON.parse(event.data.log);
      
      if (!logData.address) {
        this.logger.warn(`No address in log data for event ${event.eventId}`);
        return null;
      }
      
      return {
        address: logData.address,
        blockNumber: parseInt(event.blockNumber, 10),
        data: logData.data,
        topics: logData.topics,
        extrinsicHash: event.extrinsicHash,
        eventId: event.eventId,
      };
    } catch (error) {
      this.logger.error(`Failed to parse indexer event ${event.eventId}:`, error);
      this.logger.debug(`Event data:`, JSON.stringify(event.data, null, 2));
      return null;
    }
  }

  private async processContractEvent(contractAddress: string, event: ParsedContractEvent) {
    // Use contractAddress from subscription (more reliable than log data)
    const addressNormal = contractAddress.toLowerCase();
    
    // Verify that log address matches subscription address (optional check)
    if (event.address && event.address.toLowerCase() !== addressNormal) {
      this.logger.warn(`Address mismatch: subscription=${addressNormal}, log=${event.address.toLowerCase()}`);
    }

    // Check if we have ABI for this contract
    const contractInterface = this.abiByAddress.get(addressNormal);
    if (!contractInterface) {
      this.logger.error(`No ABI found for contract ${addressNormal}`);
      return;
    }

    // Get contract entity from database
    const contractEntity = await this.contractService.get(addressNormal);
    if (!contractEntity) {
      this.logger.error(`ContractEntity not found for ${addressNormal}`);
      return;
    }

    // Save processed block
    await this.saveBlockId(addressNormal, event.blockNumber);

    try {
      // Parse raw log through ethers ABI
      const logData = {
        topics: event.topics,
        data: event.data
      };

      const decoded = contractInterface.parseLog(logData);
      if (!decoded) {
        this.logger.warn(`Could not decode log for contract ${addressNormal}`);
        return;
      }

      this.logger.debug('Decoded event:', {
        name: decoded.name,
        address: addressNormal,
        blockNumber: event.blockNumber,
        args: decoded.args
      });

      // Handle the decoded event
      const eventName: MarketEventNames = decoded.name as MarketEventNames;
      if (eventName in this.eventHandlers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.eventHandlers[eventName](event, contractEntity, decoded.args as any);
      } else {
        this.logger.warn(`No handler found for event ${eventName}`);
      }

    } catch (parseError) {
      this.logger.error(`Failed to parse contract log:`, parseError);
    }
  }

  public async saveBlockId(address: string, blockId: number) {
    await this.contractService.updateProcessedBlock(address.toLowerCase(), blockId);
  }

  private async createEventData(
    offer: OfferEntity,
    eventType: OfferEventType,
    event: ParsedContractEvent,
    amount: number,
    crossAddress: CrossAddressStructOutput,
  ): Promise<Omit<OfferEventEntity, 'id' | 'createdAt' | 'updatedAt' | 'token_properties'> | null> {
    const blockId = event.blockNumber;

    const address = crossAddress ? Address.extract.addressNormalized(formatCrossAccount(crossAddress)) : null;

    // Check for duplicate events
    const foundEvent = await this.offerEventService.find(offer, eventType, blockId, address);
    if (foundEvent) {
      this.logger.warn(`Duplicate offer event detected for offer ${offer?.id} at block ${blockId}`);
      return null;
    }

    const collection = await this.collectionsService.get(offer.collectionId);
    return {
      offer,
      eventType,
      blockNumber: blockId,
      address,
      amount,
      commission: offer.contract.commission,
      collectionMode: collection?.mode || '',
      network: collection?.network || '',
      meta: '{}',
    };
  }

  private async tokenIsUpForSale(
    event: ParsedContractEvent,
    contractEntity: ContractEntity,
    tokenUpArgs: TokenIsUpForSaleEvent.OutputObject,
  ) {
    const offer = await this.offerService.update(contractEntity, tokenUpArgs.item, OfferStatus.Opened, undefined);

    this.logger.log(`tokenIsUpForSale, offer: ${offer?.id || undefined}`);
    if (offer) {
      const eventData = await this.createEventData(
        offer,
        OfferEventType.Open,
        event,
        Number(tokenUpArgs.item.amount),
        tokenUpArgs.item.seller,
      );
      if (eventData) {
        await this.offerEventService.create(eventData);
        await this.tokensService.observer(Number(tokenUpArgs.item.collectionId), Number(tokenUpArgs.item.tokenId));
      }
    }
  }

  private async tokenPriceChanged(
    event: ParsedContractEvent,
    contractEntity: ContractEntity,
    tokenPriceChangedArgs: TokenPriceChangedEvent.OutputObject,
  ) {
    const offer = await this.offerService.update(contractEntity, tokenPriceChangedArgs.item, OfferStatus.Opened, undefined);

    this.logger.log(`tokenPriceChanged, offer: ${offer?.id || undefined}`);
  }

  private async tokenIsApproved(
    event: ParsedContractEvent,
    contractEntity: ContractEntity,
    tokenApprovalArgs: TokenIsApprovedEvent.OutputObject,
  ) {
    this.logger.log(`tokenIsApproved for contract ${contractEntity.address} at block ${event.blockNumber}`);
    // TODO: Implement token approval handling logic
    this.logger.debug('Approval args:', tokenApprovalArgs);
  }

  private async tokenRevoke(
    event: ParsedContractEvent,
    contractEntity: ContractEntity,
    tokenRevokeArgs: TokenRevokeEvent.OutputObject,
  ) {
    const offerStatus = tokenRevokeArgs.item.amount === 0n ? OfferStatus.Canceled : OfferStatus.Opened;

    const offer = await this.offerService.update(contractEntity, tokenRevokeArgs.item, offerStatus);
    this.logger.log(`tokenRevoke, offer: ${offer?.id || undefined}`);

    if (offer) {
      const eventType = tokenRevokeArgs.item.amount === 0n ? OfferEventType.Cancel : OfferEventType.Revoke;

      const eventData = await this.createEventData(
        offer,
        eventType,
        event,
        Number(tokenRevokeArgs.amount),
        tokenRevokeArgs.item.seller,
      );
      if (eventData) {
        await this.offerEventService.create(eventData);
      }
    }
  }

  private async tokenIsPurchased(
    event: ParsedContractEvent,
    contractEntity: ContractEntity,
    tokenIsPurchasedArgs: TokenIsPurchasedEvent.OutputObject,
  ) {
    const offerStatus = tokenIsPurchasedArgs.item.amount === 0n ? OfferStatus.Completed : OfferStatus.Opened;

    const offer = await this.offerService.update(contractEntity, tokenIsPurchasedArgs.item, offerStatus);

    this.logger.log(`tokenIsPurchased, offer: ${offer?.id || undefined}`);
    if (offer) {
      const eventData = await this.createEventData(
        offer,
        OfferEventType.Buy,
        event,
        Number(tokenIsPurchasedArgs.salesAmount),
        tokenIsPurchasedArgs.buyer,
      );
      if (eventData) {
        await this.offerEventService.create(eventData);
        await this.tokensService.observer(
          Number(tokenIsPurchasedArgs.item.collectionId),
          Number(tokenIsPurchasedArgs.item.tokenId),
        );
      }
    }
  }
}
