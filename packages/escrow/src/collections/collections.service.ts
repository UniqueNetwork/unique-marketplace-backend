import { Inject, Injectable, Logger } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk/full';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { CollectionMode, DecodedCollection } from '@app/common/modules/types';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { pgNotifyClient } from '@app/common/pg-transport/pg-notify-client.symbol';
import { PgTransportClient } from '@app/common/pg-transport/pg-transport.client';

@Injectable()
export class CollectionsService {
  logger: Logger = new Logger(CollectionsService.name);
  constructor(
    private readonly sdk: Sdk,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>
  ) {}

  async addNewCollection(data) {
    const { collectionId } = data;
    try {
      const collectionNew = await this.sdk.collections.get(data);
      const decodedCollection: DecodedCollection = {
        collectionId: data.collectionId,
        owner: collectionNew?.owner,
        mode: collectionNew?.mode as CollectionMode,
        tokenPrefix: collectionNew?.tokenPrefix,
        name: collectionNew?.name,
        description: collectionNew?.description,
        data: collectionNew,
      };
      const collectionExist = await this.collectionRepository.findOne({
        where: { collectionId: collectionId },
      });

      const entity = this.collectionRepository.create(decodedCollection);
      if (collectionExist) {
        await this.collectionRepository.update(
          { id: collectionExist.id },
          decodedCollection
        );
        this.logger.log(`Collection id ${data.collectionId} updated!`);
      } else {
        await this.collectionRepository.save({
          ...entity,
        });
        this.logger.log(`Collection id ${data.collectionId} saved!`);
      }
    } catch (e) {
      this.logger.error(
        `E1000 collectionId: ${data.collectionId} ${e.message}`
      );
    }
  }
}
