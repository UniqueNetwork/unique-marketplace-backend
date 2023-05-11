import { HasNextData, Sdk, SocketClient } from '@unique-nft/sdk/full';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getContractAbi } from '@app/contracts/scripts';
import { ContractEntity, ContractService } from '@app/common/modules/database';
import { CollectionEventsHandler, ContractEventsHandler } from './handlers';

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly logger = new Logger(ContractEventsService.name);

  private readonly client: SocketClient;

  private isModuleInit: boolean;
  private isClientConnected: boolean;

  constructor(
    private readonly sdk: Sdk,
    @Inject(ContractService)
    private readonly contractService: ContractService,
    @Inject(CollectionEventsHandler)
    private readonly collectionEventsHandler: CollectionEventsHandler,
    @Inject(ContractEventsHandler)
    private readonly contractEventsHandler: ContractEventsHandler,
  ) {
    this.client = this.sdk.subscription.connect({
      reconnection: true,
      autoConnect: true,
      transports: ['websocket'],
    });

    this.client.on('collections', this.collectionEventsHandler.onEvent.bind(this.collectionEventsHandler));
    this.client.on('contract-logs', this.contractEventsHandler.onEvent.bind(this.contractEventsHandler));
    this.client.socket.on('connect_error', async (err) => {
      this.logger.error(`connect error`, err);
    });
    this.client.on('has-next', this.onHasNext.bind(this));

    this.client.socket.on('connect', async () => {
      this.isClientConnected = true;
      if (this.isModuleInit) {
        await this.initContracts();
      }
      this.client.subscribeCollection();
    });
  }

  async onModuleInit() {
    this.isModuleInit = true;
    if (this.isClientConnected) {
      await this.initContracts();
    }
  }

  async initContracts() {
    const contracts = await this.contractService.getAll();

    const abiByAddress: Record<string, any> = {};

    contracts.forEach((contract) => {
      abiByAddress[contract.address] = getContractAbi(contract.version);

      this.subscribe(contract);
    });

    this.collectionEventsHandler.init(abiByAddress);
    this.contractEventsHandler.init(abiByAddress);
  }

  private async subscribe(contract: ContractEntity) {
    this.logger.log(`subscribe v${contract.version}:${contract.address}`);

    const fromBlock = await this.contractService.getProcessedBlock(contract.address);

    this.loadBlocks(contract.address, fromBlock);
  }

  private loadBlocks(address: string, fromBlock: number) {
    this.client.subscribeContract({
      address,
      fromBlock,
    });
  }

  private onHasNext(room, data: HasNextData) {
    if (room.name === 'contract') {
      this.loadBlocks(room.data.address, data.nextId);
    }
  }
}
