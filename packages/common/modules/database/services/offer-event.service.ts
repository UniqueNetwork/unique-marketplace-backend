import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferEventEntity } from '../entities';
import { TokensService } from '../../../../escrow/src/collections/tokens.service';

@Injectable()
export class OfferEventService {
  constructor(
    @InjectRepository(OfferEventEntity)
    private offerEventEntityRepository: Repository<OfferEventEntity>,
  ) {}

  public async create(offerEvent: Omit<OfferEventEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfferEventEntity> {
    const event = this.offerEventEntityRepository.create({
      ...offerEvent,
      meta: '{}',
    });
    await this.offerEventEntityRepository.save(event);

    return event;
  }
}
