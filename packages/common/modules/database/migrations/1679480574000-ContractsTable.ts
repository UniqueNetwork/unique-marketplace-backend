import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ContractEntity } from "../entities";

export class ContractsTable1677511684518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: queryRunner.manager.getRepository(ContractEntity).metadata.tableName,
        columns: [
          {
            name: 'address',
            type: 'text',
            isPrimary: true,
            primaryKeyConstraintName: 'MARKET_CONTRACT_ADDRESS',
          },
          { name: 'version', type: 'integer', isUnique: true },
          { name: 'created_at', type: 'integer' },
          { name: 'processed_at', type: 'integer' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(queryRunner.manager.getRepository(ContractEntity).metadata.tableName);
  }
}
