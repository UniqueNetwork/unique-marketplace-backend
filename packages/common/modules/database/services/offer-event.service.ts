import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferEventEntity } from '../entities';
import { OfferEventType } from '../../types';

@Injectable()
export class OfferEventService {
  constructor(
    @InjectRepository(OfferEventEntity)
    private offerEventEntityRepository: Repository<OfferEventEntity>
  ) {}

  public async create(
    offerId: string,
    eventType: OfferEventType,
    blockNumber: number,
    addressFrom: string
  ): Promise<OfferEventEntity> {
    const event = this.offerEventEntityRepository.create();

    event.offerId = offerId;
    event.eventType = eventType;
    event.blockNumber = blockNumber;
    event.addressFrom = addressFrom;

    await this.offerEventEntityRepository.save(event);

    return event;
  }
}
