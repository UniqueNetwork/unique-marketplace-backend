import { MigrationInterface, QueryRunner } from 'typeorm';
import { OfferEntity, OfferEventEntity } from '../entities';

export class MarketTradeToOfferEvents1684739540519 implements MigrationInterface {
  name: 'MarketTradeToOfferEvents1684739540519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('market_trade');
    if (!tableExists) {
      console.log('Table market_trade does not exist.');
      return;
    }
    await queryRunner.startTransaction();
    try {
      const eventsTable = queryRunner.manager.getRepository(OfferEventEntity).metadata.tableName;
      await queryRunner.query(`
        INSERT INTO ${eventsTable} (offer_id, event_type, block_number, address, amount, commission, collection_mode, network, created_at,updated_at )
        SELECT ID AS offer_id, 'Buy' AS event_type,
        jsonb_build_object (
        'contract','0x5c03d3976Ad16F50451d95113728E0229C50cAB8',
        'collection_id', collection_id,
        'token_id', token_id,
        'blockchain','kusama',
        'create_block_number',block_number_ask,
        'buy_block_number',block_number_buy,
        'commission', commission,
        'original_price', origin_price ) AS meta,
        block_number_buy AS block_number, address_buyer AS address, 1 AS amount, 10 AS commission,
        'NFT' AS collection_mode, network, buy_created_at AS created_at, ask_created_at AS updated_at
        FROM market_trade
    `);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const eventsTable = queryRunner.manager.getRepository(OfferEventEntity).metadata.tableName;
    await queryRunner.query(`DELETE FROM ${eventsTable} WHERE network = 'quartz';`);
  }
}
