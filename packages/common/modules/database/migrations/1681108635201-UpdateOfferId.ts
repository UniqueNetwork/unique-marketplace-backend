import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { OfferEntity } from "../entities";

export class UpdateOfferId1681108635201 implements MigrationInterface {
  name: 'UpdateOfferId1681108635201';
  public async up(queryRunner: QueryRunner): Promise<any> {
    // language=SQL format=false
    await queryRunner.query(
      `ALTER TABLE ${queryRunner.manager.getRepository(OfferEntity).metadata.tableName} ` +
              `ALTER COLUMN id SET DATA TYPE UUID USING (uuid_generate_v4());`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // todo
    throw new Error('I dont know what todo')
  }
}
