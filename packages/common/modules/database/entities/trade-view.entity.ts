import { DataSource, OneToOne, SelectQueryBuilder, ViewColumn, ViewEntity } from 'typeorm';
import { OfferEntity } from './offer.entity';
import { OfferEventEntity } from './offer-event.entity';
import { ContractEntity } from './contract.entity';
import { PropertiesEntity } from './properties.entity';
import { TokensEntity } from './tokens.entity';

export class PriceOriginType {
  raw: string;
  parsed: bigint;
}

@ViewEntity({
  expression: (dataSource: DataSource): SelectQueryBuilder<any> => {
    const queryBuilder = dataSource.createQueryBuilder(OfferEventEntity, 'event');
    queryBuilder.select([
      'event.id as id',
      'offer.id AS offer_id',
      'event.event_type AS status',
      'offer.created_at AS created_date',
      'event.created_at AS trade_date',
      'event.network AS network',
      'offer.collection_id AS collection_id',
      'offer.token_id AS token_id',
      'event.amount AS amount',
      'offer.amount AS total_amount',
      'offer.seller AS seller',
      'event.address AS buyer',
      'offer.price_raw AS price_raw',
      'offer.price_parsed AS price_parsed',
      'event.commission as price_commission',
      'contracts.address AS contract_address',
      'contracts.commission AS contract_commission',
      'contracts."version" AS contract_version',
      'contracts.created_at AS contract_block_number',
      'contracts.processed_at AS contract_block_processed',
      'token."data" as data',
      'token.other_owners as other_owners',
      'token.owner_token as owner_token',
    ]);

    queryBuilder.leftJoin(OfferEntity, 'offer', 'event.offer_id = offer."id"');
    queryBuilder.leftJoin(ContractEntity, 'contracts', 'offer.contract_address::text = contracts.address');
    queryBuilder.leftJoin(
      TokensEntity,
      'token',
      'offer.collection_id = token.collection_id AND offer.token_id = token.token_id AND event.network::text = token.network::text',
    );
    queryBuilder.where("event.event_type::text = 'Buy'::text");
    return queryBuilder;
  },
  name: 'view_trades',
})
export class TradeViewEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  offer_id: string;

  @ViewColumn()
  status: string;

  @ViewColumn()
  created_date: Date;

  @ViewColumn()
  trade_date: Date;

  @ViewColumn()
  network: string;

  @ViewColumn()
  collection_id: number;

  @ViewColumn()
  token_id: number;

  @ViewColumn()
  amount: number;

  @ViewColumn()
  total_amount: number;

  @ViewColumn()
  seller: string;

  @ViewColumn()
  buyer: string;

  @ViewColumn()
  price_raw: string;

  @ViewColumn()
  price_parsed: number;

  @ViewColumn()
  price_commission: number;
  
  @ViewColumn()
  contract_address: string;

  @ViewColumn()
  contract_commission: number;

  @ViewColumn()
  contract_version: string;

  @ViewColumn()
  contract_block_number: number;

  @ViewColumn()
  contract_block_processed: Date;

  @ViewColumn()
  data: any;

  @ViewColumn()
  other_owners: any;

  @ViewColumn()
  owner_token: any;
}
