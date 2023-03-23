import {
  Sdk,
  ContractLog,
  ContractLogData,
  Room,
  Extrinsic,
} from '@unique-nft/sdk';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingEntity } from '@app/common/modules/database/entities/setting.entity';
import { Repository } from 'typeorm';
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

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly logger = new Logger(ContractEventsService.name);

  private readonly abiByAddress: Record<string, any> = {};

  constructor(
    private readonly sdk: Sdk,
    @InjectRepository(SettingEntity)
    private settingEntityRepository: Repository<SettingEntity>,
    @Inject(ContractService)
    private readonly contractService: ContractService
  ) {}

  async onModuleInit() {
    await this.loadAllContracts();
  }

  private async loadAllContracts() {
    const contracts = await this.contractService.getAll();
    contracts.forEach((contract) => {
      this.abiByAddress[contract.address] = getContractAbi(contract.version);

      this.subscribe(contract);
    });
  }

  private async subscribe(contract: ContractEntity) {
    this.logger.log(`subscribe v${contract.version}:${contract.address}`);

    const client = this.sdk.subscriptions.connect(null, {
      reconnection: true,
      autoConnect: true,
    });

    client.socket.on('connect', async () => {
      this.logger.log(`reconnect v${contract.version}:${contract.address}`);
      const processedAt = await this.contractService.getProcessedBlock(
        contract.address
      );
      loadBlocks(processedAt);
    });

    function loadBlocks(fromBlock: number) {
      client.subscribeContract({
        address: contract.address,
        fromBlock,
      });
    }

    client.on('contract-logs', this.onContractLog.bind(this));
    client.socket.on('has-next', (room, data) => loadBlocks(data.nextId));
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
      console.log('TokenIsUpForSale', tokenUpArgs);
      return;
    }

    if (eventName === 'TokenRevoke') {
      const tokenRevokeArgs: TokenRevokeEventObject =
        args as unknown as TokenRevokeEventObject;
      console.log('TokenRevoke', tokenRevokeArgs);
      return;
    }

    console.log('eventName', eventName);
  }
}
