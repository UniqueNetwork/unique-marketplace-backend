import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { SdkService } from '../app/sdk.service';
import { TokensTask } from '../tasks/tokens.task';
import { CollectionTask } from '../tasks/collection.task';
import { PropertiesTask } from '../tasks/properties.task';
import { OffersSubscriber } from './offers.subscriber';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TokensService } from './tokens.service';
import { AddressService } from '@app/common/src/lib/address.service';

@Module({
  controllers: [CollectionsController],
  providers: [
    CollectionsService,
    sdkProvider,
    SdkService,
    TokensTask,
    CollectionTask,
    PropertiesTask,
    OffersSubscriber,
    TokensService,
    AddressService,
  ],
  exports: [CollectionsService],
})
export class CollectionsModule {
  constructor(@InjectDataSource() dataSource: DataSource, offersSubscriber: OffersSubscriber) {
    dataSource.subscribers.push(offersSubscriber);
  }
}
