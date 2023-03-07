import { Client, ExtrinsicResultResponse, Room } from '@unique-nft/sdk';
import { Injectable, OnModuleInit } from '@nestjs/common';
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
} from '../../../../../typechain-types/packages/contracts/src/Market';

interface ContractInfo {
  address: string;
  abi: Array<any>;
}

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly contractsByVersions: Record<string, ContractInfo> = {};
  private readonly versionByAddress: Record<string, number> = {};
  constructor(
    private readonly sdk: Client,
    @InjectRepository(SettingEntity)
    private settingEntityRepository: Repository<SettingEntity>
  ) {}

  async onModuleInit() {
    await this.loadAllContractVersions();
    await this.subscribe();
  }

  private async loadAllContractVersions() {
    let contract;
    let version = 0;
    do {
      contract = await this.settingEntityRepository.findOne({
        where: { key: `contract_v${version}` },
      });
      if (contract) {
        const address = contract.value.toLowerCase();
        this.contractsByVersions[version] = {
          address,
          abi: getContractAbi(version),
        };
        this.versionByAddress[address] = version;
      }
      version++;
    } while (contract);
  }

  private async subscribe() {
    const client = this.sdk.subscriptions.connect();
    client.subscribeEvents();
    client.on('events', this.onEvent.bind(this));
  }

  onEvent(room: Room, event: any, extrinsic: ExtrinsicResultResponse<any>) {
    // console.log('event', event);
    if (event.section !== 'evm' || event.method !== 'Log') {
      return;
    }
    event.data.map((log) => this.handleEventData(log));
  }

  handleEventData(log: any) {
    const { address } = log;
    const addressNormal = address.toLowerCase();
    if (!(addressNormal in this.versionByAddress)) {
      return;
    }

    const version = this.versionByAddress[address];

    const { abi } = this.contractsByVersions[version];

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
