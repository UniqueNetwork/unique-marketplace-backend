import { MigrationInterface, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { TokensViewer } from '../entities';
import { DataSource } from 'typeorm/data-source/DataSource';

export class ViewTokens1684221119187 implements MigrationInterface {
  name: 'ViewTokens1684221119187';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`
    CREATE OR REPLACE VIEW
      "${queryRunner.manager.getRepository(TokensViewer).metadata.tableName}" AS
      ${(
        queryRunner.manager.getRepository(TokensViewer).metadata.expression as (connection: DataSource) => SelectQueryBuilder<any>
      )(queryRunner.connection).getQuery()}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropView('view_tokens');
  }
}
