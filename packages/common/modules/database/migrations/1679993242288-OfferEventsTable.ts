import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class OfferEventsTable1679993242288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'offer-events',
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
    await queryRunner.dropTable('contracts');
  }
}
