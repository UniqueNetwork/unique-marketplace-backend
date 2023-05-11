import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContractLogData, Extrinsic, Room } from '@unique-nft/sdk';
import { ethers } from 'ethers';
import { LogDescription } from '@ethersproject/abi/src.ts/interface';
import {
  LogEventObject,
  MarketEventNames,
  TokenIsApprovedEventObject,
  TokenIsPurchasedEventObject,
  TokenIsUpForSaleEventObject,
  TokenRevokeEventObject,
} from '@app/contracts/assemblies/0/market';
import { OfferEventType, OfferStatus } from '@app/common/modules/types';
import { ContractEntity, ContractService, OfferEntity, OfferEventEntity, OfferService } from '@app/common/modules/database';
import { OfferEventService } from '@app/common/modules/database/services/offer-event.service';
import { Sdk } from '@unique-nft/sdk/full';
import { CollectionsService } from '../../../collections/collections.service';

type LogEventHandler = (
  extrinsic: Extrinsic,
  contractEntity: ContractEntity,
  args: TokenIsUpForSaleEventObject | TokenIsApprovedEventObject | TokenRevokeEventObject | TokenIsPurchasedEventObject,
) => Promise<void>;

@Injectable()
export class ContractEventsHandler {
  private readonly logger = new Logger(ContractEventsHandler.name);

  private readonly eventHandlers: Record<MarketEventNames, LogEventHandler>;

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
  ) {
    this.eventHandlers = {
      TokenIsUpForSale: this.tokenIsUpForSale.bind(this),
      TokenIsPurchased: this.tokenIsPurchased.bind(this),
      TokenRevoke: this.tokenRevoke.bind(this),
      TokenIsApproved: this.tokenIsApproved.bind(this),
    };

    // this.chain = Promise.all([this.sdkService.getChainProperties()]);
  }

  public init(abiByAddress: Record<string, any>) {
    this.abiByAddress = abiByAddress;
  }

  async onEvent(room: Room, data: ContractLogData) {
    const { log, extrinsic } = data;

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

    await this.contractService.updateProcessedBlock(addressNormal, extrinsic.block.id);

    const abi = this.abiByAddress[addressNormal];

    const contract = new ethers.utils.Interface(abi);

    const decoded: LogDescription = contract.parseLog(log);

    const { name, args } = decoded;

    if (name === 'Log') {
      const logArgs: LogEventObject = args as unknown as LogEventObject;
      console.log('log', logArgs.message);
      return;
    }

    const eventName: MarketEventNames = name as MarketEventNames;
    if (eventName in this.eventHandlers) {
      await this.eventHandlers[eventName](extrinsic, contractEntity, args as any);
    } else {
      this.logger.warn(`Not found handler for event ${eventName}`);
    }
  }

  private async createEventData(
    offer: OfferEntity,
    eventType: OfferEventType,
    extrinsic: Extrinsic,
    amount: number,
  ): Promise<Omit<OfferEventEntity, 'id' | 'createdAt' | 'updatedAt'>> {
    const collection = await this.collectionsService.get(offer.collectionId);
    return {
      offer,
      eventType,
      blockNumber: extrinsic.block.id,
      address: extrinsic.signer,
      amount,
      commission: offer.contract.commission,
      collectionMode: collection?.mode || '',
      network: collection?.network || '',
      meta: '{}',
    };
  }

  private async tokenIsUpForSale(extrinsic: Extrinsic, contractEntity: ContractEntity, tokenUpArgs: TokenIsUpForSaleEventObject) {
    const offer = await this.offerService.update(contractEntity, tokenUpArgs.item, OfferStatus.Opened, this.chain);

    if (offer) {
      const eventData = await this.createEventData(offer, OfferEventType.Open, extrinsic, tokenUpArgs.item.amount);
      await this.offerEventService.create(eventData);
    }
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

    if (offer) {
      const eventType = tokenRevokeArgs.item.amount === 0 ? OfferEventType.Cancel : OfferEventType.Revoke;

      const eventData = await this.createEventData(offer, eventType, extrinsic, tokenRevokeArgs.amount);
      await this.offerEventService.create(eventData);
    }
  }

  private async tokenIsPurchased(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenIsPurchasedArgs: TokenIsPurchasedEventObject,
  ) {
    const offerStatus = tokenIsPurchasedArgs.item.amount === 0 ? OfferStatus.Completed : OfferStatus.Opened;

    const offer = await this.offerService.update(contractEntity, tokenIsPurchasedArgs.item, offerStatus);

    if (offer) {
      const eventData = await this.createEventData(offer, OfferEventType.Buy, extrinsic, tokenIsPurchasedArgs.salesAmount);
      await this.offerEventService.create(eventData);
    }
  }
}
