import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class OffersTable1679578453871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'offers',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true },
          { name: 'collection_id', type: 'integer' },
          { name: 'token_id', type: 'integer' },
          { name: 'price', type: 'bigint' },
          { name: 'amount', type: 'integer' },
          { name: 'contract_address', type: 'varchar' },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('contracts');
  }
}
