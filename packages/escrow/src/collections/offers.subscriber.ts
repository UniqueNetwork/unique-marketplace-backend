import { EntitySubscriberInterface, InsertEvent, Repository } from 'typeorm';
import { OfferEntity } from '@app/common/modules/database';
import { Injectable } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { InjectRepository } from '@nestjs/typeorm';
import { getJobName, JOB_HIGH_PRIORITY, JOBS_TABLE_NAME } from './utils';

@Injectable()
export class OffersSubscriber implements EntitySubscriberInterface<OfferEntity> {
  constructor(
    private collectionsService: CollectionsService,
    @InjectRepository(OfferEntity)
    private offerEntityRepository: Repository<OfferEntity>,
  ) {}

  public listenTo() {
    return OfferEntity;
  }

  public async afterInsert(event: InsertEvent<OfferEntity>): Promise<void> {
    const { collectionId, tokenId } = event.entity;

    await this.offerEntityRepository
      .createQueryBuilder()
      .update(JOBS_TABLE_NAME, {
        priority: JOB_HIGH_PRIORITY,
      })
      .where({
        queue_name: getJobName(collectionId, tokenId),
      })
      .execute();

    await this.collectionsService.addNewCollection({ collectionId: collectionId, forceUpdate: false });
  }
}
