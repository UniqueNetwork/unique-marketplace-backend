import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { MarketTradeDto, TradesFilterDto } from './dto/create-trade.dto';
import { PaginationRequest, PaginationResultDto, TradeSortingRequest } from '../offers/dto/offers.dto';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { OfferEntity, OfferEventEntity, PropertiesEntity } from '@app/common/modules/database';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from '../utils/utils';

export interface IMarketTrade {
  id: string;
  collection_id: string;
  token_id: string;
  network: string;
  price: string;
}

@Injectable()
export class TradesService {
  constructor(
    private connection: DataSource,
    @InjectRepository(OfferEntity) private offerEventRepository: Repository<OfferEntity>,
  ) {}
  async get(
    tradesFilter: TradesFilterDto,
    accountId: string | undefined,
    paginationRequest: PaginationRequest,
    sort: TradeSortingRequest,
  ): Promise<any> {
    let tradesQuery: SelectQueryBuilder<OfferEntity>;
    let paginationResult;

    tradesQuery = this.offerEventRepository
      .createQueryBuilder('trade')
      .andWhere('trade.status = :status', { status: 'Completed' });

    // try {

    // this.addRelations(tradesQuery);
    //
    //   tradesQuery = this.filterByCollectionIds(tradesQuery, tradesFilter.collectionId);
    //   tradesQuery = this.filterByTokenIds(tradesQuery, tradesFilter.tokenId);
    //   tradesQuery = this.filterByAccountId(tradesQuery, accountId);
    //   tradesQuery = this.filterBySearchText(tradesQuery, tradesFilter.searchText);
    //   tradesQuery = this.filterByTraits(tradesQuery, tradesFilter.traits, tradesFilter.collectionId);
    //   tradesQuery = this.filterByStatus(tradesQuery, tradesFilter.status);
    //   tradesQuery = this.applySort(tradesQuery, sort);
    //   paginationResult = await paginate(tradesQuery, paginationRequest);
    // } catch (e) {
    //   throw new BadRequestException({
    //     statusCode: HttpStatus.BAD_REQUEST,
    //     message:
    //       'Something went wrong! Perhaps there is no table [market_trade] in the database, the sequence of installation and configuration or failure to sort or filter data.',
    //     error: e.message,
    //   });
    // }
    //
    // try {
    // } catch (e) {
    //   this.logger.error(e.message);
    //   throw new BadRequestException({
    //     statusCode: HttpStatus.BAD_REQUEST,
    //     message: 'Something went wrong! Failure to sort or filter data.',
    //     error: e.message,
    //   });
    // }
    //

    paginationResult = await paginate(tradesQuery, paginationRequest);
    console.dir(paginationRequest, { depth: 10 });
    // return new PaginationResultDto(MarketTradeDto, {
    //   ...paginationResult,
    //   items: paginationResult.items.map(MarketTradeDto.fromTrade),
    // });
  }

  private addRelations(queryBuilder: SelectQueryBuilder<OfferEntity>): void {
    queryBuilder.leftJoinAndMapOne('trade.offer', OfferEventEntity, 'offers', 'trade.offer_id = offers.id');
    // .leftJoinAndMapMany(
    //   'trade.token_properties',
    //   PropertiesEntity,
    //   'token_properties',
    //   'trade.network = token_properties.network and trade.collection_id = token_properties.collection_id and trade.token_id = token_properties.token_id',
    // );
    // .leftJoinAndMapMany(
    //   'trade.token_properties',
    //   (subQuery) => {
    //     return subQuery
    //       .select([
    //         'collection_id',
    //         'network',
    //         'token_id',
    //         'is_trait',
    //         'locale',
    //         'key',
    //         'array_length(items, 1) as count_items',
    //         'items',
    //         'unnest(items) traits',
    //       ])
    //       .from(PropertiesEntity, 'sf')
    //       .where(`sf.type not in ('ImageURL')`);
    //   },
    //   'token_properties',
    //   'trade.network = token_properties.network and trade.offer.collection_id = token_properties.collection_id and trade.offer.token_id = token_properties.token_id',
    // );
  }
}
