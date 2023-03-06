import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import { pgNotifyClient } from "./pg-notify-client.symbol";
import { ConfigService } from "@nestjs/config";
import { Config } from "../modules/config";
import { PgTransportClient } from "./pg-transport.client";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: pgNotifyClient,
        useFactory: (configService: ConfigService<Config>) => {
          return {
            options: configService.get("database"),
            customClass: PgTransportClient
          };
        },
        inject: [
          ConfigService,
        ]
      }
    ])
  ],
  exports: [
    ClientsModule,
  ]
})
export class PgNotifyClientModule {
}
