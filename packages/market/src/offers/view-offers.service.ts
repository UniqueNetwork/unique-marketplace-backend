import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferEntity, ViewOffers } from '@app/common/modules/database';
import { DataSource, Repository, SelectQueryBuilder, ValueTransformer } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { OfferAttributes, OffersDto, OffersFilter, OfferSortingRequest, PaginationRequest } from './dto/offers.dto';
import { BundleService } from './bundle.service';
import { OfferTraits, TraitDto } from './dto/trait.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

// type SortMapping<T> = Partial<Record<keyof OffersDto, keyof T>>;
//
// const offersMapping: SortMapping<OfferEntity> = {
//   priceRaw: 'price_raw',
//   priceParsed: 'price_parsed',
//   tokenId: 'token_id',
//   collectionId: 'collection_id',
// };

const regex = /\S/;
export function nullOrWhitespace(str: string | null | undefined): boolean {
  return str == null || !regex.test(str);
}

const priceTransformer: ValueTransformer = {
  to: (value) => {
    return value?.toString();
  },
  from: (value) => {
    if (value == null) {
      return null;
    }

    return BigInt(value);
  },
};

@Injectable()
export class ViewOffersService {
  private logger = new Logger(ViewOffersService.name);
  private readonly offersSorts: Record<string, string>;

