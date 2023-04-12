import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';

@Module({
  controllers: [CollectionsController],
  providers: [CollectionsService, sdkProvider],
})
export class CollectionsModule {}
