import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferEntity } from '@app/common/modules/database';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OffersDto } from './dto/offers.dto';
import { BaseService } from '../utils/base.service';

@Injectable()
export class OffersService extends BaseService<OfferEntity, OffersDto> {
  constructor(
    @InjectRepository(OfferEntity)
    private offersRepository: Repository<OfferEntity>
  ) {
    super({});
  }

  async testAddOffer(offer: OffersDto) {
    const offers = await this.offersRepository.create(offer);
    await this.offersRepository.insert(offers);
    return offers;
  }

  async getOffers(): Promise<any> {
    const qb = this.offersRepository.createQueryBuilder();

    return await this.getDataAndCountMany(qb);
  }
}
