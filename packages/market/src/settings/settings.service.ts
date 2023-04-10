import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsDto } from './dto/setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollectionEntity,
  ContractEntity,
  SettingEntity,
} from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { AddressService } from '@app/common/src/lib/address.service';
import { CollectionData } from './interfaces/settings.interface';
import { CollectionStatus } from '@app/common/modules/types';

@Injectable()
export class SettingsService {
  constructor(
    private configService: ConfigService,
    private addressService: AddressService,
    @InjectRepository(ContractEntity)
    private contractRepository: Repository<ContractEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(SettingEntity)
    private settingsRepository: Repository<SettingEntity>
  ) {}

  async prepareSettings() {
    const contracts = await this.contractRepository.find({});

    const collectionTemp: CollectionData = {
      '26': { allowedTokens: '1,4,23,25-100,1000-2000' },
      '57': { allowedTokens: '' },
      '196': { allowedTokens: '' },
      '17': { allowedTokens: '' },
      '1003': { allowedTokens: '' },
      '982': { allowedTokens: '' },
    };

    const settings: SettingsDto = {
      marketType: 'marketType',
      administrators: [],
      blockchain: {
        escrowAddress: await this.escrowAddress(),
        unique: {
          restUrl: this.configService.get('uniqueSdkRestUrl'),
          rpcUrl: this.configService.get('uniqueRpcUrl'),
          collections: await this.getCollectionSettings(),
          contracts,
        },
      },
    };
    return settings;
  }

  async getSettings(): Promise<SettingsDto> {
    try {
      return await this.prepareSettings();
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async getCollectionSettings(): Promise<any> {
    const collestions = await this.collectionRepository.find({
      where: { status: CollectionStatus.Enabled },
    });
    const collectionMap = new Map();
    collestions.map((elem) =>
      collectionMap.set(elem.collectionId, {
        allowedTokens: elem.allowedTokens,
      })
    );
    return Object.fromEntries(collectionMap);
  }

  async escrowAddress(): Promise<string> {
    const account = await this.addressService.substrateFromSeed(
      this.configService.get('signer.seed')
    );
    return account.address;
  }
}
