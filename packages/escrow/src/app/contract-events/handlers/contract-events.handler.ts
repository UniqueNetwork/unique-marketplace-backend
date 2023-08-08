import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContractLogData, Extrinsic } from '@unique-nft/sdk';
import { ethers } from 'ethers';
import { LogDescription } from '@ethersproject/abi/src.ts/interface';
import {
  CrossAddressStructOutput,
  MarketEventNames,
  TokenIsApprovedEventObject,
  TokenIsPurchasedEventObject,
  TokenIsUpForSaleEventObject,
  TokenRevokeEventObject,
} from '@app/contracts/assemblies/0/market';
import { OfferEventType, OfferStatus } from '@app/common/modules/types';
import { ContractEntity, ContractService, OfferEntity, OfferEventEntity, OfferService } from '@app/common/modules/database';
import { OfferEventService } from '@app/common/modules/database/services/offer-event.service';
import { Sdk, SocketClient } from '@unique-nft/sdk/full';
import { Address } from '@unique-nft/utils';
import { CollectionsService } from '../../../collections/collections.service';
import { TokensService } from '../../../collections/tokens.service';
import { TokenPriceChangedEventObject } from '@app/contracts/assemblies/1/market';

type LogEventHandler = (
  extrinsic: Extrinsic,
  contractEntity: ContractEntity,
  args: TokenIsUpForSaleEventObject | TokenIsApprovedEventObject | TokenRevokeEventObject | TokenIsPurchasedEventObject,
) => Promise<void>;

@Injectable()
export class ContractEventsHandler {
  private readonly logger = new Logger(ContractEventsHandler.name);

  private readonly eventHandlers: Record<string, LogEventHandler>;

  private client: SocketClient;
  private abiByAddress: Record<string, any>;

  private chain;

  constructor(
    private sdk: Sdk,
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

    // this.chain = Promise.all([this.sdkService.getChainProperties()]);
  }

  public getAllContract() {
    return this.contractService.getAll();
  }

  public init(client: SocketClient, abiByAddress: Record<string, any>) {
    this.client = client;
    this.abiByAddress = abiByAddress;
  }

  public async subscribe(contract: ContractEntity) {
    const fromBlock = await this.contractService.getProcessedBlock(contract.address);

    this.logger.log(`subscribe to contract v${contract.version}:${contract.address}, from block ${fromBlock}`);

    this.loadBlocks(contract.address, fromBlock);
  }

  public loadBlocks(address: string, fromBlock: number) {
    this.logger.log(`load contract ${address} from block ${fromBlock}`);

    this.client.subscribeContract({
      address,
      fromBlock,
    });
  }

  async onEvent(room, data: ContractLogData) {
    const { log, extrinsic } = data;
    this.logger.log(`onEvent, block id: ${extrinsic?.block?.id}`, log);

    const { address } = log;
    const addressNormal = address.toLowerCase();

    if (!(addressNormal in this.abiByAddress)) {
      this.logger.error(`Not found abi for contract ${addressNormal}`);
      return;
    }

    const contractEntity = await this.contractService.get(addressNormal);
    if (!contractEntity) {
      this.logger.error(`Not found ContractEntity ${addressNormal}`);
      return;
    }

    // todo fix this blockId
    // @ts-ignore
    const blockId = extrinsic.blockId || extrinsic.block?.id || 0;
    await this.saveBlockId(addressNormal, blockId);

    const abi = this.abiByAddress[addressNormal];

    const contract = new ethers.utils.Interface(abi);

    const decoded: LogDescription = contract.parseLog(log);
    this.logger.log('decoded', {
      name: decoded.name,
      topic: decoded.topic,
      args: decoded.args,
    });

    const { name, args } = decoded;

    const eventName: MarketEventNames = name as MarketEventNames;
    if (eventName in this.eventHandlers) {
      await this.eventHandlers[eventName](extrinsic, contractEntity, args as any);
    } else {
      this.logger.warn(`Not found handler for event ${eventName}`);
    }
  }

