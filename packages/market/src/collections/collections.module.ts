import { forwardRef, Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';
import { SdkMarketService } from '../sdk/sdk.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { AdminService } from '../admin/admin.service';

@Module({
  imports: [forwardRef(() => PgNotifyClientModule)],
  controllers: [CollectionsController],
  providers: [CollectionsService, sdkProvider, SdkMarketService, AdminService],
})
export class CollectionsModule {}
