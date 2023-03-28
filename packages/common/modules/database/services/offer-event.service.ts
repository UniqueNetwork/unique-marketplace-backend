import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OfferEventEntity } from '../entities';

@Injectable()
export class OfferEventService {
  constructor(
    @InjectRepository(OfferEventEntity)
    private offerEventEntityRepository: Repository<OfferEventEntity>
  ) {}
}
