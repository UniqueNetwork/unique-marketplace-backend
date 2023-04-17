import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class TokensTable1681310408111 implements MigrationInterface {
  name: 'TokensTable1681310408111';
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'network',
            type: 'varchar',
          },
          {
            name: 'collection_id',
            type: 'int',
            default: 0,
          },
          {
            name: 'token_id',
            type: 'int',
            default: 0,
          },
          {
            name: 'owner_token',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'nested',
            type: 'jsonb',
            default: "'{}'",
          },

          {
            name: 'other_owners',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'amount',
            type: 'int',
            default: 1,
          },
          {
            name: 'data',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'burned',
            type: 'boolean',
            default: "'f'",
          },
          {
            name: 'parse_data',
            type: 'boolean',
            default: "'f'",
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
        ],
        indices: [
          {
            name: 'Collection_and_token_idx',
            isUnique: true,
            columnNames: ['collection_id', 'token_id', 'network'],
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('tokens');
  }
}
