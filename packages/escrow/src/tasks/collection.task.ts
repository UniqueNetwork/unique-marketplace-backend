import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { SdkService } from '../app/sdk.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Helpers } from 'graphile-worker';
import { CollectionEntity } from '@app/common/modules/database';
import { CollectionActive, CollectionMode, CollectionSchemaAndChain, DecodedCollection } from '@app/common/modules/types';

@Injectable()
@Task('collectCollection')
export class CollectionTask {
  private logger = new Logger(CollectionTask.name);

  constructor(
    private sdkService: SdkService,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
  ) {}

  /**
   * Collection Task Handler
   * @description Incoming data handler. Processes data on the `collectCollection` event
   * @param collectionDto
   * @param helpers
   */
  @TaskHandler()
  async handler(collectionDto: CollectionSchemaAndChain, helpers: Helpers): Promise<void> {
    const { collection, chain, tokensCount } = collectionDto;
    const { collectionId, description, name, owner, mode, tokenPrefix } = collection;
    const { token } = chain;
    const decodedCollection: DecodedCollection = {
      decimalPoints: collection['decimals'] || 0,
      tokensTotal: tokensCount,
      tokensCount: 0,
      tokensOnMarket: 0,
      collectionId,
      owner,
      mode: mode as CollectionMode,
      tokenPrefix,
      name,
      description,
      data: collection,
      active: CollectionActive.true,
      network: token,
    };
    try {
      const collectionExist = await this.collectionRepository.findOne({
        where: { collectionId },
      });

      if (collectionExist) {
        await this.collectionRepository.update({ id: collectionExist.id }, decodedCollection);
        this.logger.log(`Collection id ${collectionId} updated!`);
      } else {
        const entity = this.collectionRepository.create(decodedCollection);
        entity.metadata = entity.metadata || '{}';
        await this.collectionRepository.save({
          ...entity,
        });
        this.logger.log(`Collection id ${collectionId} saved!`);
      }
    } catch (e) {
      this.logger.error(`E1000 collectionId: ${collectionId} ${e.message}`);
    }
  }
}
