import { Module } from '@nestjs/common';
import { ContractEventsService } from './contract-events.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { CollectionEventsHandler, ContractEventsHandler } from './handlers';
import { CollectionsModule } from '../../collections/collections.module';
import { SdkService } from '../sdk.service';
import { TokensService } from '../../collections/tokens.service';

@Module({
  imports: [DatabaseModule.forFeature(), CollectionsModule],
  providers: [sdkProvider, ContractEventsService, CollectionEventsHandler, ContractEventsHandler, TokensService, SdkService],
})
export class ContractEventsModule {}
