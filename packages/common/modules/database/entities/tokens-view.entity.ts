import { DataSource, SelectQueryBuilder, ViewColumn, ViewEntity } from 'typeorm';
import { TokensEntity } from './tokens.entity';
import { OfferEntity } from './offer.entity';
import { PropertiesEntity } from './properties.entity';

@ViewEntity({
  expression: (dataSource: DataSource): SelectQueryBuilder<any> => {
    const queryBuilder = dataSource.createQueryBuilder(TokensEntity, 'token');
    const { enumName } = dataSource.manager.getRepository(PropertiesEntity).metadata.nonVirtualColumns.find((col) => {
      return col.propertyName === 'type';
    });
    queryBuilder.select([
      'token.collection_id',
      'token.token_id',
      'offer.id as offer_id',
      'offer.order_id as offer_order_id',
      'offer.status AS offer_status',
      'offer.price_parsed AS offer_price_parsed',
      'offer.price_raw AS offer_price_raw',
      'token.owner_token AS offer_seller',
      'offer.created_at AS offer_created_at',
      'offer.updated_at AS offer_updated_at',
      'properties_filter.network',
      'properties_filter.is_trait',
      'properties_filter.locale',
      'properties_filter.traits',
      'properties_filter.KEY',
      'properties_filter.count_item',
      'properties_filter.total_items',
      'properties_filter.list_items',
    ]);
    // queryBuilder.leftJoin(OfferEntity, 'offer', 'offer.collection_id = token.collection_id AND offer.token_id = token.token_id');
    queryBuilder.leftJoin(
      (selectQueryBuilder: SelectQueryBuilder<TokensEntity>) => {
        const offerQuaryBuilder = selectQueryBuilder.subQuery();
        offerQuaryBuilder.select([
          'offers.id as id',
          'offers.order_id as order_id',
          'offers.collection_id as collection_id',
          'offers.token_id as token_id',
          'offers.price_parsed as price_parsed',
          'offers.price_raw as price_raw',
          'offers.amount as amount',
          'offers.contract_address as contract_address',
          'offers.status as status',
          'offers.seller as seller',
          'offers.created_at as created_at',
          'offers.updated_at as updated_at',
        ]);
        offerQuaryBuilder.from(OfferEntity, 'offers');
        offerQuaryBuilder.where(`offers.status::text = 'Opened'::text`);
        return offerQuaryBuilder;
      },
      'offer',
      'offer.collection_id = token.collection_id AND offer.token_id = token.token_id',
    );
    queryBuilder.leftJoin(
      (selectQueryBuilder: SelectQueryBuilder<TokensEntity>) => {
        const propsQueryBuilder = selectQueryBuilder.subQuery();
        propsQueryBuilder.select([
          'collection_id',
          'network',
          'token_id',
          'is_trait',
          'locale',
          'unnest(prop.items) AS traits',
          'key',
          'count_item',
          'total_items',
          'list_items',
        ]);
        propsQueryBuilder.from(PropertiesEntity, 'prop');
        propsQueryBuilder.where(`prop.type <> 'ImageURL'::${enumName}`);
        return propsQueryBuilder;
      },
      'properties_filter',
      'token.collection_id = properties_filter.collection_id AND token.token_id = properties_filter.token_id',
    );
    queryBuilder.orderBy(
      `CASE
            WHEN offer.order_id IS NOT NULL THEN 0
            ELSE 1 END`,
    );
    return queryBuilder;
  },
  name: 'view_tokens',
})
export class TokensViewer {
  @ViewColumn({ name: 'collection_id' })
  collection_id: number;

  @ViewColumn({ name: 'token_id' })
  token_id: number;

  @ViewColumn({ name: 'offer_id' })
  offer_id: string;

  @ViewColumn({ name: 'offer_order_id' })
  offer_order_id: string;

  @ViewColumn({ name: 'offer_status' })
  offer_status: string;

  @ViewColumn({ name: 'offer_price_parsed' })
  offer_price_parsed: number;

  @ViewColumn({ name: 'offer_price_raw' })
  offer_price_raw: number;

  @ViewColumn({ name: 'offer_seller' })
  offer_seller: string;

  @ViewColumn({ name: 'offer_created_at' })
  offer_created_at: Date;

  @ViewColumn({ name: 'offer_updated_at' })
  offer_updated_at: Date;

  @ViewColumn({ name: 'network' })
  network: string;

  @ViewColumn({ name: 'is_trait' })
  isTrait: boolean;

  @ViewColumn({ name: 'locale' })
  locale: string;

  @ViewColumn({ name: 'traits' })
  traits: string;

  @ViewColumn({ name: 'key' })
  key: string;

  @ViewColumn({ name: 'count_item' })
  countItem: number;

  @ViewColumn({ name: 'total_items' })
  totalItems: number;

  @ViewColumn({ name: 'list_items' })
  listItems: string[];
}
