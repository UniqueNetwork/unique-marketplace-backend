import { Sdk, SocketClient } from '@unique-nft/sdk';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getContractAbi } from '@app/contracts/scripts';
import { ContractEntity, ContractService } from '@app/common/modules/database';
import { CollectionEventsHandler } from './collection-events.handler';
import { ContractEventsHandler } from './contract-events.handler';

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly logger = new Logger(ContractEventsService.name);

  private readonly client: SocketClient;

  constructor(
    private readonly sdk: Sdk,
    @Inject(ContractService)
    private readonly contractService: ContractService,
    @Inject(CollectionEventsHandler)
    private readonly collectionEventsHandler: CollectionEventsHandler,
    @Inject(ContractEventsHandler)
    private readonly contractEventsHandler: ContractEventsHandler
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

    this.client.on(
      'contract-logs',
      this.contractEventsHandler.onEvent.bind(this)
    );
    this.client.on('has-next', (room, data) => loadBlocks(data.nextId));
  }
}
