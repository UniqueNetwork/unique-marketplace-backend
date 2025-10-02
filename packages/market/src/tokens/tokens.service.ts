import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { CollectionEntity, PropertiesEntity, TokensViewer } from '@app/common/modules/database';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { OfferPrice, OffersFilterType, OffersItemType, SortingRequest } from '@app/common/modules/types/requests';
import { AccessoryTypes, SaleTypes, TokensViewDto, TokensViewFilterDto } from './dto/tokens.dto';
import { paginateRaw } from 'nestjs-typeorm-paginate';
import { HelperService } from '@app/common/src/lib/helper.service';
import { OfferAttributes } from '../offers/dto/offers.dto';
import { TraitDto } from '../offers/dto/trait.dto';
import { SortingOrder, SortingParameter } from '../offers/interfaces/offers.interface';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(
    private connection: DataSource,
    @InjectRepository(TokensViewer)
    private tokenViewRepository: Repository<TokensViewer>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
  ) {}

  /**
   * Asynchronously finds tokens by the given collection ID, filter, pagination, and sorting.
   *
   * @async
   * @param {number} collectionId - The ID of the collection to search tokens by.
   * @param {TokensViewFilterDto} tokensFilterDto - The filter to apply to the token search.
   * @param {PaginationRouting} paginationRequest - The pagination parameters for the token search.
   * @param {SortingRequest} sort - The sorting parameters for the token search.
   * @returns {Promise<Array>} - A promise that resolves to an array of token objects found by the given collection ID, filter, pagination, and sorting.
   */
  async findTokensByCollection(
    collectionId: number,
    tokensFilterDto: TokensViewFilterDto,
    paginationRequest: PaginationRouting,
    sort: SortingRequest,
  ): Promise<TokensViewDto> {
    let tokens;
    let items = [];
    let propertiesFilter = [];
    let collections = [];

    tokens = await this.filter(collectionId, tokensFilterDto, paginationRequest, sort);

    propertiesFilter = await this.searchInProperties(this.parserCollectionIdTokenId(tokens.items));
    collections = await this.collections(this.getCollectionIds(tokens.items));

    items = this.parseItems(tokens.items, propertiesFilter, collections) as any as Array<TokensViewer>;
    try {
    } catch (e) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong!',
        error: e.message,
      });
    }

    return {
      ...tokens.meta,
      items,
      attributes: tokens.attributes,
      attributesCount: tokens.attributesCount,
    };
  }

  /**
   * Asynchronously filters tokens by the given collection ID, filter, pagination, and sorting.
   *
   * @async
   * @param {number} collectionId - The ID of the collection to filter tokens by.
   * @param {TokensViewFilterDto} tokensFilterDto - The filter to apply to the token search.
   * @param {PaginationRouting} pagination - The pagination parameters for the token search.
   * @param {SortingRequest} sort - The sorting parameters for the token search.
   */
  async filter(collectionId: number, tokensFilterDto: TokensViewFilterDto, pagination: PaginationRouting, sort: SortingRequest) {
    let paginationResult;
    let queryFilter: SelectQueryBuilder<TokensViewer> = this.tokenViewRepository.createQueryBuilder('view_tokens');

    queryFilter = this.byTokenId(queryFilter, tokensFilterDto.tokenId);
    // Filter by max price
    queryFilter = this.byMaxPrice(queryFilter, tokensFilterDto.maxPrice);
    // Filter by min price
    queryFilter = this.byMinPrice(queryFilter, tokensFilterDto.minPrice);
    // Filter by accessory type
    queryFilter = this.byAccessoryType(queryFilter, tokensFilterDto.accessoryType, tokensFilterDto.address);
    // Filter by on sale
    queryFilter = this.bySaleType(queryFilter, tokensFilterDto.saleType);
    // Filter by search
    queryFilter = this.bySearch(queryFilter, tokensFilterDto.searchText, tokensFilterDto.searchLocale);

    // Filter by traits
    queryFilter = this.byFindAttributes(queryFilter, collectionId, tokensFilterDto.attributes);
    // Does not contain a search by the number of attributes
    const attributesCount = await this.byAttributesCount(queryFilter, collectionId);
    // Exceptions to the influence of the search by the number of attributes
    queryFilter = this.byNumberOfAttributes(queryFilter, tokensFilterDto.numberOfAttributes);

    const attributes = await this.byAttributes(queryFilter, collectionId).getRawMany();

    queryFilter = this.prepareQuery(queryFilter, collectionId);

    queryFilter = this.sortBy(queryFilter, sort);

    paginationResult = await paginateRaw<TokensViewer>(queryFilter, pagination);

    return {
      meta: paginationResult.meta,
      items: paginationResult.items,
      attributes: this.parseAttributes(attributes),
      attributesCount,
    };
  }

  async collections(ids: Array<number>): Promise<Array<CollectionEntity>> {
    return this.collectionRepository.find({ where: { collectionId: In(ids) } });
  }

  sortBy(query: SelectQueryBuilder<TokensViewer>, sort: SortingRequest): SelectQueryBuilder<TokensViewer> {
    if (sort && sort.sort) {
      const sortParameters: SortingParameter[] = Array.isArray(sort.sort)
        ? sort.sort
        : [
            {
              column: 'Price',
              order: SortingOrder.Asc,
            },
          ];
      sortParameters.forEach((sortParameter) => {
        const { column, order } =
          typeof sortParameter === 'string'
            ? {
                column: (sortParameter as string).split('(')[1].replace(')', ''),
                order: (sortParameter as string).startsWith('asc') ? SortingOrder.Asc : SortingOrder.Desc,
              }
            : sortParameter;
        switch (column) {
          case 'Price':
            query.addOrderBy('view_tokens_offer_price_parsed', order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'TokenId':
            query.addOrderBy('view_tokens_token_id', order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'CollectionId':
            query.addOrderBy('view_tokens_collection_id', order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          case 'CreationDate':
            query.addOrderBy('view_tokens_offer_created_at', order === SortingOrder.Asc ? 'ASC' : 'DESC');
            break;
          default:
            break;
        }
      });
    } else {
      query.addOrderBy('view_tokens_token_id', 'ASC');
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

  private byAttributes(query: SelectQueryBuilder<TokensViewer>, collectionId: number): SelectQueryBuilder<any> {
    const attributes = this.connection.manager
      .createQueryBuilder()
      .select(['key', 'traits as trait ', 'count(traits) over (partition by traits, key) as count'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['view_tokens_key as key', 'view_tokens_traits as traits'])
          .from(`(${query.getQuery()})`, '_filter')
          .setParameters(query.getParameters())
          .where('view_tokens_traits is not null')
          .andWhere('view_tokens_locale is not null')
          .andWhere(`view_tokens_collection_id = :collectionId`, { collectionId });
      }, '_filter');

    return attributes;
  }

  private byNumberOfAttributes(
    query: SelectQueryBuilder<TokensViewer>,
    numberOfAttributes?: number[],
  ): SelectQueryBuilder<TokensViewer> {
    if ((numberOfAttributes ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('view_tokens.total_items in (:...numberOfAttributes)', { numberOfAttributes });
  }

  private byFindAttributes(
    query: SelectQueryBuilder<TokensViewer>,
    collectionId?: number,
    attributes?: string[],
  ): SelectQueryBuilder<TokensViewer> {
    if ((attributes ?? []).length <= 0) {
      return query;
    } else {
      query
        .andWhere(`view_tokens.collection_id = :collectionId`, { collectionId })
        .andWhere('array [:...traits] <@ view_tokens.list_items', { traits: attributes });
    }
    return query;
  }

  private async byAttributesCount(query: SelectQueryBuilder<TokensViewer>, collectionId): Promise<Array<OfferAttributes>> {
    const attributesCount = (await this.connection.manager
      .createQueryBuilder()
      .select(['total_items as "numberOfAttributes"', 'count(token_id) over (partition by total_items) as amount'])
      .distinct()
      .from((qb) => {
        return qb
          .select(['view_tokens_total_items as total_items', 'view_tokens_token_id as token_id'])
          .from(`(${query.getQuery()})`, '_filter')
          .distinct()
          .setParameters(query.getParameters())
          .where('view_tokens_total_items is not null')
          .andWhere(`view_tokens_collection_id = :collectionId`, { collectionId });
      }, '_filter')
      .getRawMany()) as any as Array<OfferAttributes>;
    return attributesCount.map((item) => {
      return {
        numberOfAttributes: +item.numberOfAttributes,
        amount: +item.amount,
      };
    });
  }

  private byMaxPrice(query: SelectQueryBuilder<TokensViewer>, maxPrice?: number): SelectQueryBuilder<TokensViewer> {
    if (!maxPrice) {
      return query;
    }
    return query.andWhere('view_tokens.offer_price_parsed <= :maxPrice', {
      maxPrice: HelperService.priceTransformer(maxPrice, 'to'),
    });
  }

  private byMinPrice(query: SelectQueryBuilder<TokensViewer>, minPrice?: number): SelectQueryBuilder<TokensViewer> {
    if (!minPrice) {
      return query;
    }
    return query.andWhere('view_tokens.offer_price_parsed >= :minPrice', {
      minPrice: HelperService.priceTransformer(minPrice, 'to'),
    });
  }

  private byAccessoryType(
    query: SelectQueryBuilder<TokensViewer>,
    accessoryType?: AccessoryTypes,
    seller?: string,
  ): SelectQueryBuilder<TokensViewer> {
    if (!accessoryType || accessoryType === AccessoryTypes.All || HelperService.nullOrWhitespace(seller)) return query;

    if (accessoryType === AccessoryTypes.Owned) {
      return query.andWhere('view_tokens.offer_seller = :seller', { seller });
    }

    if (accessoryType === AccessoryTypes.Disowned) {
      return query.andWhere('view_tokens.offer_seller != :seller', { seller });
    }

    this.logger.warn(`filter:byAccessoryType, invalid accessoryType: ${accessoryType}`);

    return query;
  }

  private bySaleType(query: SelectQueryBuilder<TokensViewer>, saleType?: SaleTypes): SelectQueryBuilder<TokensViewer> {
    if (!saleType || saleType === SaleTypes.All) return query;

    if (saleType === SaleTypes.OnSale) {
      return query.andWhere('view_tokens.offer_status in (:...offer_status)', { offer_status: ['Opened'] });
    }

    if (saleType === SaleTypes.NotForSale) {
      return query.andWhere('view_tokens.offer_status is null');
    }

    this.logger.warn(`filter:bySaleType, invalid saleType: ${saleType}`);

    return query;
  }

  private bySearch(query: SelectQueryBuilder<TokensViewer>, search?: string, locale?: string): SelectQueryBuilder<TokensViewer> {
    query = this.byTrait(query, search);
    query = this.byLocale(query, locale);
    return query;
  }

  private byLocale(query: SelectQueryBuilder<TokensViewer>, locale?: string): SelectQueryBuilder<TokensViewer> {
    if (HelperService.nullOrWhitespace(locale)) {
      return query;
    }
    return query.andWhere('view_tokens.locale = :locale', { locale });
  }

  private byTrait(query: SelectQueryBuilder<TokensViewer>, trait?: string): SelectQueryBuilder<TokensViewer> {
    if (HelperService.nullOrWhitespace(trait)) {
      return query;
    }
    return query.andWhere(`view_tokens.traits ilike concat('%', cast(:trait as text), '%')`, { trait });
  }

  private getCollectionIds(items: Array<any>): Array<number> {
    return [...new Set(items.map((item) => +item.collection_id))].filter((id) => id !== null && id !== 0);
  }

  private parseItems(
    items: Array<OffersFilterType>,
    searchIndex: Partial<PropertiesEntity>[],
    collections: Array<CollectionEntity>,
  ): Array<OffersItemType> {
    const collectionData = new Map();

    function isEmpty(value: string | number): number | string | null {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return value;
    }

    function convertorFlatToObject(): (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any {
      return (acc, item) => {
        collectionData.set(item.token_id.toString(), item);

        const token = searchIndex.find((index) => index.collection_id === item.collection_id && index.token_id === item.token_id);
        const collection = collections.find((collection) => collection.collectionId === item.collection_id);
        const schemaData = collection?.data['schema'];
        const price = { 
          parsed: +item.offer_price_parsed, 
          raw: item.offer_price_raw,
          currency: item.offer_price_currency
        } as OfferPrice;
        const schema = {
          attributesSchemaVersion: isEmpty(schemaData?.attributesSchemaVersion),
          coverPicture: isEmpty(schemaData?.coverPicture),
          image: isEmpty(schemaData?.image),
          schemaName: isEmpty(schemaData?.schemaName),
          schemaVersion: isEmpty(schemaData?.schemaVersion),
          collectionId: isEmpty(schemaData?.collectionId),
        };
        const obj = {
          collectionId: +item.collection_id,
          tokenId: +item.token_id,
          orderId: item.offer_id,
          status: item.offer_status,
          price: price,
          seller: item.offer_seller,
          created_at: item.offer_created_at,
          updated_at: item.offer_updated_at,
          tokenDescription: token ? token?.attributes : null,
          collectionDescription: {
            mode: collection?.mode,
            name: collection?.name,
            description: collection?.description,
            tokenPrefix: collection?.tokenPrefix,
            id: collection?.id,
            owner: collection?.owner,
            schema,
          },
        };
        acc.push(obj);
        return acc;
      };
    }

    return items.reduce(convertorFlatToObject(), []);
  }

  private async searchInProperties(sqlValues: string): Promise<Array<Partial<PropertiesEntity>>> {
    if (sqlValues) {
      const properties = await this.connection.manager.getRepository(PropertiesEntity).metadata.tableName;
      const result = await this.connection.manager.query(
        `select
            si.collection_id,
            si.token_id,
            si.attributes
        from ${properties} si  inner join (${sqlValues}) t on
        t.collection_id = si.collection_id and
        t.token_id = si.token_id;`,
      );
      return result as Array<Partial<PropertiesEntity>>;
    }
    return [];
  }

  private parserCollectionIdTokenId(items: Array<any>): string | null {
    const values = items.map((item) => {
      return `(${Number(item.collection_id)}, ${Number(item.token_id)})`;
    });
    if (values.length > 0) {
      return `select * from (values ${values.join(',')}) as t (collection_id, token_id)`;
    }
    return null;
  }

  private prepareQuery(queryFilter: SelectQueryBuilder<TokensViewer>, collectionId: number) {
    return (queryFilter = this.connection.manager
      .createQueryBuilder()
      .addSelect([
        'view_tokens_offer_id AS offer_id',
        'view_tokens_offer_order_id AS offer_order_id',
        'view_tokens_offer_status AS offer_status',
        'view_tokens_collection_id AS collection_id',
        'view_tokens_token_id AS token_id',
        'view_tokens_offer_price_parsed AS offer_price_parsed',
        'view_tokens_offer_price_raw AS offer_price_raw',
        'view_tokens_offer_price_currency AS offer_price_currency',
        'view_tokens_offer_seller AS offer_seller',
        'view_tokens_offer_created_at AS offer_created_at',
      ])
      .distinct()
      .andWhere('view_tokens_collection_id = :collectionId', { collectionId })
      .from(`(${queryFilter.getQuery()})`, 'view_tokens')
      .setParameters(queryFilter.getParameters()) as SelectQueryBuilder<TokensViewer>);
  }

  private byTokenId(query: SelectQueryBuilder<TokensViewer>, tokenIds?: number[]): SelectQueryBuilder<TokensViewer> {
    if ((tokenIds ?? []).length <= 0) {
      return query;
    }
    return query.andWhere('view_tokens.token_id in (:...tokenIds)', { tokenIds });
  }
}
