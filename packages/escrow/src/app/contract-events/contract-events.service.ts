import { HasNextData, Sdk, SocketClient, SubscriptionEvents } from '@unique-nft/sdk/full';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getContractAbi } from '@app/contracts/scripts';
import { CollectionEventsHandler, ContractEventsHandler } from './handlers';

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly logger = new Logger(ContractEventsService.name);

  private readonly client: SocketClient;

  private isModuleInit: boolean;
  private isClientConnected: boolean;

  constructor(
    private readonly sdk: Sdk,
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

    this.client.on(SubscriptionEvents.COLLECTIONS, this.collectionEventsHandler.onEvent.bind(this.collectionEventsHandler));
    this.client.on(SubscriptionEvents.CONTRACT_LOGS, this.contractEventsHandler.onEvent.bind(this.contractEventsHandler));
    this.client.socket.on('connect_error', async (err) => {
      this.logger.error(`error connect to ${this.sdk.options.baseUrl}`, err);
    });
    this.client.on(SubscriptionEvents.HAS_NEXT, this.onHasNext.bind(this));
    // todo type it after update sdk
    this.client.socket.on('subscribe-state', this.onSubscribeState.bind(this));

    this.client.socket.on('connect', async () => {
      this.isClientConnected = true;
      this.logger.log(`connected to ${this.sdk.options.baseUrl}`);

      if (this.isModuleInit) {
        await this.initContracts();
      }
    });
  }

  async onModuleInit() {
    this.isModuleInit = true;
    if (this.isClientConnected) {
      await this.initContracts();
    }
  }

  async initContracts() {
    const contracts = await this.contractEventsHandler.getAllContract();

    const abiByAddress: Record<string, any> = contracts.reduce((data, contract) => {
      return {
        ...data,
        [contract.address]: getContractAbi(contract.version),
      };
    }, {});

    this.collectionEventsHandler.init(this.client, abiByAddress);
    this.contractEventsHandler.init(this.client, abiByAddress);

    contracts.forEach((contract) => this.contractEventsHandler.subscribe(contract));
    this.collectionEventsHandler.subscribe().then();
  }

  private onHasNext(room, data: HasNextData) {
    // todo type it after update sdk
    if (room.name === 'contract') {
      this.contractEventsHandler.loadBlocks(room.data.address, data.nextId);
    }

    // todo type it after update sdk
    if (room.name === 'collection') {
      this.collectionEventsHandler.loadBlocks(data.nextId);
    }
  }

  private async onSubscribeState(room, data) {
    if (!data.switchToHead) {
      return;
    }

    this.logger.log('subscribe to head', room.name);

    // todo type it after update sdk
    if (room.name === 'contract') {
      const { address } = room.data;
      await this.contractEventsHandler.saveBlockId(address, data.toBlock);
    }

    // todo type it after update sdk
    if (room.name === 'collection') {
      await this.collectionEventsHandler.saveBlockId(data.toBlock);
    }
  }
}
