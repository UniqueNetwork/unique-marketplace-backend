import { MigrationInterface, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { ViewOffers } from '../entities';
import { DataSource } from 'typeorm/data-source/DataSource';

export class ViewOffers1719996623512 implements MigrationInterface {
  name: 'ViewOffers1719996623512';
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
    CREATE OR REPLACE VIEW
      "${queryRunner.manager.getRepository(ViewOffers).metadata.tableName}" AS
      ${(
        queryRunner.manager.getRepository(ViewOffers).metadata.expression as (connection: DataSource) => SelectQueryBuilder<any>
      )(queryRunner.connection).getQuery()}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropView('view_offers');
  }
}
