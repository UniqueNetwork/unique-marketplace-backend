import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionEntity, OfferEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { WorkerService } from 'nestjs-graphile-worker';
import { SdkService } from '../app/sdk.service';
import { CollectionSchemaAndChain } from '@app/common/modules/types';
import { GraphileService } from './graphile.service';

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
    @InjectRepository(OfferEntity)
    private offersRepository: Repository<OfferEntity>,
    /** Graphile Worker */
    private readonly graphileWorker: WorkerService,
    private readonly graphileService: GraphileService,
  ) {}

  /**
   * `Adding collection and tokens to database`
   * @description Save the collection to the database as well as all the tokens for the collection,
   * check if the collection is present in the database, then do not update the data.
   *
   * `ATTENTION!! Updating data on the collection occurs only through sdk.subscribeCollection`
   *
   * {@link CollectionsController}
   * @param data
   */
  async addNewCollection(data: { collectionId: number; forceUpdate: boolean }): Promise<void> {
    const { collectionId, forceUpdate } = data;
    this.logger.verbose(`Collection ID: ${collectionId} active`);
    const collectionData = await this.collectionRepository.findOne({ where: { collectionId: collectionId } });
    if (collectionData != null && !forceUpdate) {
      return;
    }

    try {
      const [collection, tokens, chain] = await Promise.all([
        this.sdkService.getSchemaCollection(collectionId),
        this.sdkService.getTokensCollection(collectionId),
        this.sdkService.getChainProperties(),
      ]);
      if (collection) {
        if (!collection.info) {
          this.logger.error(`Collection ID: ${collectionId} not found schema! Invalid collection schema!`);
          return;
        }
        await this.addTaskForAddCollection({ collection, chain, tokensCount: tokens.list.length });
        await this.addTaskForAddTokensList(tokens.list, collection.collectionId, chain.token);
        this.logger.log(`Added a collection to work on schema: ${collection.collectionId} and tokens: ${tokens.list.length}`);
        this.logger.verbose(`Collection ID: ${collectionId} saved in database!`);
      } else {
        this.logger.warn('No found collection or destroyed');
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  public get(collectionId: number) {
    return this.collectionRepository.findOne({ where: { collectionId } });
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
   * @param {String} network
   * @private
   * @async
   */
  private async addTaskForAddTokensList(tokens: number[], collectionId: number, network: string) {
    if (tokens.length > 0) {
      for (let i = 0; i < tokens.length; i++) {
        await this.graphileService.addToken(collectionId, tokens[i], network, true);
      }
    }
  }
}
