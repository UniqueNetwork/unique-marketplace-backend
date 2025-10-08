import { MigrationInterface, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { OfferEntity, ViewOffers } from '../entities';
import { DataSource } from 'typeorm/data-source/DataSource';

export class AddCurrencyToOffer1716368384726 implements MigrationInterface {
  name: 'AddCurrencyToOffer1716368384726';
  public async up(queryRunner: QueryRunner): Promise<any> {
    // language=SQL format=false
    const isColumnExist = await queryRunner.hasColumn(queryRunner.manager.getRepository(OfferEntity).metadata.tableName, 'currency');

    if (isColumnExist) {
      return;
    }

      await queryRunner.query(`ALTER TABLE ${queryRunner.manager.getRepository(OfferEntity).metadata.tableName}
        ADD currency integer default 0;`);

    await queryRunner.query(`
    CREATE OR REPLACE VIEW
      "${queryRunner.manager.getRepository(ViewOffers).metadata.tableName}" AS
      ${(
      queryRunner.manager.getRepository(ViewOffers).metadata.expression as (connection: DataSource) => SelectQueryBuilder<any>
    )(queryRunner.connection).getQuery()}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // todo
    throw new Error('I dont know what todo');
  }
}
