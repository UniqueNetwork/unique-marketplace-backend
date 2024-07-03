import { MigrationInterface, QueryRunner } from "typeorm"

export class AddDefaultCurrency1719992748305 implements MigrationInterface {
    name = 'AddDefaultCurrency1719992748305';

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        INSERT INTO new_settings (key, value)
        SELECT 'contract_currencies', '[
            {
                "collectionId": 0,
                "decimals": 18,
                "iconUrl": "https://ipfs.unique.network/ipfs/QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR",
                "fee": 0,
                "name": "UNQ"
            }
        ]'
        WHERE NOT EXISTS (SELECT 1 FROM new_settings WHERE key = 'contract_currencies');
      `);
    }
  
    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        DELETE FROM new_settings WHERE key = 'contract_currencies';
      `);
    }

}
