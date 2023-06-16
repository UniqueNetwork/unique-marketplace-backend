import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContractLogData, Extrinsic } from '@unique-nft/sdk';
import { ethers } from 'ethers';
import { LogDescription } from '@ethersproject/abi/src.ts/interface';
import {
  CrossAddressStructOutput,
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
import { Address } from '@unique-nft/utils';
import { CollectionsService } from '../../../collections/collections.service';
import { TokensService } from '../../../collections/tokens.service';

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
    @Inject(TokensService)
    private readonly tokensService: TokensService,
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

  async onEvent(room, data: ContractLogData) {
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
    console.log('onEvent', log);

    // todo fix this blockId
    // @ts-ignore
    const blockId = extrinsic.blockId || extrinsic.block?.id || 0;
    await this.contractService.updateProcessedBlock(addressNormal, blockId);

    const abi = this.abiByAddress[addressNormal];

    const contract = new ethers.utils.Interface(abi);

    const decoded: LogDescription = contract.parseLog(log);

    const { name, args } = decoded;
    console.log(' name', name);

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
    crossAddress: CrossAddressStructOutput,
  ): Promise<Omit<OfferEventEntity, 'id' | 'createdAt' | 'updatedAt' | 'token_properties'>> {
    // todo fix this blockId
    // @ts-ignore
    const blockId = extrinsic.blockId || extrinsic.block?.id || 0;

    const address = crossAddress ? Address.extract.addressNormalized(crossAddress) : null;

    // todo fix double events error
    const foundEvent = await this.offerEventService.find(offer, eventType, blockId, address);
    if (foundEvent) {
      console.error('!!!Double offer event', extrinsic.block, offer);
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

    console.log('tokenIsUpForSale', offer);
    if (offer) {
      const eventData = await this.createEventData(
        offer,
        OfferEventType.Open,
        extrinsic,
        tokenUpArgs.item.amount,
        tokenUpArgs.item.seller,
      );
      await this.offerEventService.create(eventData);
      console.dir(
        {
          method: 'tokenIsUpForSale',
          tokenId: tokenUpArgs.item.tokenId,
          collectionId: tokenUpArgs.item.collectionId,
        },
        { depth: 10 },
      );
      await this.tokensService.observer(tokenUpArgs.item.collectionId, tokenUpArgs.item.tokenId);
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

      const eventData = await this.createEventData(
        offer,
        eventType,
        extrinsic,
        tokenRevokeArgs.amount,
        tokenRevokeArgs.item.seller,
      );
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
      const eventData = await this.createEventData(
        offer,
        OfferEventType.Buy,
        extrinsic,
        tokenIsPurchasedArgs.salesAmount,
        tokenIsPurchasedArgs.buyer,
      );
      await this.offerEventService.create(eventData);
      await this.tokensService.observer(tokenIsPurchasedArgs.item.collectionId, tokenIsPurchasedArgs.item.tokenId);
      console.dir(
        {
          method: 'tokenIsPurchased',
          tokenId: tokenIsPurchasedArgs.item.tokenId,
          collectionId: tokenIsPurchasedArgs.item.collectionId,
        },
        { depth: 10 },
      );
    }
  }
}
