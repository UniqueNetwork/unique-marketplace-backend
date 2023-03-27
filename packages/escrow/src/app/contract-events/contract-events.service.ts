import {
  ContractLog,
  ContractLogData,
  Extrinsic,
  Room,
  Sdk,
  SocketClient,
} from '@unique-nft/sdk';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getContractAbi } from '@app/contracts/scripts';
import { ethers } from 'ethers';
import { LogDescription } from '@ethersproject/abi/src.ts/interface';
import {
  LogEventObject,
  TokenIsUpForSaleEventObject,
  TokenRevokeEventObject,
} from '@app/contracts/assemblies/0/market';
import { ContractEntity } from '@app/common/modules/database/entities/contract.entity';
import { ContractService } from '@app/common/modules/database/services/contract.service';
import { OfferService } from '@app/common/modules/database/services/offer.service';
import { CollectionEventsHandler } from './collection-events.handler';
import { OfferStatus } from '@app/common/modules/types';

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly logger = new Logger(ContractEventsService.name);

  private readonly client: SocketClient;
  private readonly abiByAddress: Record<string, any> = {};

  constructor(
    private readonly sdk: Sdk,
    @Inject(ContractService)
    private readonly contractService: ContractService,
    @Inject(OfferService)
    private readonly offerService: OfferService,
    @Inject(CollectionEventsHandler)
    private readonly collectionEventsHandler: CollectionEventsHandler
  ) {
    this.client = this.sdk.subscriptions.connect({
      reconnection: true,
      autoConnect: true,
    });

    this.client.on(
      'collections',
      this.collectionEventsHandler.onEvent.bind(this.collectionEventsHandler)
    );
    this.client.subscribeCollection();
  }

  async onModuleInit() {
    const contracts = await this.contractService.getAll();
    contracts.forEach((contract) => {
      this.abiByAddress[contract.address] = getContractAbi(contract.version);

      this.subscribe(contract);
    });

    this.collectionEventsHandler.init(this.abiByAddress);
  }

  private async subscribe(contract: ContractEntity) {
    this.logger.log(`subscribe v${contract.version}:${contract.address}`);

    const loadBlocks = (fromBlock: number) =>
      this.client.subscribeContract({
        address: contract.address,
        fromBlock,
      });

    this.client.socket.on('connect', async () => {
      this.logger.log(`reconnect v${contract.version}:${contract.address}`);
      const processedAt = await this.contractService.getProcessedBlock(
        contract.address
      );
      loadBlocks(processedAt);
    });

    this.client.on('contract-logs', this.onContractLog.bind(this));
    this.client.on('has-next', (room, data) => loadBlocks(data.nextId));
  }

  async onContractLog(room: Room, data: ContractLogData) {
    const { log, extrinsic } = data;
    await this.handleEventData(log, extrinsic);
  }

  async handleEventData(log: ContractLog, extrinsic: Extrinsic) {
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

    const { name: eventName, args } = decoded;

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

    console.log('eventName', eventName);
  }
}
