import { Module } from '@nestjs/common';
import { ContractEventsService } from './contract-events.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { CollectionEventsHandler, ContractEventsHandler } from './handlers';
import { CollectionsModule } from '../../collections/collections.module';
import { SdkService } from '../sdk.service';
import { TokensService } from '../../collections/tokens.service';
import { AddressService } from '@app/common/src/lib/address.service';

@Module({
  imports: [DatabaseModule.forFeature(), CollectionsModule],
  providers: [
    sdkProvider,
    ContractEventsService,
    CollectionEventsHandler,
    ContractEventsHandler,
    TokensService,
    SdkService,
    AddressService,
  ],
})
export class ContractEventsModule {}
