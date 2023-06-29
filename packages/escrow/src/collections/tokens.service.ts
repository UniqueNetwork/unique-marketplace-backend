import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { WorkerService } from 'nestjs-graphile-worker';
import { CollectionEntity, PropertiesEntity } from '@app/common/modules/database';
import { SdkService } from '../app/sdk.service';
import { CollectionData } from '@unique-nft/sdk/full';
import { AddressService } from '@app/common/src/lib/address.service';
import { EventMethod } from '@app/common/modules/types';
import { GraphileService } from './graphile.service';

export interface TokenCollectionUpdate {
  collectionId: number;
  tokenId: number;
  network: string;
}

@Injectable()
export class TokensService {
  private logger: Logger = new Logger(TokensService.name);

  constructor(
    private sdk: SdkService,
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>,
    @InjectRepository(PropertiesEntity)
    private propertiesRepository: Repository<PropertiesEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    /** Graphile Worker */
    private readonly graphileWorker: WorkerService,
    private readonly addressService: AddressService,
    private readonly graphileService: GraphileService,
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
      //Check token lives in the chain
      try {
        await this.sdk.getTokenSchema(collectionId, tokenId);
      } catch (e) {
        await this.cleanTokenAndProperties(collectionId, tokenId, chain.token);
        this.logger.error('Token not found or burned!');
        return;
      }

      const tokenMap = new Map<string, TokenCollectionUpdate>();

      if (data && data.parsed) {
        const { parsed } = data;
        const { event } = parsed;

        if (event.method === EventMethod.ITEM_DESTROYED) {
          await this.cleanTokenAndProperties(collectionId, tokenId, chain.token);
          return;
        }

        const addressNestedTo = await this.addressService.getParentCollectionAndToken(parsed.addressTo);
        if (addressNestedTo !== undefined) {
          tokenMap.set(`${addressNestedTo?.collectionId}-${addressNestedTo?.tokenId}-${chain.token}`, {
            ...addressNestedTo,
            network: chain.token,
          });
        }

        const addressNested = await this.addressService.getParentCollectionAndToken(parsed.address);
        if (addressNested !== undefined) {
          tokenMap.set(`${addressNested?.collectionId}-${addressNested?.tokenId}-${chain.token}`, {
            ...addressNested,
            network: chain.token,
          });
        }
        // Add the tokenId, collectionId, network chain to the list for update
        if (event.method === EventMethod.ITEM_CREATED || event.method === EventMethod.TRANSFER) {
          tokenMap.set(`${collectionId}-${tokenId}-${chain.token}`, { collectionId, tokenId, network: chain.token });
          Array.from(tokenMap.values()).map((item) => this.addUpdateTokenAndProperties(item));
        }
      } else {
        tokenMap.set(`${collectionId}-${tokenId}-${chain.token}`, { collectionId, tokenId, network: chain.token });
        Array.from(tokenMap.values()).map((item) => this.addUpdateTokenAndProperties(item));
      }
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
      for (const child of data.nestingChildTokens) {
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

    await this.graphileService.addToken(collectionId, tokenId, network, false);
  }

  private async cleanTokenAndProperties(collectionId: number, tokenId: number, network: string) {
    const propertiesEntities = await this.propertiesRepository.find({
      where: { collection_id: collectionId, token_id: tokenId, network },
    });
    const tokenEntities = await this.tokensRepository.find({
      where: { collectionId, tokenId, network },
    });
    if (propertiesEntities.length > 0) {
      // Delete the index
      const deleteProperties = await this.propertiesRepository.delete({
        collection_id: collectionId,
        token_id: tokenId,
        network,
      });
      this.logger.log(
        `Deleted properties of token: ${tokenId} in ${network} > ${deleteProperties.affected} records collection: ${collectionId}`,
      );
    }
    if (tokenEntities.length > 0) {
      // Delete the index
      const deleteToken = await this.tokensRepository.delete({
        collectionId,
        tokenId,
        network,
      });
      this.logger.log(`Deleted token: ${tokenId} in ${network} > ${deleteToken.affected} records collection: ${collectionId}`);
    }
  }
}
