import { DataSource, SelectQueryBuilder, ViewColumn, ViewEntity } from 'typeorm';
import { OfferEntity } from './offer.entity';
import { OfferEventEntity } from './offer-event.entity';
import { ContractEntity } from './contract.entity';

export class PriceOriginType {
  raw: string;
  parsed: bigint;
}

@ViewEntity({
  expression: (dataSource: DataSource): SelectQueryBuilder<any> => {
    const queryBuilder = dataSource.createQueryBuilder(OfferEventEntity, 'event');
    queryBuilder.select([
      'event.id',
      'event.event_type AS status',
      'offer.created_at AS created_date',
      'event.created_at AS trade_date',
      'event.network',
      'offer.collection_id',
      'offer.token_id',
      'event.amount',
      'offer.amount AS total_amount',
      'offer.seller',
      'event.address AS buyer',
      'offer.price_raw',
      'offer.price_parsed',
      'contracts.address AS contract_address',
      'contracts.commission AS contract_commission',
      'contracts."version" AS contract_version',
      'contracts.created_at AS contract_block_number',
      'contracts.processed_at AS contract_block_processed',
    ]);

    queryBuilder.leftJoin(OfferEntity, 'offer', 'event.offer_id = offer."id"');
    queryBuilder.leftJoin(ContractEntity, 'contracts', 'offer.contract_address::text = contracts.address');
    queryBuilder.where("event.event_type::text = 'Buy'::text");
    return queryBuilder;
  },
  name: 'view_trades',
})
export class TradeViewEntity {
  @ViewColumn()
  id: string;

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
  price_raw: number;

  @ViewColumn()
  price_parsed: number;

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
}
