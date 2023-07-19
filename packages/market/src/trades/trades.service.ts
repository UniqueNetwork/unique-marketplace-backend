import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { TradeOfferDto, TradesFilterDto } from './dto/create-trade.dto';

import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { TradeViewEntity, ViewOffers } from '@app/common/modules/database';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { nullOrWhitespace } from '../offers/pipes/offer-filter.pipe';
import { SortingOrder, SortingParameter } from '../offers/interfaces/offers.interface';
import { SortingOfferRequest, SortingRequest } from '@app/common/modules/types/requests';

/**
 * Service for managing trades.
 */

@Injectable()
export class TradesService {
  constructor(
    private connection: DataSource,
    @InjectRepository(TradeViewEntity) private tradeViewRepository: Repository<TradeViewEntity>,
  ) {}

  /**
   * Get a list of trades filtered and sorted according to the provided parameters.
   * @param tradesFilter - The filter parameters for the trades.
   * @param accountId - The ID of the account to filter by.
   * @param paginationRequest - The pagination parameters for the trades.
   * @param sort - The sorting parameters for the trades.
   * @returns A paginated list of trades.
   */
  async get(
    tradesFilter: TradesFilterDto,
    accountId: string | undefined,
    paginationRequest: PaginationRouting,
    sort: SortingRequest,
  ): Promise<any> {
    let tradesQuery: SelectQueryBuilder<TradeViewEntity>;
    let paginationResult;

    tradesQuery = this.tradeViewRepository.createQueryBuilder('trade');

    try {
      tradesQuery = this.filterByAccountId(tradesQuery, accountId);
      tradesQuery = this.filterByCollectionIds(tradesQuery, tradesFilter.collectionId);
      tradesQuery = this.filterByTokenIds(tradesQuery, tradesFilter.tokenId);
      tradesQuery = this.filterBySearchText(tradesQuery, tradesFilter.searchText);
      //   tradesQuery = this.filterByTraits(tradesQuery, tradesFilter.traits, tradesFilter.collectionId);

      tradesQuery = this.sortBy(tradesQuery, sort);
    } catch (e) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'Something went wrong! Perhaps there is no table [market_trade] in the database, the sequence of installation and configuration or failure to sort or filter data.',
        error: e.message,
      });
    }

    try {
      paginationResult = await paginate(tradesQuery, paginationRequest);
    } catch (e) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong! Failure to sort or filter data.',
        error: e.message,
      });
    }

    return {
      ...paginationResult.meta,
      items: paginationResult.items.map(TradeOfferDto.parseItem),
    };
  }

  /**
   * Sort the trades according to the provided parameters.
   * @param query - The query builder for the trades.
   * @param sort - The sorting parameters for the trades.
   * @returns The sorted query builder.
   */
  sortBy(query: SelectQueryBuilder<TradeViewEntity>, sortFilter: SortingOfferRequest): SelectQueryBuilder<TradeViewEntity> {
    if (!sortFilter || !sortFilter.sort) {
      return query;
    }

    const { sort } = sortFilter;
    if (sort) {
      sort.map((filter) => {
        switch (filter.column) {
          case 'Price':
            query.addOrderBy('trade.price_parsed', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'TokenId':
            query.addOrderBy('trade.token_id', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'CollectionId':
            query.addOrderBy('trade.collection_id', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'CreationDate':
            query.addOrderBy('trade.trade_date', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          default:
            query.addOrderBy('trade.trade_date', 'DESC');
            break;
        }
      });
    }
    return query;
  }

  /**
   * Filter the trades by collection IDs.
   * @param query - The query builder for the trades.
   * @param collectionIds - The collection IDs to filter by.
   * @returns The filtered query builder.
   */
  private filterByCollectionIds(
    query: SelectQueryBuilder<TradeViewEntity>,
    collectionIds: number[] | undefined,
  ): SelectQueryBuilder<TradeViewEntity> {
    if (collectionIds == null || collectionIds.length <= 0) {
      return query;
    }

    return query.andWhere('trade.collection_id in (:...collectionIds)', { collectionIds });
  }

  /**
   * Filter the trades by token IDs.
   * @param query - The query builder for the trades.
   * @param tokenIds - The token IDs to filter by.
   * @returns The filtered query builder.
   */
  private filterByTokenIds(
    query: SelectQueryBuilder<TradeViewEntity>,
    tokenIds: number[] | undefined,
  ): SelectQueryBuilder<TradeViewEntity> {
    if (tokenIds === null || tokenIds.length <= 0) {
      return query;
    }
    return query.andWhere('trade.token_id in (:...tokenIds)', { tokenIds });
  }

  /**
   * Filter the trades by account ID.
   * @param query - The query builder for the trades.
   * @param accountId - The account ID to filter by.
   * @returns The filtered query builder.
   */
  private filterByAccountId(
    query: SelectQueryBuilder<TradeViewEntity>,
    accountId: string | undefined,
  ): SelectQueryBuilder<TradeViewEntity> {
    if (nullOrWhitespace(accountId)) {
      return query;
    }
    return query.andWhere('(trade.seller = :accountId OR trade.buyer = :accountId)', {
      accountId: accountId,
    });
  }

  /**
   * Filter the trades by search text.
   * @param query - The query builder for the trades.
   * @param search_text - The search text to filter by.
   * @returns The filtered query builder.
   */
  private filterBySearchText(
    query: SelectQueryBuilder<TradeViewEntity>,
    search_text?: string,
  ): SelectQueryBuilder<TradeViewEntity> {
    if (!nullOrWhitespace(search_text)) {
      if (/^\d+$/.test(search_text)) {
        query.andWhere(`trade.token_id = :search_text`, { search_text });
      } else {
        query.andWhere(`trade.data->>'attributes' ILIKE CONCAT('%', :search_text::text, '%')`, { search_text });
        query.orWhere(`trade.data->>'properties' ILIKE CONCAT('%', :search_text::text, '%')`, { search_text });
        query.orWhere(`trade.data->>'tokenPrefix' ILIKE CONCAT('%', :search_text::text, '%')`, { search_text });
        query.orWhere(`trade.data->>'name' ILIKE CONCAT('%', :search_text::text, '%')`, { search_text });
      }
    }
    return query;
  }
}
