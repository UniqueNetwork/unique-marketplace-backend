import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { AdminSessionEntity, PropertiesEntity } from '../entities';

export class AdminSessionsTable1683194096000 implements MigrationInterface {
  name = 'AdminSessionsTable1683194096000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(AdminSessionEntity).metadata.tableName,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'address',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'substrate_address',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'collection_id',
            type: 'int',
            default: 0,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
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
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sessions', true);
  }
}
