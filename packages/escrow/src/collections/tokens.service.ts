import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { WorkerService } from 'nestjs-graphile-worker';
import { CollectionEntity } from '@app/common/modules/database';
import { SdkService } from '../app/sdk.service';
import { CollectionData } from '@unique-nft/sdk/full';
import { Address } from '@unique-nft/utils';
import { AddressService } from '@app/common/src/lib/address.service';

@Injectable()
export class TokensService {
  private logger: Logger = new Logger(TokensService.name);

  constructor(
    private sdk: SdkService,
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    /** Graphile Worker */
    private readonly graphileWorker: WorkerService,
    private readonly addressService: AddressService,
  ) {}

  /**
   * Observes a collection and token ID for changes and updates the database accordingly.
   *
   * @async
   * @param {number} collectionId - The ID of the collection to observe.
   * @param {number} tokenId - The ID of the token to observe.
   * @param {CollectionData} [data] - Additional data from SDK.
   */
  async observer(collectionId: number, tokenId: number, data?: CollectionData) {
    const collection = await this.collectionRepository.findOne({ where: { collectionId: collectionId } });

    if (collection) {
      const chain = await this.sdk.getChainProperties();
      let listTokenUpdate: { collectionId: number; tokenId: number; network: string }[] = []; // Инициализируем переменную как массив
      console.dir({ update: 'begin', listTokenUpdate }, { depth: 10 });
      // Add the tokenId, collectionId, network chain to the list for update

      if (data && data.parsed) {
        const { parsed } = data;
        const addressNestedTo = await this.addressService.getParentCollectionAndToken(parsed.addressTo);

        if (addressNestedTo) {
          listTokenUpdate = await this.getListBundles({ ...addressNestedTo, network: chain.token });
        }

        const addressNested = await this.addressService.getParentCollectionAndToken(parsed.address);
        if (addressNested) {
          listTokenUpdate = await this.getListBundles({ ...addressNested, network: chain.token }); // Исправляем ошибку
        }
      }
      listTokenUpdate.push({ collectionId, tokenId, network: chain.token });
      console.dir({ update: 'list', listTokenUpdate }, { depth: 10 });
      listTokenUpdate.map(async (item) => await this.addUpdateTokenAndProperties(item));
    }
  }

  /**
   * Extracts collection and token IDs from the given data.
   *
   * @param {Object} data - The data to extract IDs from.
   * @returns {Array.<{collectionId: number, tokenId: number, network: string}>} An array of objects with collection ID, token ID, and network fields.
   */
  extractCollectionAndTokenIds(data): { collectionId: number; tokenId: number; network: string }[] {
    let result = [{ collectionId: data.collectionId, tokenId: data.tokenId, network: '' }];

    if (data.nestingChildTokens) {
      for (let child of data.nestingChildTokens) {
        result = [...result, ...this.extractCollectionAndTokenIds(child)];
      }
    }

    return result;
  }

  /**
   * Gets a list of bundles for the given item.
   *
   * @async
   * @param {{collectionId: number, tokenId: number, network: string}} item - The item to get bundles for.
   * @returns {Promise.<Array.<{collectionId: number, tokenId: number, network: string}>>} A promise that resolves to an array of objects with collection ID, token ID, and network fields.
   */
  async getListBundles(item: { collectionId: number; tokenId: number; network: string }): Promise<any> {
    let bundles;
    const checkoutBundle = await this.sdk.isBundle(item.tokenId, item.collectionId);
    if (checkoutBundle.isBundle) {
      const result = await this.sdk.getBundle(item.tokenId, item.collectionId);
      bundles = this.extractCollectionAndTokenIds(result).map((bundle) => ({ ...bundle, network: item.network }));
    }
    return bundles;
  }

  /**
   * Updates the token and properties for the given item.
   * Payload data to GraphileWorker in to list job
   * @async
   * @param {{collectionId: number, tokenId: number, network: string}} item - The item to add or update.
   */
  private async addUpdateTokenAndProperties(item: { collectionId: number; tokenId: number; network: string }) {
    const { collectionId, tokenId, network } = item;
    await this.graphileWorker.addJob('collectTokens', {
      tokenId,
      collectionId,
      network,
    });

    await this.graphileWorker.addJob('collectProperties', {
      tokenId,
      collectionId,
      network,
    });
  }
}
