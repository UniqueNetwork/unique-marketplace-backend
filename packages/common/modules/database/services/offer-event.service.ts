import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferEntity, OfferEventEntity } from '../entities';
import { OfferEventType } from '../../types';

@Injectable()
export class OfferEventService {
  constructor(
    @InjectRepository(OfferEventEntity)
    private offerEventEntityRepository: Repository<OfferEventEntity>
  ) {}

  public async create(
    offer: OfferEntity,
    eventType: OfferEventType,
    blockNumber: number,
    address: string,
    amount: number | bigint
  ): Promise<OfferEventEntity> {
    const event = this.offerEventEntityRepository.create();

    event.offer = offer;
    event.eventType = eventType;
    event.blockNumber = blockNumber;
    event.address = address;

    await this.offerEventEntityRepository.save(event);

    return event;
  }
}
