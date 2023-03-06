import { Module } from "@nestjs/common";
import { MonitoringModule } from "@app/common/modules/monitoring";
import { CacheProviderModule } from "@app/common/modules/cache/cache-provider.module";
import { DatabaseModule } from "@app/common/modules/database/database.module";
import { PgNotifyClientModule } from "@app/common/pg-transport/pg-notify-client.module";
import { GlobalConfigModule } from "@app/common/modules/config";

@Module({
  imports: [
    GlobalConfigModule,
    MonitoringModule,
    CacheProviderModule,
    DatabaseModule.forMarket(),
    PgNotifyClientModule,
  ]
})
export class AppModule {
}
