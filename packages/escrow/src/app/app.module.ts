import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { GlobalConfigModule } from '@app/common/modules/config';
import { MonitoringModule } from '@app/common/modules/monitoring';
import { CacheProviderModule } from '@app/common/modules/cache/cache-provider.module';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { AppController } from './app.controller';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';
import { ContractEventsModule } from './contract-events/contract-events.module';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [
    GlobalConfigModule,
    MonitoringModule,
    CacheProviderModule,
    DatabaseModule.forRoot(),
    PgNotifyClientModule,
    ContractEventsModule,
    CollectionsModule,
  ],
  controllers: [AppController],
  providers: [sdkProvider, AppService],
})
export class AppModule {}
