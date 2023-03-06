import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { GlobalConfigModule } from "@app/common/modules/config";
import { MonitoringModule } from "@app/common/modules/monitoring";
import { CacheProviderModule } from "@app/common/modules/cache/cache-provider.module";
import { DatabaseModule } from "@app/common/modules/database/database.module";
import { sdkProvider } from "@app/common/modules/sdk/sdk.provider";
import { AppController } from "./app.controller";
import { PgNotifyClientModule } from "@app/common/pg-transport/pg-notify-client.module";

@Module({
  imports: [
    GlobalConfigModule,
    MonitoringModule,
    CacheProviderModule,
    DatabaseModule.forEscrow(),
    PgNotifyClientModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    sdkProvider,
    AppService,
  ],
})
export class AppModule {}