  constructor(
    private connection: DataSource,
    @InjectRepository(ViewOffers) private viewOffersRepository: Repository<ViewOffers>,
    private readonly bundleService: BundleService,
  ) {
    // this.offersSorts = this.prepareMapping(offersMapping, connection.getMetadata(OfferEntity).columns);
  }
  prepareMapping = (input: Record<string, string>, columnMetadata: ColumnMetadata[]): Record<string, string> => {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const meta = columnMetadata.find((m) => m.propertyName === value);

      return meta
        ? {
            ...acc,
            [key.toLowerCase()]: meta.databaseNameWithoutPrefixes,
          }
        : acc;
    }, {});
  };

  public async attributes(collectionId: number): Promise<OfferTraits | null> {
    let attributes = [];
    try {
      attributes = (await this.connection.manager
        .createQueryBuilder()
        .select(['key', 'traits as trait ', 'count(traits) over (partition by traits, key) as count'])
        .distinct()
        .from(ViewOffers, 'v_offers_search')
        .where('collection_id = :collectionId', { collectionId })
        .andWhere('traits is not null')
        .andWhere('locale is not null')
        .getRawMany()) as Array<TraitDto>;
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Error while fetching attributes',
        error: error.message,
      });
    }

    return {
      collectionId,
      attributes: this.parseAttributes(attributes),
    };
  }

  private parseAttributes(attributes: any[]): TraitDto[] {
    return attributes.reduce((previous, current) => {
      const tempObj = {
        key: current['trait'],
        count: +current['count'],
      };

      if (!previous[current['key']]) {
        previous[current['key']] = [];
      }

      previous[current['key']].push(tempObj);
      return previous;
    }, {});
  }

  /**
   * Get the attributes with count for the given collection
   * @param collectionIds
   * @returns
   */
  public async attributesCount(collectionIds: number[], seller?: string): Promise<Array<OfferAttributes>> {
    try {
      const counts = (await this.connection.manager
        .createQueryBuilder()
        .select(['total_items as "numberOfAttributes"', 'count(offer_id) over (partition by total_items) as amount'])
        .distinct()
        .from((qb) => {
          qb.select(['total_items', 'offer_id'])
            .distinct()
            .from(ViewOffers, 'v_offers_search')
            .where('collection_id in (:...collectionIds)', { collectionIds })
            .andWhere('total_items is not null');

          if (seller) {
            qb.andWhere('offer_status = :status', { status: 'active' });
          } else {
            qb.andWhere('v_offers_search.offer_status in (:...offer_status)', { offer_status: ['active', 'removed_by_admin'] });
          }
          return qb;
        }, '_offers')
        .getRawMany()) as Array<OfferAttributes>;

      return counts.map((item) => {
        return {
          numberOfAttributes: +item.numberOfAttributes,
          amount: +item.amount,
        };
      });
    } catch (e) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Could not find any attributes for collection ${collectionIds.join(',')}`,
        error: e.message,
      });
    }
  }

  private byCollectionId(query: SelectQueryBuilder<ViewOffers>, collectionIds?: number[]): SelectQueryBuilder<ViewOffers> {
    if ((collectionIds ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('v_offers_search.collection_id in (:...collectionIds)', { collectionIds });
  }

  private byMaxPrice(query: SelectQueryBuilder<ViewOffers>, maxPrice?: bigint): SelectQueryBuilder<ViewOffers> {
    if (!maxPrice) {
      return query;
    }
    return query.andWhere('v_offers_search.offer_price <= :maxPrice', {
      maxPrice: priceTransformer.to(maxPrice),
    });
  }

  private byMinPrice(query: SelectQueryBuilder<ViewOffers>, minPrice?: bigint): SelectQueryBuilder<ViewOffers> {
    if (!minPrice) {
      return query;
    }
    return query.andWhere('v_offers_search.offer_price >= :minPrice', {
      minPrice: priceTransformer.to(minPrice),
    });
  }

  private bySeller(query: SelectQueryBuilder<ViewOffers>, seller?: string): SelectQueryBuilder<ViewOffers> {
    if (nullOrWhitespace(seller)) {
      query.andWhere('v_offers_search.offer_status = :status', { status: 'Opened' });
      return query;
    }
    return query
      .andWhere('v_offers_search.offer_seller = :seller', { seller })
      .andWhere('v_offers_search.offer_status in (:...offer_status)', { offer_status: ['Opened'] });
  }

  private byLocale(query: SelectQueryBuilder<ViewOffers>, locale?: string): SelectQueryBuilder<ViewOffers> {
    if (nullOrWhitespace(locale)) {
      return query;
    }
    return query.andWhere('v_offers_search.locale = :locale', { locale });
  }

  private byTrait(query: SelectQueryBuilder<ViewOffers>, trait?: string): SelectQueryBuilder<ViewOffers> {
    if (nullOrWhitespace(trait)) {
      return query;
    }
    return query.andWhere(`v_offers_search.traits ilike concat('%', cast(:trait as text), '%')`, { trait });
  }

  private byNumberOfAttributes(
    query: SelectQueryBuilder<ViewOffers>,
    numberOfAttributes?: number[],
  ): SelectQueryBuilder<ViewOffers> {
    if ((numberOfAttributes ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('v_offers_search.total_items in (:...numberOfAttributes)', { numberOfAttributes });
  }

  private byFindAttributes(
    query: SelectQueryBuilder<ViewOffers>,
    collectionIds?: number[],
    attributes?: string[],
  ): SelectQueryBuilder<ViewOffers> {
    if ((attributes ?? []).length <= 0) {
      return query;
    } else {
      if ((collectionIds ?? []).length <= 0) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'You must provide a collection id to filter by traits',
        });
      } else {
        query
          .andWhere('v_offers_search.collection_id in (:...collectionIds)', { collectionIds })
          .andWhere('array [:...traits] <@ v_offers_search.list_items', { traits: attributes });
      }
    }
    return query;
  }

  private bySearch(query: SelectQueryBuilder<ViewOffers>, search?: string, locale?: string): SelectQueryBuilder<ViewOffers> {
    query = this.byTrait(query, search);
    query = this.byLocale(query, locale);
    return query;
  }

  private pagination(
    query: SelectQueryBuilder<ViewOffers>,
    pagination: PaginationRequest,
  ): { query: SelectQueryBuilder<ViewOffers>; page: number; pageSize: number } {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const queryLimit = query.limit(pageSize).offset(offset);

    return {
      query: queryLimit,
      page,
      pageSize,
    };
  }

  private prepareQuery(query: SelectQueryBuilder<ViewOffers>): SelectQueryBuilder<any> {
    return this.connection
      .createQueryBuilder()
      .select([
        'v_offers_search_offer_id as offer_id',
        'v_offers_search_offer_order_id as offer_order_id',
        'v_offers_search_offer_status as offer_status',
        'v_offers_search_collection_id as collection_id',
        'v_offers_search_token_id as token_id',
        'v_offers_search_offer_price_parsed as offer_price_parsed',
        'v_offers_search_offer_price_raw as offer_price_raw',
        'v_offers_search_offer_seller as offer_seller',
        'v_offers_search_offer_created_at as offer_created_at',
      ])
      .distinct()
      .from(`(${query.getQuery()})`, '_filter')
      .setParameters(query.getParameters());
  }

  private async countQuery(query: SelectQueryBuilder<ViewOffers>): Promise<number> {
    const countQuery = this.connection
      .createQueryBuilder()
      .select('count(offer_id) as count')
      .from(`(${query.getQuery()})`, '_count')
      .setParameters(query.getParameters());

    const count = await countQuery.getRawOne();
    return +count?.count || 0;
  }

  private sortBy(query: SelectQueryBuilder<ViewOffers>, sortBy: OfferSortingRequest): SelectQueryBuilder<ViewOffers> {
    //    query = {}; //this.offersQuerySortHelper.applyFlatSort(query, sortBy);
    return query;
  }

  private byAttributes(query: SelectQueryBuilder<ViewOffers>): SelectQueryBuilder<any> {
    const attributes = this.connection.manager
      .createQueryBuilder()
      .select(['key', 'traits as trait ', 'count(traits) over (partition by traits, key) as count'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['v_offers_search_key as key', 'v_offers_search_traits as traits'])
          .from(`(${query.getQuery()})`, '_filter')
          .setParameters(query.getParameters())
          .where('v_offers_search_traits is not null')
          .andWhere('v_offers_search_locale is not null');
      }, '_filter');
    return attributes;
  }

  private async byAttributesCount(query: SelectQueryBuilder<ViewOffers>): Promise<Array<OfferAttributes>> {
    const attributesCount = (await this.connection.manager
      .createQueryBuilder()
      .select(['total_items as "numberOfAttributes"', 'count(offer_id) over (partition by total_items) as amount'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['v_offers_search_total_items as total_items', 'v_offers_search_offer_id as offer_id'])
          .from(`(${query.getQuery()})`, '_filter')
          .distinct()
          .setParameters(query.getParameters())
          .where('v_offers_search_total_items is not null');
      }, '_filter')
      .getRawMany()) as Array<OfferAttributes>;

    return attributesCount.map((item) => {
      return {
        numberOfAttributes: +item.numberOfAttributes,
        amount: +item.amount,
      };
    });
  }

  private byCollectionTokenId(
    query: SelectQueryBuilder<ViewOffers>,
    collectionId: number,
    tokenId: number,
  ): SelectQueryBuilder<any> {
    return query
      .andWhere('v_offers_search.collection_id = :collectionId', { collectionId })
      .andWhere('v_offers_search.token_id = :tokenId', { tokenId })
      .andWhere('v_offers_search.offer_status in (:...status)', { status: ['active', 'removed_by_admin'] });
  }

  public async filterByOne(collectionId: number, tokenId: number, options: IPaginationOptions): Promise<any> {
    let queryFilter = this.viewOffersRepository.createQueryBuilder('v_offers_search');
    const bundle = await this.bundle(collectionId, tokenId);
    queryFilter = this.byCollectionTokenId(queryFilter, bundle.collectionId, bundle.tokenId);
    queryFilter = this.prepareQuery(queryFilter);

    const items = await paginate(queryFilter, options);
    return items;
  }

  public async bundle(collectionId: number, tokenId: number): Promise<{ collectionId: number; tokenId: number }> {
    return this.bundleService.bundle(collectionId, tokenId);
  }

  public async filter(offersFilter: OffersFilter, pagination: PaginationRequest, sort: OfferSortingRequest): Promise<any> {
    let queryFilter = this.viewOffersRepository.createQueryBuilder('v_offers_search');

    // Filert by collection id
    queryFilter = this.byCollectionId(queryFilter, offersFilter.collectionId);
    // Filter by max price
    queryFilter = this.byMaxPrice(queryFilter, offersFilter.maxPrice);
    // Filter by min price
    queryFilter = this.byMinPrice(queryFilter, offersFilter.minPrice);
    // Filter by seller address
    queryFilter = this.bySeller(queryFilter, offersFilter.seller);
    // Filter by search
    queryFilter = this.bySearch(queryFilter, offersFilter.searchText, offersFilter.searchLocale);

    // Filter by traits
    queryFilter = this.byFindAttributes(queryFilter, offersFilter.collectionId, offersFilter.attributes);
    // Does not contain a search by the number of attributes
    const attributesCount = await this.byAttributesCount(queryFilter);
    // Exceptions to the influence of the search by the number of attributes
    queryFilter = this.byNumberOfAttributes(queryFilter, offersFilter.numberOfAttributes);

    const attributes = await this.byAttributes(queryFilter).getRawMany();

    queryFilter = this.prepareQuery(queryFilter);

    const itemsCount = await this.countQuery(queryFilter);

    queryFilter = this.sortBy(queryFilter, sort);

    const itemQuery = this.pagination(queryFilter, pagination);

    const items = await itemQuery.query.getRawMany();

    return {
      items,
      itemsCount,
      page: itemQuery.page,
      pageSize: itemQuery.pageSize,
      attributes: this.parseAttributes(attributes),
      attributesCount,
    };
  }
}
