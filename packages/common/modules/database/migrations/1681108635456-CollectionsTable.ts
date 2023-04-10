import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CollectionsTable1681108635456 implements MigrationInterface {
  name: 'CollectionsTable1681108635456';
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'collections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'collections_id',
            type: 'int',
            default: 0,
          },
          {
            name: 'owner',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'mode',
            type: 'enum',
            enum: ['NFT', 'Fungible', 'ReFungible'],
            isNullable: true,
          },
          {
            name: 'decimal_points',
            type: 'int',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '256',
            isNullable: true,
          },
          {
            name: 'token_prefix',
            type: 'varchar',
            length: '16',
            isNullable: true,
          },
          {
            name: 'mint_mode',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allowed_tokens',
            type: 'varchar',
            default: "''",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Enabled', 'Disabled'],
            default: "'Enabled'",
          },
          {
            name: 'created_at',
            type: 'timestamp without time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp without time zone',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'network',
            type: 'varchar',
          },
          {
            name: 'data',
            type: 'jsonb',
          },
        ],
      }),
      true
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "collections_idx" ON "collections" ("collections_id") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('collections');
  }
}
