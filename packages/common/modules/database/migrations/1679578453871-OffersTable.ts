import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class OffersTable1679578453871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'offers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'order_id', type: 'integer' },
          { name: 'collection_id', type: 'integer' },
          { name: 'token_id', type: 'integer' },
          { name: 'price', type: 'bigint' },
          { name: 'amount', type: 'integer' },
          { name: 'contract_address', type: 'varchar' },
          {
            name: 'status',
            type: 'varchar',
          },
          { name: 'seller', type: 'varchar' },
        ],
        indices: [
          {
            name: 'OrderId',
            columnNames: ['order_id'],
          },
          {
            name: 'CollectionId',
            columnNames: ['collection_id'],
          },
          {
            name: 'CollectionId_TokenId',
            columnNames: ['collection_id', 'token_id'],
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('contracts');
  }
}
