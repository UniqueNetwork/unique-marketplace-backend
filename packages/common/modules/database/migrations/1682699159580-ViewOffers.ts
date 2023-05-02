import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { View } from 'typeorm/schema-builder/view/View';

export class ViewOffers1682699159580 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE OR REPLACE VIEW "view_offers" AS SELECT DISTINCT
    offer.id AS offer_id,
    offer.order_id AS offer_order_id,
    offer.status AS offer_status,
    offer.price_parsed AS offer_price_parsed,
    offer.price_raw AS offer_price_raw,
    offer.seller AS offer_seller,
    offer.created_at AS offer_created_at,
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
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropView('view_offers');
  }
}
