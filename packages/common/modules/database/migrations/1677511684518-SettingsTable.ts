import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class SettingsTable1677511684518 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: "settings",
        columns: [
          {
            name: "key",
            type: "text",
            isPrimary: true,
            primaryKeyConstraintName: "MARKET_SETTINGS_PK_KEY"
          },
          { name: "value", type: "text" }
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("settings");
  }

}
