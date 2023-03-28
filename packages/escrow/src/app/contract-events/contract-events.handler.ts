import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContractLogData, Room } from '@unique-nft/sdk';
import { ethers } from 'ethers';
import { LogDescription } from '@ethersproject/abi/src.ts/interface';
import {
  LogEventObject,
  MarketEventNames,
  TokenIsPurchasedEventObject,
  TokenIsUpForSaleEventObject,
  TokenRevokeEventObject,
} from '@app/contracts/assemblies/0/market';
import { OfferStatus } from '@app/common/modules/types';
import { ContractService, OfferService } from '@app/common/modules/database';

@Injectable()
export class ContractEventsHandler {
  private readonly logger = new Logger(ContractEventsHandler.name);

  private abiByAddress: Record<string, any>;

  constructor(
    @Inject(OfferService)
    private readonly offerService: OfferService,
    @Inject(ContractService)
    private readonly contractService: ContractService
  ) {}

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

    await this.contractService.updateProcessedBlock(
      addressNormal,
      extrinsic.block.id
    );

    const abi = this.abiByAddress[addressNormal];

    const contract = new ethers.utils.Interface(abi);

    const decoded: LogDescription = contract.parseLog(log);

    const { name, args } = decoded;
    const eventName: MarketEventNames = name as MarketEventNames;

    if (eventName === 'Log') {
      const logArgs: LogEventObject = args as unknown as LogEventObject;
      console.log('log', logArgs.message);
      return;
    }

    if (eventName === 'TokenIsUpForSale') {
      const tokenUpArgs: TokenIsUpForSaleEventObject =
        args as unknown as TokenIsUpForSaleEventObject;

      await this.offerService.update(
        addressNormal,
        tokenUpArgs.item,
        OfferStatus.Opened
      );
      return;
    }

    if (eventName === 'TokenRevoke') {
      const tokenRevokeArgs: TokenRevokeEventObject =
        args as unknown as TokenRevokeEventObject;

      const offerStatus =
        tokenRevokeArgs.item.amount === 0
          ? OfferStatus.Canceled
          : OfferStatus.Opened;

      await this.offerService.update(
        addressNormal,
        tokenRevokeArgs.item,
        offerStatus
      );
      return;
    }

    if (eventName === 'TokenIsPurchased') {
      const tokenIsPurchasedArgs: TokenIsPurchasedEventObject =
        args as unknown as TokenIsPurchasedEventObject;

      const offerStatus =
        tokenIsPurchasedArgs.item.amount === 0
          ? OfferStatus.Completed
          : OfferStatus.Opened;

      await this.offerService.update(
        addressNormal,
        tokenIsPurchasedArgs.item,
        offerStatus
      );
    }

    console.log('eventName', eventName);
  }
}
