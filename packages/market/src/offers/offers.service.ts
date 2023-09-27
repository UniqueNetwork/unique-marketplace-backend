import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CollectionEntity, OfferEntity } from '@app/common/modules/database';
import { DataSource, In, Repository } from 'typeorm';
import { OfferEntityDto, OffersDto, OffersFilter } from './dto/offers.dto';
import { BaseService } from '@app/common/src/lib/base.service';
import { ViewOffers } from '@app/common/modules/database/entities/offers-view.entity';
import { TraitDto } from './dto/trait.dto';
import { ViewOffersService } from './view-offers.service';
import { PropertiesEntity } from '@app/common/modules/database/entities/properties.entity';
import { GetOneFilter, OfferPrice, OffersFilterType, OffersItemType } from './interfaces/offers.interface';
import { PaginationRouting } from '@app/common/src/lib/base.constants';

@Injectable()
export class OffersService extends BaseService<OfferEntity, OffersDto> {
  private logger = new Logger(OffersService.name);

  constructor(
    private connection: DataSource,
    @InjectRepository(OfferEntity)
    private offersRepository: Repository<OfferEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    @InjectRepository(ViewOffers)
    private viewOffersRepository: Repository<ViewOffers>,
    private viewOffersService: ViewOffersService,
  ) {
    super({});
  }

  /**
   * `Show all Offers with filters`
   * Returns all offers with descriptions of tokens, collection schemes and attributes by tokens
   * @param {OffersFilter} searchOptions - Search options
   * @param {PaginationRouting} pagination - Pagination request page and pageSize
   * @param sort
   */
  async getOffers(searchOptions: OffersFilter, pagination: PaginationRouting, sort): Promise<any> {
    let offers;
    let items = [];
    let propertiesFilter = [];
    let collections = [];

    try {
      offers = await this.viewOffersService.filter(searchOptions, pagination, sort);
      propertiesFilter = await this.searchInProperties(this.parserCollectionIdTokenId(offers.items));
      collections = await this.collections(this.getCollectionIds(offers.items));

      items = this.parseItems(offers.items, propertiesFilter, collections) as any as Array<ViewOffers>;
    } catch (e) {
      this.logger.error(e.message);

      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong!',
        error: e.message,
      });
    }

    return {
      ...offers.meta,
      items: items.map(OfferEntityDto.fromOffersEntity),
      attributes: offers.attributes as Array<TraitDto>,
      attributesCount: offers.attributesCount,
    };
  }

  /**
   * Show one selected offer
   * @param { collectionId: number; tokenId: number } filter - The ID of the collection and token
   * @example
   *
   * this.getOne({ collectionId: number; tokenId: number })
   */
  async getOne(filter: GetOneFilter): Promise<OfferEntityDto | null> {
    const source = await this.viewOffersService.filterByOne(filter);

    const properties_filter = await this.searchInProperties(this.parserCollectionIdTokenId(source));
    const collections = await this.collections(this.getCollectionIds(source));

    const offers = this.parseItems(source, properties_filter, collections).pop() as any as ViewOffers;

    return offers && OfferEntityDto.fromOffersEntity(offers);
  }

  async collections(ids: Array<number>): Promise<Array<CollectionEntity>> {
    return this.collectionRepository.find({ where: { collectionId: In(ids) } });
  }

  private getCollectionIds(items: Array<any>): Array<number> {
    return [...new Set(items.map((item) => +item.collection_id))].filter((id) => id !== null && id !== 0);
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

  private parseItems(
    items: Array<OffersFilterType>,
    searchIndex: Partial<PropertiesEntity>[],
    collections: Array<CollectionEntity>,
  ): Array<OffersItemType> {
    function isEmpty(value: string | number): number | string | null {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return value;
    }

    function convertorFlatToObject(): (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any {
      return (acc, item) => {
        const token = searchIndex.find((index) => index.collection_id === item.collection_id && index.token_id === item.token_id);
        const collection = collections.find((collection) => collection.collectionId === item.collection_id);
        const schemaData = collection?.data['schema'];
        const price = { parsed: +item.offer_price_parsed, raw: item.offer_price_raw } as OfferPrice;
        const schema = {
          attributesSchemaVersion: isEmpty(schemaData?.attributesSchemaVersion),
          coverPicture: isEmpty(schemaData?.coverPicture),
          image: isEmpty(schemaData?.image),
          schemaName: isEmpty(schemaData?.schemaName),
          schemaVersion: isEmpty(schemaData?.schemaVersion),
          collectionId: isEmpty(schemaData?.collectionId),
        };
        const obj = {
          collection_id: +item.collection_id,
          token_id: +item.token_id,
          order: item.order_id,
          status: item.offer_status,
          price: price,
          seller: item.offer_seller,
          created_at: item.offer_created_at,
          contract_address: item.contract_address,
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
}
