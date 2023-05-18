import { Injectable, Logger } from '@nestjs/common';
import { CollectionInfoWithSchemaResponse } from '@unique-nft/sdk/';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { WorkerService } from 'nestjs-graphile-worker';
import { SdkService } from '../app/sdk.service';
import { CollectionSchemaAndChain } from '@app/common/modules/types';

@Injectable()
export class CollectionsService {
  private logger: Logger = new Logger(CollectionsService.name);
  constructor(
    /** Unique SDK */
    private readonly sdkService: SdkService,

    /** Collection Repository */
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,

    /** Token Repository */
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>,

    /** Graphile Worker */
    private readonly graphileWorker: WorkerService,
  ) {}

  /**
   * `Adding collection and tokens to database`
   * @description
   * {@link CollectionsController}
   * @param data
   */
  async addNewCollection(data: { collectionId: number }): Promise<void> {
    const { collectionId } = data;
    try {
      const [collection, tokens, chain] = await Promise.all([
        this.sdkService.getSchemaCollection(collectionId),
        this.sdkService.getTokensCollection(collectionId),
        this.sdkService.getChainProperties(),
      ]);
      if (collection) {
        await this.addTaskForAddCollection({ collection, chain });
        await this.addTaskForAddTokensList(tokens.list, collection.id, chain.token);
        this.logger.log(`Added a collection to work on schema: ${collection.id} and tokens: ${tokens.list.length}`);
      } else {
        this.logger.warn('No found collection or destroyed');
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  /**
   * @async
   * `Task adding a collection`
   * @description The method takes the schema of the collection and sends it to the task to be added to database
   * @param {CollectionInfoWithSchemaResponse} collection - collection information
   * @private
   */
  private async addTaskForAddCollection(collection: CollectionSchemaAndChain) {
    await this.graphileWorker.addJob('collectCollection', collection);
  }

  /**
   * `The task of adding a token to the database and a list of tokens`
   * @description The method creates a task to collect data about the token,
   * get its schema, and store this information in the database.
   * @param {Object} tokens - list of sorted Tokens
   * @param {Number} collectionId - collection ID
   * @private
   * @async
   */
  private async addTaskForAddTokensList(tokens: number[], collectionId: number, network: string) {
    if (tokens.length > 0) {
      tokens.map(async (token) => {
        await this.graphileWorker.addJob('collectTokens', {
          tokenId: token,
          collectionId,
          network,
        });

        await this.graphileWorker.addJob('collectProperties', {
          tokenId: token,
          collectionId,
          network,
        });
      });
    }
  }

  public get(collectionId: number) {
    return this.collectionRepository.findOne({ where: { collectionId } });
  }
}
