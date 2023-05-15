import { MigrationInterface, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { ViewOffers } from '../entities';
import { DataSource } from 'typeorm/data-source/DataSource';
import { TradeViewEntity } from '../entities/trade-view.entity';

export class ViewTrades1683809743000 implements MigrationInterface {
  name: 'ViewTrades1683809743000';
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
    CREATE OR REPLACE VIEW
      "${queryRunner.manager.getRepository(TradeViewEntity).metadata.tableName}" AS
      ${(
        queryRunner.manager.getRepository(TradeViewEntity).metadata.expression as (
          connection: DataSource,
        ) => SelectQueryBuilder<any>
      )(queryRunner.connection).getQuery()}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropView('view_trades');
  }
}
