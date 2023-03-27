import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { OfferStatus } from '../../types';

export class OffersTable1679578453871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'offers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'offer_id', type: 'integer' },
          { name: 'collection_id', type: 'integer' },
          { name: 'token_id', type: 'integer' },
          { name: 'price', type: 'bigint' },
          { name: 'amount', type: 'integer' },
          { name: 'contract_address', type: 'varchar' },
          {
            name: 'status',
            type: 'enum',
            enum: [
              OfferStatus.Opened,
              OfferStatus.Canceled,
              OfferStatus.Completed,
            ],
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('contracts');
  }
}
