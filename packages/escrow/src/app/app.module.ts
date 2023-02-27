import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { GlobalConfigModule } from "@app/common/modules/config";
import { MonitoringModule } from "@app/common/modules/monitoring";
import { CacheProviderModule } from "@app/common/modules/cache/cache-provider.module";
import { DatabaseModule } from "@app/common/modules/database/database.module";

@Module({
  imports: [
    GlobalConfigModule,
    MonitoringModule,
    CacheProviderModule,
    DatabaseModule.forEscrow(),
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}
