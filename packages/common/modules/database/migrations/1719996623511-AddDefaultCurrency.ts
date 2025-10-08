import { MigrationInterface, QueryRunner } from "typeorm"
import { SettingEntity } from '../entities';

export class AddDefaultCurrency1719992748305 implements MigrationInterface {
    name = 'AddDefaultCurrency1719992748305';

    public async up(queryRunner: QueryRunner): Promise<void> {
      const settingsTableName = queryRunner.manager.getRepository(SettingEntity).metadata.tableName;

      await queryRunner.query(`
        INSERT INTO ${settingsTableName} (key, value)
        SELECT 'contract_currencies', '[
            {
                "collectionId": 0,
                "decimals": 18,
                "iconUrl": "https://ipfs.unique.network/ipfs/QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR",
                "fee": 0,
                "name": "UNQ"
            }
        ]'
        WHERE NOT EXISTS (SELECT 1 FROM ${settingsTableName} WHERE key = 'contract_currencies');
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      const settingsTableName = queryRunner.manager.getRepository(SettingEntity).metadata.tableName;

      await queryRunner.query(`
        DELETE FROM ${settingsTableName} WHERE key = 'contract_currencies';
      `);
    }

}
