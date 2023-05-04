import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsDto } from './dto/setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionEntity, ContractEntity, SettingEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { AddressService } from '@app/common/src/lib/address.service';
import { CollectionStatus, CustomObject } from '@app/common/modules/types';
import { OmitType } from '@nestjs/swagger';
import { SignerConfig } from '@app/common/modules/config';

interface CollectionDataDescription {
  mode: string;
  name: string;
  id: number;
  description: string;
  tokenPrefix: string;
  owner: string;
  readOnly: string;
  schema: ICollectionSchema;
}

interface ICollectionSchema {
  image: CustomObject;
  schemaName: string;
  collectionId: number;
  coverPicture: CustomObject;
  schemaVersion: string;
  attributesSchemaVersion: string;
}

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
    private settingsRepository: Repository<SettingEntity>,
  ) {}

  async prepareSettings() {
    const contracts = await this.contractRepository.find({});

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
    return await this.prepareSettings();
    try {
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Getting data about collections for sale
   */
  async getCollectionSettings(): Promise<any> {
    const collestions = await this.collectionRepository.find({
      where: { status: CollectionStatus.Enabled },
    });
    const collectionMap = new Map();
    collestions.map((elem) => {
      const { allowedTokens, data } = elem;
      const collectionDescription = this.collectionDataTransformation(data);
      collectionMap.set(elem.collectionId, { allowedTokens: elem.allowedTokens, description: collectionDescription });
    });
    return Object.fromEntries(collectionMap);
  }

  /**
   * Transforming data from the collection for description
   * @param data
   */
  collectionDataTransformation(data): CollectionDataDescription {
    delete data.schema.attributesSchema;
    const { id, mode, name, description, owner, tokenPrefix, readOnly, schema } = data;
    return { id, name, description, tokenPrefix, mode, owner, readOnly, schema };
  }

  /**
   * Escrow seed to Substrate and Metamask address
   */
  async escrowAddress(): Promise<any> {
    const accountSubstrate = await this.addressService.substrateFromSeed(
      this.configService.get<SignerConfig>('signer').substrateSeed,
    );
    const accountMetamask = await this.addressService.substrateFromSeed(
      this.configService.get<SignerConfig>('signer').substrateSeed,
    );
    return { substrate: accountSubstrate.address, metamask: accountMetamask.address };
  }
}
