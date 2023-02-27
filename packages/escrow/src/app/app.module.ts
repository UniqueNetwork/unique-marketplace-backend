import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { GlobalConfigModule } from "@app/common/modules/config";
import { MonitoringModule } from "@app/common/modules/monitoring";
import { CacheProviderModule } from "@app/common/modules/cache/cache-provider.module";
import { DatabaseModule } from "@app/common/modules/database/database.module";
import { sdkProvider } from "@app/common/modules/sdk/sdk.provider";

@Module({
  imports: [
    GlobalConfigModule,
    MonitoringModule,
    CacheProviderModule,
    DatabaseModule.forEscrow(),
  ],
  providers: [
    sdkProvider,
    AppService,
  ],
})
export class AppModule {}
