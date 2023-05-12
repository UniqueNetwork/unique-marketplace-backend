import { Injectable } from "@nestjs/common";
import { TradeOfferDto, TradesFilterDto } from "./dto/create-trade.dto";
import { TradeSortingRequest } from "../offers/dto/offers.dto";
import { DataSource, Repository, SelectQueryBuilder } from "typeorm";

import { TokensEntity, TradeViewEntity } from "@app/common/modules/database";
import { InjectRepository } from "@nestjs/typeorm";
import { paginate } from "nestjs-typeorm-paginate";
import { PaginationRouting } from "@app/common/src/lib/base.constants";
import { nullOrWhitespace } from "../offers/pipes/offer-filter.pipe";
import { equalsIgnoreCase } from "../utils/utils";
import { SortingParameter } from "../offers/interfaces/offers.interface";

export interface IMarketTrade {
  id: string;
  collection_id: string;
  token_id: string;
  network: string;
  price: string;
}

export enum SortingOrder {
  Asc = 0,
  Desc = 1,
}

@Injectable()
export class TradesService {
  private offerSortingColumns = ["Price", "TokenId", "CollectionId", "CreationDate", "Status", "originPrice"];
  private sortingColumns = [...this.offerSortingColumns, "TradeDate"];

  constructor(
    private connection: DataSource,
    @InjectRepository(TradeViewEntity) private tradeViewRepository: Repository<TradeViewEntity>
  ) {
  }

  async get(
    tradesFilter: TradesFilterDto,
    accountId: string | undefined,
    paginationRequest: PaginationRouting,
    sort: TradeSortingRequest
  ): Promise<any> {
    let tradesQuery: SelectQueryBuilder<TradeViewEntity>;
    let paginationResult;

    tradesQuery = this.tradeViewRepository.createQueryBuilder("trade");

    // try {

    //
    tradesQuery = this.filterByCollectionIds(tradesQuery, tradesFilter.collectionId);
    tradesQuery = this.filterByTokenIds(tradesQuery, tradesFilter.tokenId);
    tradesQuery = this.filterByAccountId(tradesQuery, accountId);
    tradesQuery = this.filterBySearchText(tradesQuery, tradesFilter.searchText);
    //   tradesQuery = this.filterByTraits(tradesQuery, tradesFilter.traits, tradesFilter.collectionId);

    tradesQuery = this.sortBy(tradesQuery, sort);
    paginationResult = await paginate(tradesQuery, paginationRequest);

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


    //console.dir(paginationResult, { depth: 3 });
    return {
      ...paginationResult.meta,
      items: paginationResult.items.map(TradeOfferDto.parseItem)
    };
  }

  sortBy(query: SelectQueryBuilder<TradeViewEntity>, sort: TradeSortingRequest): SelectQueryBuilder<TradeViewEntity> {
    if (sort && sort.sort) {
      const sortParameters: SortingParameter[] = Array.isArray(sort.sort)
        ? sort.sort
        : [
          {
            column: "Price",
            order: SortingOrder.Asc
          }
        ];
      sortParameters.forEach((sortParameter) => {
        const { column, order } =
          typeof sortParameter === "string"
            ? {
              column: (sortParameter as string).split("(")[1].replace(")", ""),
              order: (sortParameter as string).startsWith("asc") ? SortingOrder.Asc : SortingOrder.Desc
            }
            : sortParameter;
        switch (column) {
          case "Price":
            query.addOrderBy("trade.price_parsed", order === SortingOrder.Asc ? "ASC" : "DESC");
            break;
          case "TokenId":
            query.addOrderBy("trade.token_id", order === SortingOrder.Asc ? "ASC" : "DESC");
            break;
          case "CollectionId":
            query.addOrderBy("trade.collection_id", order === SortingOrder.Asc ? "ASC" : "DESC");
            break;
          case "TradeDate":
            query.addOrderBy("trade.trade_date", order === SortingOrder.Asc ? "ASC" : "DESC");
            break;
          default:
            break;
        }
      });
    } else {
      query.addOrderBy("trade.trade_date", "DESC");
    }
    return query;
  }

  private filterByCollectionIds(
    query: SelectQueryBuilder<TradeViewEntity>,
    collectionIds: number[] | undefined
  ): SelectQueryBuilder<TradeViewEntity> {
    if (collectionIds == null || collectionIds.length <= 0) {
      return query;
    }

    return query.andWhere("trade.collection_id in (:...collectionIds)", { collectionIds });
  }

  private filterByTokenIds(
    query: SelectQueryBuilder<TradeViewEntity>,
    tokenIds: number[] | undefined
  ): SelectQueryBuilder<TradeViewEntity> {
    if (tokenIds === null || tokenIds.length <= 0) {
      return query;
    }
    return query.andWhere("trade.token_id in (:...tokenIds)", { tokenIds });
  }

  private filterByAccountId(
    query: SelectQueryBuilder<TradeViewEntity>,
    accountId: string | undefined
  ): SelectQueryBuilder<TradeViewEntity> {
    if (nullOrWhitespace(accountId)) {
      return query;
    }
    console.dir(accountId, { depth: 10 });
    return query.andWhere("(trade.seller = :accountId OR trade.buyer = :accountId)", {
      accountId: accountId
    });
  }

  private filterBySearchText(
    query: SelectQueryBuilder<TradeViewEntity>,
    search_text?: string
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
      // if (Number(text + 0)) {
      //   query.orWhere(`trade.token_id = :tokenId`, { tokenId: Number(text) });
      // }
    }
    return query;
  }
}
