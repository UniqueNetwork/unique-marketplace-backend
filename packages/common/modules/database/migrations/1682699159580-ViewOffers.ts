import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ViewOffers1682699159580 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'view_offers',
        columns: [
          {
            name: 'offer_id',
            type: 'varchar',
          },
          { name: 'offer_order_id', type: 'varchar' },
          { name: 'offer_status', type: 'varchar' },
          { name: 'offer_price_parsed', type: 'int' },
          { name: 'offer_price_raw', type: 'varchar' },
          { name: 'offer_seller', type: 'varchar' },
          { name: 'offer_created_at', type: 'timestamp without time zone' },
          { name: 'offer_updated_at', type: 'timestamp without time zone' },
          { name: 'collection_id', type: 'int' },
          { name: 'network', type: 'varchar' },
          { name: 'token_id', type: 'int' },
          { name: 'is_trait', type: 'boolean' },
          { name: 'locale', type: 'varchar' },
          { name: 'traits', type: 'varchar' },
          { name: 'key', type: 'varchar' },
          { name: 'count_item', type: 'int' },
          { name: 'total_items', type: 'int' },
          { name: 'list_items', type: 'varchar' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('view_offers');
  }
}
