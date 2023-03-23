import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class ContractsTable1677511684518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'contracts',
        columns: [
          {
            name: 'address',
            type: 'text',
            isPrimary: true,
            primaryKeyConstraintName: 'MARKET_CONTRACT_ADDRESS',
          },
          { name: 'version', type: 'integer', isUnique: true },
          { name: 'createdAt', type: 'integer' },
          { name: 'processedAt', type: 'integer' },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('contracts');
  }
}
