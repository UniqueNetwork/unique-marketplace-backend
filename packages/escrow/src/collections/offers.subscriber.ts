import { EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { OfferEntity } from '@app/common/modules/database';
import { Injectable } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Injectable()
export class OffersSubscriber implements EntitySubscriberInterface<OfferEntity> {
  constructor(private collectionsService: CollectionsService) {}

  public listenTo() {
    return OfferEntity;
  }

  public async afterInsert(event: InsertEvent<OfferEntity>): Promise<void> {
    await this.collectionsService.addNewCollection({ collectionId: event.entity.collectionId, forceUpdate: false });
  }
}
