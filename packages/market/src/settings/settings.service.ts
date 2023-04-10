import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsDto } from './dto/setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ContractEntity,
  OfferEntity,
  SettingEntity,
} from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { AddressService } from '../utils/address.service';
import { KeyringAccount } from '@unique-nft/accounts/keyring';
import { CollectionData } from './interfaces/settings.interface';

@Injectable()
export class SettingsService {
  constructor(
    private configService: ConfigService,
    private addressService: AddressService,
    @InjectRepository(ContractEntity)
    private contractRepository: Repository<ContractEntity>,
    @InjectRepository(SettingEntity)
    private settingsRepository: Repository<SettingEntity>
  ) {}

  async prepareSettings() {
    const contracts = await this.contractRepository.find({});

    const collectionTemp: CollectionData = {
      '5': { allowedTokens: '' },
      '509': { allowedTokens: '' },
      '437': { allowedTokens: '' },
      '522': { allowedTokens: '' },
      '497': { allowedTokens: '' },
    };

    const settings: SettingsDto = {
      marketType: 'marketType',
      administrators: [],
      blockchain: {
        escrowAddress: await this.escrowAddress(),
        unique: {
          restUrl: this.configService.get('uniqueSdkRestUrl'),
          rpcUrl: this.configService.get('uniqueRpcUrl'),
          collections: collectionTemp,
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

  async escrowAddress(): Promise<string> {
    const account = await this.addressService.substrateFromSeed(
      this.configService.get('signer.seed')
    );
    return account.address;
  }
}
