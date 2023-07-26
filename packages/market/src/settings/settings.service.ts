import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsDto } from './dto/setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BannersService, CollectionEntity, ContractEntity, OfferEntity } from '@app/common/modules/database';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AddressService } from '@app/common/src/lib/address.service';
import { CollectionStatus, CustomObject, OfferStatus } from '@app/common/modules/types';

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
    @InjectRepository(OfferEntity)
    private offerRepository: Repository<OfferEntity>,
    private bannersService: BannersService,
  ) {}

  async prepareSettings() {
    const contracts = await this.contractRepository.find({
      where: {
        version: MoreThanOrEqual(0),
      },
    });

    const settings: SettingsDto = {
      marketType: 'marketType',
      administrators: [],
      blockchain: {
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

  /**
   * Retrieves enabled collection settings based on available offers.
   * @async
   * @function getCollectionSettings
   * @returns {Promise<Object>} Object containing collection settings.
   */
  async getCollectionSettings() {
    const curatedCollections = await this.bannersService.findCuratedCollections();

    // Retrieve distinct collection IDs from offers table
    const offers = await this.offerRepository
      .createQueryBuilder('offers')
      .select('DISTINCT offers.collection_id', 'collection')
      .where('offers.status = :status', { status: OfferStatus.Opened })
      .getRawMany();

    // Extract active collection IDs from offers
    const activeIdCollections = offers.map((item) => item.collection);

    // Query collections with specified IDs and enabled status
    const collectionsData = await this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.status = :status', { status: CollectionStatus.Enabled });

    if (activeIdCollections.length > 0) {
      collectionsData.andWhere('collection.collection_id IN (:...ids)', { ids: activeIdCollections });
    }
    const collections = await collectionsData.getMany();

    // Transform and map collection data into a Map object
    const collectionMap = new Map();
    collections.map((elem) => {
      const { collectionId, allowedTokens, data } = elem;
      const collectionDescription = this.collectionDataTransformation(data);
      collectionMap.set(collectionId, {
        isCurated: curatedCollections.includes(collectionId),
        allowedTokens,
        description: collectionDescription,
      });
    });

    // Return collectionMap as an object
    return Object.fromEntries(collectionMap);
  }

  /**
   * Transforming data from the collection for description
   * @param data
   */
  collectionDataTransformation(data): CollectionDataDescription {
    delete data.schema?.attributesSchema;
    const { id, mode, name, description, owner, tokenPrefix, readOnly, schema } = data;
    return { id, name, description, tokenPrefix, mode, owner, readOnly, schema };
  }
}
