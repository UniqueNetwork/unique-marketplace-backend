import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { OfferEventEntity } from '../entities';

export class OfferEventsTable1679993242288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(OfferEventEntity).metadata.tableName,
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'offer_id', type: 'uuid' },
          {
            name: 'event_type',
            type: 'varchar',
          },
          { name: 'meta', type: 'jsonb', default: "'{}'" },
          { name: 'block_number', type: 'integer' },
          { name: 'address', type: 'varchar', isNullable: true },
          { name: 'amount', type: 'integer' },
          { name: 'commission', type: 'integer' },
          { name: 'collection_mode', type: 'varchar' },
          { name: 'network', type: 'varchar' },
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

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(queryRunner.manager.getRepository(OfferEventEntity).metadata.tableName);
  }
}
