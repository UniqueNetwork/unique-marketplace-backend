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
import {
  ContractEntity,
  ContractService,
  OfferService,
} from '@app/common/modules/database';
import { OfferEventService } from '@app/common/modules/database/services/offer-event.service';

type LogEventHandler = (
  extrinsic: Extrinsic,
  contractEntity: ContractEntity,
  args:
    | TokenIsUpForSaleEventObject
    | TokenIsApprovedEventObject
    | TokenRevokeEventObject
    | TokenIsPurchasedEventObject
) => Promise<void>;

@Injectable()
export class ContractEventsHandler {
  private readonly logger = new Logger(ContractEventsHandler.name);

  private readonly eventHandlers: Record<MarketEventNames, LogEventHandler>;

  private abiByAddress: Record<string, any>;

  constructor(
    @Inject(OfferService)
    private readonly offerService: OfferService,
    @Inject(ContractService)
    private readonly contractService: ContractService,
    @Inject(OfferEventService)
    private readonly offerEventService: OfferEventService
  ) {
    this.eventHandlers = {
      TokenIsUpForSale: this.tokenIsUpForSale.bind(this),
      TokenIsPurchased: this.tokenIsPurchased.bind(this),
      TokenRevoke: this.tokenRevoke.bind(this),
      TokenIsApproved: this.tokenIsApproved.bind(this),
    };
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

    await this.contractService.updateProcessedBlock(
      addressNormal,
      extrinsic.block.id
    );

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
      await this.eventHandlers[eventName](
        extrinsic,
        contractEntity,
        args as any
      );
    } else {
      this.logger.warn(`Not found handler for event ${eventName}`);
    }
  }

  private async tokenIsUpForSale(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenUpArgs: TokenIsUpForSaleEventObject
  ) {
    const offer = await this.offerService.update(
      contractEntity,
      tokenUpArgs.item,
      OfferStatus.Opened
    );

    if (offer) {
      await this.offerEventService.create(
        offer,
        OfferEventType.Open,
        extrinsic.block.id,
        extrinsic.signer
      );
    }
  }

  private async tokenIsApproved(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenRevokeArgs: TokenIsApprovedEventObject
  ) {
    // todo
  }

  private async tokenRevoke(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenRevokeArgs: TokenRevokeEventObject
  ) {
    const offerStatus =
      tokenRevokeArgs.item.amount === 0
        ? OfferStatus.Canceled
        : OfferStatus.Opened;

    const offer = await this.offerService.update(
      contractEntity,
      tokenRevokeArgs.item,
      offerStatus
    );

    if (offer) {
      await this.offerEventService.create(
        offer,
        OfferEventType.Open,
        extrinsic.block.id,
        extrinsic.signer
      );
    }
  }

  private async tokenIsPurchased(
    extrinsic: Extrinsic,
    contractEntity: ContractEntity,
    tokenIsPurchasedArgs: TokenIsPurchasedEventObject
  ) {
    const offerStatus =
      tokenIsPurchasedArgs.item.amount === 0
        ? OfferStatus.Completed
        : OfferStatus.Opened;

    const offer = await this.offerService.update(
      contractEntity,
      tokenIsPurchasedArgs.item,
      offerStatus
    );

    if (offer) {
      await this.offerEventService.create(
        offer,
        OfferEventType.Open,
        extrinsic.block.id,
        extrinsic.signer
      );
    }
  }
}
