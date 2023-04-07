import { forwardRef, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(OfferEntity)
    private offersRepository: Repository<OfferEntity>
  ) {}
}
