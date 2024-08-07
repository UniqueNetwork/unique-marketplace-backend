import { Module } from '@nestjs/common';
import { MonitoringModule } from '@app/common/modules/monitoring';
import { CacheProviderModule } from '@app/common/modules/cache/cache-provider.module';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';
import { GlobalConfigModule } from '@app/common/modules/config';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { OffersModule } from './offers/offers.module';
import { SettingsModule } from './settings/settings.module';
import { CollectionsModule } from './collections/collections.module';
import { TokensModule } from './tokens/tokens.module';
import { AdminModule } from './admin/admin.module';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { SdkMarketService } from './sdk/sdk.service';
import { TradesModule } from './trades/trades.module';
import { ContractModule } from './contracts/contract.module';
import { BannersModule } from './banners/banners.module';

@Module({
  imports: [
    GlobalConfigModule,
    MonitoringModule,
    CacheProviderModule,
    DatabaseModule.forFeature(),
    PgNotifyClientModule,
    AdminModule,
    OffersModule,
    CollectionsModule,
    TokensModule,
    TradesModule,
    SettingsModule,
    ContractModule.register(),
    BannersModule.register(),
  ],
  providers: [sdkProvider, SdkMarketService],
  exports: [SdkMarketService],
})
export class AppModule {}
