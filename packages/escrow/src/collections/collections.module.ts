import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { SdkService } from '../app/sdk.service';
import { TokensTask } from '../tasks/tokens.task';
import { CollectionTask } from '../tasks/collection.task';
import { PropertiesTask } from '../tasks/properties.task';

@Module({
  controllers: [CollectionsController],
  providers: [
    CollectionsService,
    sdkProvider,
    SdkService,
    TokensTask,
    CollectionTask,
    PropertiesTask,
  ],
})
export class CollectionsModule {}
