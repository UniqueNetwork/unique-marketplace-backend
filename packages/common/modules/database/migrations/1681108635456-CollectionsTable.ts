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
            name: 'collection_id',
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
            isNullable: true,
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
            isNullable: true,
          },
          {
            name: 'allowed_tokens',
            type: 'varchar',
            default: "''",
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Enabled', 'Disabled'],
            default: "'Enabled'",
          },
          {
            name: 'active',
            type: 'boolean',
            enum: ['true', 'false'],
            default: 'false',
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
            isNullable: true,
          },
          {
            name: 'data',
            type: 'jsonb',
          },
        ],
        indices: [
          {
            name: 'collections_idx',
            columnNames: ['collection_id'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('collections');
  }
}