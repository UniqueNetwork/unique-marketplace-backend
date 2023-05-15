import { forwardRef, Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';
import { SdkMarketService } from '../sdk/sdk.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { SessionService } from '../admin/session.service';

@Module({
  imports: [forwardRef(() => PgNotifyClientModule)],
  controllers: [CollectionsController],
  providers: [CollectionsService, sdkProvider, SdkMarketService, SessionService],
})
export class CollectionsModule {}
