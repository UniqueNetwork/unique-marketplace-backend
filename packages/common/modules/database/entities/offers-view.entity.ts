import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: ` SELECT DISTINCT
    offer.id AS offer_id,
    offer.order_id AS offer_order_id,
    offer.status AS offer_status,
    offer.price_parsed AS offer_price_parsed,
    offer.price_raw AS offer_price_raw,
    offer.seller AS offer_seller,
    offer.created_at AS offer_ceated_at,
    offer.updated_at AS offer_updated_at,
    properties_filter.collection_id,
    properties_filter.network,
    properties_filter.token_id,
    properties_filter.is_trait,
    properties_filter.locale,
    properties_filter.traits,
    properties_filter.key,
    properties_filter.count_item,
    properties_filter.total_items,
    properties_filter.list_items
    FROM offers offer
     LEFT JOIN ( SELECT prop.collection_id,
            prop.network,
            prop.token_id,
            prop.is_trait,
            prop.locale,
            unnest(prop.items) AS traits,
            prop.key,
            prop.count_item,
            prop.total_items,
            prop.list_items
           FROM properties prop
          WHERE prop.type <> 'ImageURL'::properties_type_enum) properties_filter
          ON offer.collection_id = properties_filter.collection_id
          AND offer.token_id = properties_filter.token_id`,
  name: 'view_offers',
})
export class ViewOffers {
  @ViewColumn({ name: 'offer_id' })
  offerId: string;

  @ViewColumn({ name: 'offer_order_id' })
  offerOrderId: string;

  @ViewColumn({ name: 'offer_status' })
  offerStatus: string; // active, canceled, bought

  @ViewColumn({ name: 'offer_price_parsed' })
  offer_price_parsed: number;

  @ViewColumn({ name: 'offer_price_raw' })
  offer_price_raw: string;

  @ViewColumn({ name: 'offer_seller' })
  offer_seller: string; // address from

  @ViewColumn({ name: 'offer_created_at' })
  offer_created_at: Date;

  @ViewColumn({ name: 'offer_updated_at' })
  offer_offer_updated_at: Date;

  @ViewColumn({ name: 'collection_id' })
  collection_id: number; // collection id from search_index

  @ViewColumn({ name: 'network' })
  network: string;

  @ViewColumn({ name: 'token_id' })
  token_id: number; // token id from search_index

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
