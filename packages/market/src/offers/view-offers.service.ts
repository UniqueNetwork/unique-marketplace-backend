import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferEntity, ViewOffers } from '@app/common/modules/database';
import { DataSource, Repository, SelectQueryBuilder, ValueTransformer } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { OfferAttributes, OffersDto, OffersFilter, OfferSortingRequest, PaginationRequest } from './dto/offers.dto';
import { BundleService } from './bundle.service';
import { OfferTraits, TraitDto } from './dto/trait.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { SortingOrder, SortingParameter } from './interfaces/offers.interface';

type SortMapping<T> = Partial<Record<keyof OffersDto, keyof T>>;

const offersMapping = {
  priceRaw: 'price_raw',
  priceParsed: 'price_parsed',
  token_id: 'token_id',
  collection_id: 'collection_id',
};

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
    this.offersSorts = this.prepareMapping(offersMapping, connection.getMetadata(OfferEntity).columns);
    console.dir(this.offersSorts, { depth: 10 });
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

  private byCollectionId(query: SelectQueryBuilder<ViewOffers>, collectionIds?: number[]): SelectQueryBuilder<ViewOffers> {
    if ((collectionIds ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('view_offers.collection_id in (:...collectionIds)', { collectionIds });
  }

  private byMaxPrice(query: SelectQueryBuilder<ViewOffers>, maxPrice?: bigint): SelectQueryBuilder<ViewOffers> {
    if (!maxPrice) {
      return query;
    }
    return query.andWhere('view_offers.offer_price_parsed <= :maxPrice', {
      maxPrice: priceTransformer.to(maxPrice),
    });
  }

  private byMinPrice(query: SelectQueryBuilder<ViewOffers>, minPrice?: bigint): SelectQueryBuilder<ViewOffers> {
    if (!minPrice) {
      return query;
    }
    return query.andWhere('view_offers.offer_price_parsed >= :minPrice', {
      minPrice: priceTransformer.to(minPrice),
    });
  }

  private bySeller(query: SelectQueryBuilder<ViewOffers>, seller?: string): SelectQueryBuilder<ViewOffers> {
    if (nullOrWhitespace(seller)) {
      query.andWhere('view_offers.offer_status = :status', { status: 'Opened' });
      return query;
    }
    return query
      .andWhere('view_offers.offer_seller = :seller', { seller })
      .andWhere('view_offers.offer_status in (:...offer_status)', { offer_status: ['Opened'] });
  }

  private byLocale(query: SelectQueryBuilder<ViewOffers>, locale?: string): SelectQueryBuilder<ViewOffers> {
    if (nullOrWhitespace(locale)) {
      return query;
    }
    return query.andWhere('view_offers.locale = :locale', { locale });
  }

  private byTrait(query: SelectQueryBuilder<ViewOffers>, trait?: string): SelectQueryBuilder<ViewOffers> {
    if (nullOrWhitespace(trait)) {
      return query;
    }
    return query.andWhere(`view_offers.traits ilike concat('%', cast(:trait as text), '%')`, { trait });
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
        query
          .andWhere(`view_offers.collection_id in (:...collectionIds)`, { collectionIds })
          .andWhere('array [:...traits] <@ view_offers.list_items', { traits: attributes });
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
        'view_offers_offer_price_parsed as offer_price_parsed',
        'view_offers_offer_price_raw as offer_price_raw',
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

  private sortBy(query: SelectQueryBuilder<ViewOffers>, sortBy: OfferSortingRequest): SelectQueryBuilder<ViewOffers> {
    query = this.applyFlatSort(query, sortBy);
    return query;
  }

  private byAttributes(query: SelectQueryBuilder<ViewOffers>): SelectQueryBuilder<any> {
    const attributes = this.connection.manager
      .createQueryBuilder()
      .select(['key', 'traits as trait ', 'count(traits) over (partition by traits, key) as count'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['view_offers_key as key', 'view_offers_traits as traits'])
          .from(`(${query.getQuery()})`, '_filter')
          .setParameters(query.getParameters())
          .where('view_offers_traits is not null')
          .andWhere('view_offers_locale is not null');
      }, '_filter');
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

  applyFlatSort(query: SelectQueryBuilder<any>, { sort = [] }: OfferSortingRequest) {
    console.dir({ sort }, { depth: 10 });
    for (const sortingParameter of sort) {
      const sort = this.getFlatSort(sortingParameter);
      if (sort) {
        const order = this.getOrder(sortingParameter);
        query.addOrderBy(sort, order);
      }
    }
    return query;
  }

  private async byAttributesCount(query: SelectQueryBuilder<ViewOffers>): Promise<Array<OfferAttributes>> {
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
      .andWhere('view_offers.collection_id = :collectionId', { collectionId })
      .andWhere('view_offers.token_id = :tokenId', { tokenId })
      .andWhere('view_offers.offer_status in (:...status)', { status: ['Opened', 'removed_by_admin'] });
  }

  public async filterByOne(collectionId: number, tokenId: number): Promise<any> {
    let queryFilter = this.viewOffersRepository
      .createQueryBuilder('view_offers')
      .where({ collection_id: collectionId, token_id: tokenId });
    // TODO: deal with the error by bundles, collector may be fail
    // const bundle = await this.bundle(collectionId, tokenId);
    // queryFilter = this.byCollectionTokenId(queryFilter, bundle.collectionId, bundle.tokenId);
    queryFilter = this.prepareQuery(queryFilter);
    const itemQuery = this.pagination(queryFilter, { page: 1, pageSize: 1 });
    const items = await itemQuery.query.getRawMany();
    return items;
  }

  public async bundle(collectionId: number, tokenId: number): Promise<{ collectionId: number; tokenId: number }> {
    return this.bundleService.bundle(collectionId, tokenId);
  }

  public async filter(offersFilter: OffersFilter, pagination: PaginationRequest, sort: OfferSortingRequest): Promise<any> {
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

    const attributes = await this.byAttributes(queryFilter).getRawMany();

    queryFilter = this.prepareQuery(queryFilter);
    //
    const itemsCount = await this.countQuery(queryFilter);
    //
    queryFilter = this.sortBy(queryFilter, sort);
    //
    const itemQuery = this.pagination(queryFilter, pagination);
    //
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
