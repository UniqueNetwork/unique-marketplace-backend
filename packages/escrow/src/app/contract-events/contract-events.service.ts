import { HasNextData, Sdk, SocketClient } from '@unique-nft/sdk/full';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getContractAbi } from '@app/contracts/scripts';
import { ContractEntity, ContractService, SettingsService } from '@app/common/modules/database';
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
    @Inject(SettingsService)
    private readonly settingsService: SettingsService,
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
      await this.subscribeToCollection();
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

      this.subscribeToContract(contract);
    });

    this.collectionEventsHandler.init(abiByAddress);
    this.contractEventsHandler.init(abiByAddress);
  }

  private async subscribeToContract(contract: ContractEntity) {
    const fromBlock = await this.contractService.getProcessedBlock(contract.address);

    this.logger.log(`subscribe to contract v${contract.version}:${contract.address}, from block ${fromBlock}`);

    this.loadContractBlocks(contract.address, fromBlock);
  }

  private loadContractBlocks(address: string, fromBlock: number) {
    this.logger.log(`load contract ${address} from block ${fromBlock}`);

    this.client.subscribeContract({
      address,
      fromBlock,
    });
  }

  private onHasNext(room, data: HasNextData) {
    if (room.name === 'contract') {
      this.loadContractBlocks(room.data.address, data.nextId);
    }

    if (room.name === 'collection') {
      this.loadCollectionsBlocks(data.nextId);
    }
  }

  private async subscribeToCollection() {
    const fromBlock = await this.settingsService.getSubscribeCollectionBlock();

    this.logger.log(`subscribe to collection, from block ${fromBlock}`);

    this.loadCollectionsBlocks(fromBlock);
  }

  private loadCollectionsBlocks(fromBlock: number | undefined) {
    this.logger.log(`load collection from block ${fromBlock}`);

    this.client.subscribeCollection({
      fromBlock,
    });
  }
}
