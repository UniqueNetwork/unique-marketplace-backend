import { MigrationInterface, QueryRunner, SelectQueryBuilder, Table } from 'typeorm';
import { CurrencyEntity, TokensViewer, ViewOffers } from '../entities';
import { DataSource } from 'typeorm/data-source/DataSource';

export class Currencies1759785259672 implements MigrationInterface {
  name = 'Currencies1759785259672';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(CurrencyEntity).metadata.tableName,
        columns: [
          { name: 'id', type: 'integer', isPrimary: true },
          { name: 'decimals', type: 'integer' },
          { name: 'icon_url', type: 'varchar', length: '256', isNullable: true },
          { name: 'fee', type: 'integer' },
          { name: 'name', type: 'varchar', length: '64' },
          { name: 'coingecko_id', type: 'varchar', length: '128', isNullable: true },
          { name: 'usd_price', type: 'numeric', precision: 38, scale: 18, isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [],
      }),
      true,
    );

    await queryRunner.query(`
    CREATE OR REPLACE VIEW
      "${queryRunner.manager.getRepository(TokensViewer).metadata.tableName}" AS
      ${(
      queryRunner.manager.getRepository(TokensViewer).metadata.expression as (connection: DataSource) => SelectQueryBuilder<any>
    )(queryRunner.connection).getQuery()}
    `);

    await queryRunner.query(`
    CREATE OR REPLACE VIEW
      "${queryRunner.manager.getRepository(ViewOffers).metadata.tableName}" AS
      ${(
      queryRunner.manager.getRepository(ViewOffers).metadata.expression as (connection: DataSource) => SelectQueryBuilder<any>
    )(queryRunner.connection).getQuery()}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropView('view_tokens');
    await queryRunner.dropView('view_offers');
    await queryRunner.dropTable(queryRunner.manager.getRepository(CurrencyEntity).metadata.tableName);
  }
}
