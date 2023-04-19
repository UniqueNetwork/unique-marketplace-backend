import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class OffersTable1679578453871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'offers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          { name: 'order_id', type: 'integer' },
          { name: 'collection_id', type: 'integer' },
          { name: 'token_id', type: 'integer' },
          { name: 'price_parsed', type: 'string' },
          { name: 'price_raw', type: 'string' },
          { name: 'amount', type: 'integer' },
          { name: 'contract_address', type: 'varchar' },
          {
            name: 'status',
            type: 'varchar',
          },
          { name: 'seller', type: 'varchar' },
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
        foreignKeys: [
          {
            referencedTableName: 'contracts',
            columnNames: ['contract_address'],
            referencedColumnNames: ['address'],
            deferrable: 'INITIALLY DEFERRED',
            onDelete: 'CASCADE',
            name: 'FK_OFFERS_TO_CONTRACTS',
          },
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
