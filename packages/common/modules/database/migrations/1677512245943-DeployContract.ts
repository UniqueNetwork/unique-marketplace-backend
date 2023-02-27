import { MigrationInterface, QueryRunner } from "typeorm";
import { loadConfig } from "../../config";
import { Client } from "@unique-nft/sdk";

export class DeployContract1677512245943 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {

    const config = loadConfig();
    const sdk = new Client({ baseUrl: config.uniqueSdkRestUrl });
    const { wsUrl } = await sdk.common.chainProperties(); // todo видимо вот надо сюда подключиться хардхатом или как его

    throw new Error("Закомменти эту ошибку если ты не Заур. Но если Заур -- пропиши сюда деплой контракта");
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
  }

}
