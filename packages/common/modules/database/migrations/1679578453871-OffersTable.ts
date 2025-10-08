import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ContractEntity, OfferEntity } from '../entities';

export class OffersTable1679578453871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(OfferEntity).metadata.tableName,
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
          { name: 'price_parsed', type: 'numeric', precision: 38, scale: 18 },
          { name: 'price_raw', type: 'varchar' },
          { name: 'amount', type: 'integer' },
          { name: 'currency', type: 'integer', default: 0 },
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
            referencedTableName: queryRunner.manager.getRepository(ContractEntity).metadata.tableName,
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
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(queryRunner.manager.getRepository(OfferEntity).metadata.tableName);
  }
}
