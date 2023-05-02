import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { SettingEntity } from "../entities";

export class SettingsTable1677511684518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(SettingEntity).metadata.tableName,
        columns: [
          {
            name: 'key',
            type: 'text',
            isPrimary: true,
            primaryKeyConstraintName: 'MARKET_SETTINGS_PK_KEY',
          },
          { name: 'value', type: 'text' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(queryRunner.manager.getRepository(SettingEntity).metadata.tableName);
  }
}
