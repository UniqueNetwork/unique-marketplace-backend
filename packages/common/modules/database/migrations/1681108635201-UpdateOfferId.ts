import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class UpdateOfferId1681108635201 implements MigrationInterface {
  name: 'UpdateOfferId1681108635201';
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE offers ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4());`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('collections');
  }
}
