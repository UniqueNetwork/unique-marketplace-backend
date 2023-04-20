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
    const offerEvent = {
      offer,
      eventType,
      blockNumber,
      address,
      amount,
      meta: '{}',
    };
    const event = this.offerEventEntityRepository.create(offerEvent);
    console.dir({ event }, { depth: 10 });
    await this.offerEventEntityRepository.save(event);

    return event;
  }
}
