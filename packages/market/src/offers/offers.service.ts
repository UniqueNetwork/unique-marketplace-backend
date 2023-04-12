import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ContractEntity,
  OfferEntity,
  OfferEventEntity,
} from '@app/common/modules/database';
import { Repository } from 'typeorm';
import { OfferEventDto, OffersDto } from './dto/offers.dto';
import { BaseService } from '@app/common/src/lib/base.service';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class OffersService extends BaseService<OfferEntity, OffersDto> {
  constructor(
    @InjectRepository(OfferEventEntity)
    private offersRepository: Repository<OfferEventEntity>
  ) {
    super({});
  }

  async testAddOffer(offer: OfferEventDto) {
    const offers = await this.offersRepository.create(offer);
    await this.offersRepository.insert(offers);
    return offers;
  }

  async getOffers(options: IPaginationOptions): Promise<any> {
    const qb = this.offersRepository
      .createQueryBuilder('event')
      .leftJoinAndMapOne(
        'event.offer',
        OfferEntity,
        'offers',
        'offers.order_id = event.offer_id'
      )
      .leftJoinAndMapOne(
        'offers.contract',
        ContractEntity,
        'contract',
        'contract.address = offers.contract_address'
      );

    const { items, meta } = await paginate(qb, options);
    return {
      meta,
      items,
      attributes: {},
      attributesCount: [],
    };
  }
}
