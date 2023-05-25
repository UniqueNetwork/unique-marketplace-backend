import { MigrationInterface, QueryRunner } from 'typeorm';
import { ContractEntity, OfferEntity } from '../entities';

export class MarketTradeToOffers1684739540151 implements MigrationInterface {
  name: 'MarketTradeToOffers1684739540151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('market_trade');
    if (!tableExists) {
      console.log('Table market_trade does not exist.');
      return;
    }
    await queryRunner.startTransaction();

    try {
      const contractTable = queryRunner.manager.getRepository(ContractEntity).metadata.tableName;
      await queryRunner.query(`
        INSERT INTO ${contractTable} (address, version,commission, created_at, processed_at) VALUES ('0x5c03d3976Ad16F50451d95113728E0229C50cAB8',-1,10,1,1);
      `);
      const offersTable = queryRunner.manager.getRepository(OfferEntity).metadata.tableName;
      await queryRunner.query(`
        INSERT INTO ${offersTable} (id, order_id, collection_id, token_id, price_parsed, price_raw, amount, seller, contract_address, status, created_at, updated_at)
        SELECT
          ID,
          1 AS order_id,
          collection_id,
          token_id,
          CAST(price / 1000000000000.0 AS numeric(38,18)) as price_parsed,
          price AS price_raw,
          1 as amount,
          address_seller AS seller,
          '0x5c03d3976Ad16F50451d95113728E0229C50cAB8' AS contract_address,
          'Migration' AS status,
          ask_created_at AS created_at,
          ask_created_at AS updated_at
        FROM
          market_trade;
      `);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const offersTable = queryRunner.manager.getRepository(OfferEntity).metadata.tableName;
    await queryRunner.query(`DELETE FROM ${offersTable} WHERE status = 'Migration';`);
  }
}
