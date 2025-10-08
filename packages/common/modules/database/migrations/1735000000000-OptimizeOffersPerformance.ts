import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeOffersPerformance1735000000000 implements MigrationInterface {
  name = 'OptimizeOffersPerformance1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. GIN indexes for fast array operations
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_list_items_gin 
      ON properties USING GIN (list_items);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_items_gin 
      ON properties USING GIN (items);
    `);

    // 2. Index for offers status (only for opened)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_status_opened 
      ON offers (collection_id, token_id, created_at) 
      WHERE status = 'Opened';
    `);

    // 3. Composite index for fast search by collection and token
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_collection_token_status 
      ON offers (collection_id, token_id, status, price_parsed);
    `);

    // 4. Index for price sorting
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_price_parsed 
      ON offers (price_parsed DESC) 
      WHERE status = 'Opened';
    `);

    // 5. Index for seller search
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_seller 
      ON offers (seller, status) 
      WHERE status = 'Opened';
    `);

    // 6. Index for properties by collection_id and token_id
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_collection_token 
      ON properties (collection_id, token_id, type);
    `);

    // 7. Index for traits search
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_traits 
      ON properties (traits) 
      WHERE traits IS NOT NULL;
    `);

    // 8. Index for total_items
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_total_items 
      ON properties (total_items) 
      WHERE total_items IS NOT NULL;
    `);

    // 9. Index for currencies
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_currency 
      ON offers (currency, status) 
      WHERE status = 'Opened';
    `);

    // 10. Index for price range search
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_price_range 
      ON offers (price_parsed, collection_id, status) 
      WHERE status = 'Opened';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop created indexes
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_properties_list_items_gin;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_properties_items_gin;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_offers_status_opened;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_offers_collection_token_status;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_offers_price_parsed;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_offers_seller;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_properties_collection_token;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_properties_traits;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_properties_total_items;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_offers_currency;`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_offers_price_range;`);
  }
}
