import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { BannerEntity } from '../entities';

export abstract class BannersEntity1689929097000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(BannerEntity).metadata.tableName,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'MARKET_BANNERS_PK_KEY',
          },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'varchar' },
          { name: 'minio_file', type: 'varchar' },
          { name: 'button_title', type: 'varchar' },
          { name: 'button_url', type: 'varchar' },
          { name: 'button_color', type: 'varchar' },
          { name: 'sort_index', type: 'integer', default: 0 },
          { name: 'created_at', type: 'date' },
          { name: 'off', type: 'boolean', default: false },
          { name: 'collection_id', type: 'integer', default: 0 },
          { name: 'background_color', type: 'varchar' },
          { name: 'secondary_button_title', type: 'varchar', isNullable: true },
          { name: 'secondary_button_url', type: 'varchar', isNullable: true },
          { name: 'secondary_button_color', type: 'varchar', isNullable: true },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(queryRunner.manager.getRepository(BannerEntity).metadata.tableName);
  }
}
