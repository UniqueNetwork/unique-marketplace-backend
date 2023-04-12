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
          },
          {
            name: 'data',
            type: 'jsonb',
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
            columnNames: ['collection_id', 'token_id'],
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
