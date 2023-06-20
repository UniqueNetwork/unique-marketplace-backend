import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferEntity, OfferEventEntity } from '../entities';
import { OfferEventType } from '../../types';

@Injectable()
export class OfferEventService {
  constructor(
    @InjectRepository(OfferEventEntity)
    private offerEventEntityRepository: Repository<OfferEventEntity>,
  ) {}

  public find(
    offer: OfferEntity,
    eventType: OfferEventType,
    blockNumber: number,
    address: string,
  ): Promise<OfferEventEntity | null> {
    return this.offerEventEntityRepository.findOne({
      where: {
        offer,
        eventType,
        blockNumber,
        address,
      },
    });
  }

  public async create(offerEvent: Omit<OfferEventEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfferEventEntity> {
    const event = this.offerEventEntityRepository.create({
      ...offerEvent,
      meta: '{}',
    });
    await this.offerEventEntityRepository.save(event);

    return event;
  }
}