  public async saveBlockId(address: string, blockId: number) {
    await this.contractService.updateProcessedBlock(address.toLowerCase(), blockId);
  }

  private async createEventData(
    offer: OfferEntity,
    eventType: OfferEventType,
    extrinsic: Extrinsic,
    amount: number,
    crossAddress: CrossAddressStructOutput,
  ): Promise<Omit<OfferEventEntity, 'id' | 'createdAt' | 'updatedAt' | 'token_properties'>> {
    // todo fix this blockId
    // @ts-ignore
    const blockId = extrinsic.blockId || extrinsic.block?.id || 0;

    const address = crossAddress ? Address.extract.addressNormalized(crossAddress) : null;

    // todo fix double events error
    const foundEvent = await this.offerEventService.find(offer, eventType, blockId, address);
    if (foundEvent) {
      console.error('!!!Double offer event', extrinsic.block, `offer: ${offer?.id || undefined}`);
      return;
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

  private async tokenIsUpForSale(extrinsic: Extrinsic, contractEntity: ContractEntity, tokenUpArgs: TokenIsUpForSaleEventObject) {
    const offer = await this.offerService.update(contractEntity, tokenUpArgs.item, OfferStatus.Opened, this.chain);

    this.logger.log(`tokenIsUpForSale, offer: ${offer?.id || undefined}`);
    if (offer) {
      const eventData = await this.createEventData(
        offer,
        OfferEventType.Open,
        extrinsic,
        tokenUpArgs.item.amount,
        tokenUpArgs.item.seller,
      );
      if (eventData) {
        await this.offerEventService.create(eventData);
        await this.tokensService.observer(tokenUpArgs.item.collectionId, tokenUpArgs.item.tokenId);
      }
    }
  }

  private async tokenPriceChanged(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenPriceChangedArgs: TokenPriceChangedEventObject,
  ) {
    const offer = await this.offerService.update(contractEntity, tokenPriceChangedArgs.item, OfferStatus.Opened, this.chain);

    this.logger.log(`tokenPriceChanged, offer: ${offer?.id || undefined}`);
  }

  private async tokenIsApproved(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenRevokeArgs: TokenIsApprovedEventObject,
  ) {
    // todo
  }

  private async tokenRevoke(extrinsic: Extrinsic, contractEntity: ContractEntity, tokenRevokeArgs: TokenRevokeEventObject) {
    const offerStatus = tokenRevokeArgs.item.amount === 0 ? OfferStatus.Canceled : OfferStatus.Opened;

    const offer = await this.offerService.update(contractEntity, tokenRevokeArgs.item, offerStatus);
    this.logger.log(`tokenRevoke, offer: ${offer?.id || undefined}`);

    if (offer) {
      const eventType = tokenRevokeArgs.item.amount === 0 ? OfferEventType.Cancel : OfferEventType.Revoke;

      const eventData = await this.createEventData(
        offer,
        eventType,
        extrinsic,
        tokenRevokeArgs.amount,
        tokenRevokeArgs.item.seller,
      );
      if (eventData) {
        await this.offerEventService.create(eventData);
      }
    }
  }

  private async tokenIsPurchased(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenIsPurchasedArgs: TokenIsPurchasedEventObject,
  ) {
    const offerStatus = tokenIsPurchasedArgs.item.amount === 0 ? OfferStatus.Completed : OfferStatus.Opened;

    const offer = await this.offerService.update(contractEntity, tokenIsPurchasedArgs.item, offerStatus);

    this.logger.log(`tokenIsPurchased, offer: ${offer?.id || undefined}`);
    if (offer) {
      const eventData = await this.createEventData(
        offer,
        OfferEventType.Buy,
        extrinsic,
        tokenIsPurchasedArgs.salesAmount,
        tokenIsPurchasedArgs.buyer,
      );
      if (eventData) {
        await this.offerEventService.create(eventData);
        await this.tokensService.observer(tokenIsPurchasedArgs.item.collectionId, tokenIsPurchasedArgs.item.tokenId);
      }
    }
  }
}
