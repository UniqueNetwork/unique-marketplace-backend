import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferEntity, ViewOffers } from '@app/common/modules/database';
import { DataSource, Repository, SelectQueryBuilder, ValueTransformer } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { OfferAttributes, OffersFilter, OfferSortingRequest, PaginationRequest } from './dto/offers.dto';
import { BundleService } from './bundle.service';
import { OfferTraits, TraitDto } from './dto/trait.dto';
import { paginateRaw } from 'nestjs-typeorm-paginate';
import { GetOneFilter, SortingOrder, SortingParameter } from './interfaces/offers.interface';
import { HelperService } from '@app/common/src/lib/helper.service';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { SortingOfferRequest } from '@app/common/modules/types/requests';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

const offersMapping = {
  priceRaw: 'price_raw',
  priceParsed: 'price_parsed',
  token_id: 'token_id',
  collection_id: 'collection_id',
};

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.offersSorts = this.prepareMapping(offersMapping, connection.getMetadata(OfferEntity).columns);
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
        .from(ViewOffers, 'view_offers')
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
            .from(ViewOffers, 'view_offers')
            .where('collection_id in (:...collectionIds)', { collectionIds })
            .andWhere('total_items is not null');

          if (seller) {
            qb.andWhere('offer_status = :status', { status: 'Opened' });
          } else {
            qb.andWhere('view_offers.offer_status in (:...offer_status)', {
              offer_status: ['Opened'],
            });
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

  applyFlatSort(query: SelectQueryBuilder<any>, { sort = [] }: OfferSortingRequest) {
    for (const sortingParameter of sort) {
      const sort = this.getFlatSort(sortingParameter);
      if (sort) {
        const order = this.getOrder(sortingParameter);
        query.addOrderBy(sort, order);
      }
    }
    return query;
  }

  public async filterByOne(whereFilter: GetOneFilter): Promise<any> {
    const { collectionId, tokenId, offerId } = whereFilter;
    const where: { collection_id?: number; token_id?: number; offerId?: string } = {};

    if (offerId) {
      where.offerId = offerId;
    } else if (collectionId && tokenId) {
      where.collection_id = collectionId;
      where.token_id = tokenId;
    }

    let queryFilter = this.viewOffersRepository.createQueryBuilder('view_offers').where(where);

    // TODO: deal with the error by bundles, collector may be fail
    // const bundle = await this.bundle(collectionId, tokenId);
    // queryFilter = this.byCollectionTokenId(queryFilter, bundle.collectionId, bundle.tokenId);
    queryFilter = this.prepareQuery(queryFilter);
    const itemQuery = this.pagination(queryFilter, { page: 1, pageSize: 1 });

    return await itemQuery.query.getRawMany();
  }

  public async bundle(collectionId: number, tokenId: number): Promise<{ collectionId: number; tokenId: number }> {
    return this.bundleService.bundle(collectionId, tokenId);
  }

  //Method for simultaneously fetching filtered items and attributes
  public async filter(offersFilter: OffersFilter, pagination: PaginationRouting, sort: SortingOfferRequest): Promise<any> {
    let queryFilter = this.viewOffersRepository.createQueryBuilder('view_offers');
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

    const attributes = await this.byAttributes(queryFilter);

    queryFilter = this.prepareQuery(queryFilter);
    queryFilter = this.sortBy(queryFilter, sort);
    //
    const itemQuery = await paginateRaw(queryFilter, pagination);
    //

    return {
      meta: itemQuery.meta,
      items: itemQuery.items,
      attributes: this.parseAttributes(attributes),
      attributesCount,
    };
  }

  public applyCommonFilters(queryFilter: SelectQueryBuilder<ViewOffers>, offersFilter: OffersFilter): any {
    queryFilter = this.byCollectionId(queryFilter, offersFilter.collectionId);
    queryFilter = this.byMaxPrice(queryFilter, offersFilter.maxPrice);
    queryFilter = this.byMinPrice(queryFilter, offersFilter.minPrice);
    queryFilter = this.byMaxUsdtPrice(queryFilter, offersFilter.maxUsdtPrice);
    queryFilter = this.byMinUsdtPrice(queryFilter, offersFilter.minUsdtPrice);
    queryFilter = this.byCurrency(queryFilter, offersFilter.currencies);
    queryFilter = this.bySeller(queryFilter, offersFilter.seller);
    queryFilter = this.bySearch(queryFilter, offersFilter.searchText, offersFilter.searchLocale);
    queryFilter = this.byFindAttributes(queryFilter, offersFilter.collectionId, offersFilter.attributes);
    return queryFilter;
  }

  public async fetchAttributes(offersFilter: OffersFilter) {
    let queryFilter = this.viewOffersRepository.createQueryBuilder('view_offers');
    queryFilter = this.applyCommonFilters(queryFilter, offersFilter);
    const attributesCount = await this.byAttributesCount(queryFilter);
    queryFilter = this.byNumberOfAttributes(queryFilter, offersFilter.numberOfAttributes);

    const attributes = await this.byAttributes(queryFilter);

    return {
      attributes: this.parseAttributes(attributes),
      attributesCount,
    };
  }

  public async filterItems(offersFilter: OffersFilter, pagination: PaginationRouting, sort: SortingOfferRequest): Promise<any> {
    let queryFilter = this.viewOffersRepository.createQueryBuilder('view_offers');
    queryFilter = this.applyCommonFilters(queryFilter, offersFilter);
    queryFilter = this.byNumberOfAttributes(queryFilter, offersFilter.numberOfAttributes);
    queryFilter = this.prepareQuery(queryFilter);
    queryFilter = this.sortBy(queryFilter, sort);
    const itemQuery = await paginateRaw(queryFilter, pagination);

    return {
      meta: itemQuery.meta,
      items: itemQuery.items,
    };
  }

  sortBy(query: SelectQueryBuilder<ViewOffers>, sortFilter: SortingOfferRequest): SelectQueryBuilder<ViewOffers> {
    if (!sortFilter || !sortFilter.sort) {
      return query;
    }

    const { sort } = sortFilter;
    if (sort) {
      sort.map((filter) => {
        switch (filter.column) {
          case 'Price':
            query.addOrderBy('view_offers_offer_price_parsed', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'TokenId':
            query.addOrderBy('view_offers_token_id', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'CollectionId':
            query.addOrderBy('view_offers_collection_id', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'CreationDate':
            query.addOrderBy('view_offers_offer_created_at', filter.order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          default:
            query.addOrderBy('view_offers_offer_created_at', 'DESC');
            break;
        }
      });
    }
    return query;
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

  private byCollectionId(query: SelectQueryBuilder<ViewOffers>, collectionIds?: number[]): SelectQueryBuilder<ViewOffers> {
    if ((collectionIds ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('view_offers.collection_id in (:...collectionIds)', { collectionIds });
  }

  private byMaxPrice(query: SelectQueryBuilder<ViewOffers>, maxPrice?: number): SelectQueryBuilder<ViewOffers> {
    if (!maxPrice) {
      return query;
    }
    return query.andWhere('view_offers.offer_price_parsed <= :maxPrice', {
      maxPrice: priceTransformer.to(maxPrice),
    });
  }

  private byMinPrice(query: SelectQueryBuilder<ViewOffers>, minPrice?: number): SelectQueryBuilder<ViewOffers> {
    if (!minPrice) {
      return query;
    }
    return query.andWhere('view_offers.offer_price_parsed >= :minPrice', {
      minPrice: priceTransformer.to(minPrice),
    });
  }

  private byMaxUsdtPrice(query: SelectQueryBuilder<ViewOffers>, maxPrice?: number): SelectQueryBuilder<ViewOffers> {
    if (!maxPrice) {
      return query;
    }
    return query.andWhere('view_offers.price_in_usdt <= :maxPrice', {
      maxPrice: priceTransformer.to(maxPrice),
    });
  }

  private byMinUsdtPrice(query: SelectQueryBuilder<ViewOffers>, minPrice?: number): SelectQueryBuilder<ViewOffers> {
    if (!minPrice) {
      return query;
    }
    return query.andWhere('view_offers.price_in_usdt >= :minPrice', {
      minPrice: priceTransformer.to(minPrice),
    });
  }

  private byCurrency(query: SelectQueryBuilder<ViewOffers>, currencies?: number[]): SelectQueryBuilder<ViewOffers> {
    if ((currencies ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('view_offers.offer_currency in (:...currencies)', { currencies });
  }

  private bySeller(query: SelectQueryBuilder<ViewOffers>, seller?: string): SelectQueryBuilder<ViewOffers> {
    if (HelperService.nullOrWhitespace(seller)) {
      query.andWhere('view_offers.offer_status = :status', { status: 'Opened' });
      return query;
    }
    return query
      .andWhere('view_offers.offer_seller = :seller', { seller })
      .andWhere('view_offers.offer_status in (:...offer_status)', { offer_status: ['Opened'] });
  }

  private byLocale(query: SelectQueryBuilder<ViewOffers>, locale?: string): SelectQueryBuilder<ViewOffers> {
    if (HelperService.nullOrWhitespace(locale)) {
      return query;
    }
    return query.andWhere('view_offers.locale = :locale', { locale });
  }

  private byTrait(query: SelectQueryBuilder<ViewOffers>, trait?: string): SelectQueryBuilder<ViewOffers> {
    if (HelperService.nullOrWhitespace(trait)) {
      return query;
    }

    const collectionId = +trait || 0;

    if (collectionId) {
      return query.andWhere(
        `(view_offers.traits ilike concat('%', cast(:trait as text), '%') or collection_id = :collectionId)`,
        {
          trait,
          collectionId,
        },
      );
    } else {
      return query.andWhere(`view_offers.traits ilike concat('%', cast(:trait as text), '%')`, {
        trait,
      });
    }
  }

  private byNumberOfAttributes(
    query: SelectQueryBuilder<ViewOffers>,
    numberOfAttributes?: number[],
  ): SelectQueryBuilder<ViewOffers> {
    if ((numberOfAttributes ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('view_offers.total_items in (:...numberOfAttributes)', { numberOfAttributes });
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
        // Use EXISTS for better performance instead of array contains
        query
          .andWhere(`view_offers.collection_id in (:...collectionIds)`, { collectionIds })
          .andWhere(`
            EXISTS (
              SELECT 1 FROM properties p 
              WHERE p.collection_id = view_offers.collection_id 
                AND p.token_id = view_offers.token_id 
                AND p.list_items && :traits
            )
          `, { traits: attributes });
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
        'view_offers_offer_id as offer_id',
        'view_offers_offer_order_id as offer_order_id',
        'view_offers_offer_status as offer_status',
        'view_offers_collection_id as collection_id',
        'view_offers_token_id as token_id',
        'view_offers_contract_address as contract_address',
        'view_offers_offer_price_parsed as offer_price_parsed',
        'view_offers_price_in_usdt as offer_price_in_usdt',
        'view_offers_offer_price_raw as offer_price_raw',
        'view_offers_offer_currency as offer_currency',
        'view_offers_offer_seller as offer_seller',
        'view_offers_offer_created_at as offer_created_at',
      ])
      .distinct()
      .from(`(${query.getQuery()})`, '_filter')
      .setParameters(query.getParameters());
  }

  private async countQuery(query: SelectQueryBuilder<ViewOffers>): Promise<number> {
    const countQuery = this.connection.manager
      .createQueryBuilder()
      .select('count(offer_id) as count')
      .from(`(${query.getQuery()})`, '_count')
      .setParameters(query.getParameters());

    const count = await countQuery.getRawOne();
    return +count?.count || 0;
  }

  private sortByTwo(query: SelectQueryBuilder<ViewOffers>, sortBy: OfferSortingRequest): SelectQueryBuilder<ViewOffers> {
    query = this.applyFlatSort(query, sortBy);
    return query;
  }

  private async byAttributes(query: SelectQueryBuilder<ViewOffers>): Promise<any[]> {
    // Create cache key based on query parameters
    const cacheKey = `attributes_${JSON.stringify(query.getParameters())}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Use more efficient query with unnest only for needed data
    const attributes = await this.connection.manager
      .createQueryBuilder()
      .select(['key', 'unnest(traits) as trait', 'count(unnest(traits)) over (partition by unnest(traits), key) as count'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['view_offers_key as key', 'view_offers_traits as traits'])
          .from(`(${query.getQuery()})`, '_filter')
          .setParameters(query.getParameters())
          .where('view_offers_traits is not null')
          .andWhere('view_offers_locale is not null');
      }, '_filter')
      .getRawMany();

    // Cache result for 5 minutes
    await this.cacheManager.set(cacheKey, attributes, 300000);
    
    return attributes;
  }

  private getOrder(sortingParameter: SortingParameter): 'DESC' | 'ASC' {
    return sortingParameter.order === SortingOrder.Desc ? 'DESC' : 'ASC';
  }

  private getFlatSort(sortingParameter: SortingParameter): string | undefined {
    switch (sortingParameter.column) {
      case 'price':
        return 'offer_price_parsed';
      case 'tokenid':
        return 'token_id';
      case 'creationDate':
        return 'offer_created_at';
    }
  }

  private async byAttributesCount(query: SelectQueryBuilder<ViewOffers>): Promise<Array<OfferAttributes>> {
    // Create cache key based on query parameters
    const cacheKey = `attributes_count_${JSON.stringify(query.getParameters())}`;
    
    // Try to get from cache
    const cached = await this.cacheManager.get<Array<OfferAttributes>>(cacheKey);
    if (cached) {
      return cached;
    }

    const attributesCount = (await this.connection.manager
      .createQueryBuilder()
      .select(['total_items as "numberOfAttributes"', 'count(offer_id) over (partition by total_items) as amount'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['view_offers_total_items as total_items', 'view_offers_offer_id as offer_id'])
          .from(`(${query.getQuery()})`, '_filter')
          .distinct()
          .setParameters(query.getParameters())
          .where('view_offers_total_items is not null');
      }, '_filter')
      .getRawMany()) as any as Array<OfferAttributes>;
    
    const result = attributesCount.map((item) => {
      return {
        numberOfAttributes: +item.numberOfAttributes,
        amount: +item.amount,
      };
    });

    // Cache result for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);
    
    return result;
  }

  private byCollectionTokenId(
    query: SelectQueryBuilder<ViewOffers>,
    collectionId: number,
    tokenId: number,
  ): SelectQueryBuilder<any> {
    return query
      .andWhere('view_offers.collection_id = :collectionId', { collectionId })
      .andWhere('view_offers.token_id = :tokenId', { tokenId })
      .andWhere('view_offers.offer_status in (:...status)', { status: ['Opened', 'removed_by_admin'] });
  }
}
