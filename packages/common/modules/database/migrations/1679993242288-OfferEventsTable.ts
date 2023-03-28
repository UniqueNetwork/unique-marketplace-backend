import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { OfferEventType } from '../../types';

export class OfferEventsTable1679993242288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'offer-events',
        columns: [
          { name: 'id', type: 'integer', isGenerated: true, isPrimary: true },
          { name: 'offer_id', type: 'varchar' },
          {
            name: 'event_type',
            type: 'enum',
            enum: [
              OfferEventType.Open,
              OfferEventType.Cancel,
              OfferEventType.Buy,
            ],
          },
          { name: 'block_number', type: 'integer' },
          { name: 'address_from', type: 'varchar' },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('contracts');
  }
}
