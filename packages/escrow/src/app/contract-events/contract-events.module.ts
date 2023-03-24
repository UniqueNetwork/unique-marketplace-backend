import { Module } from '@nestjs/common';
import { ContractEventsService } from './contract-events.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { DatabaseModule } from '@app/common/modules/database/database.module';
import { CollectionEventsHandler } from './collection-events.handler';

@Module({
  imports: [DatabaseModule.forEscrow()],
  providers: [sdkProvider, ContractEventsService, CollectionEventsHandler],
})
export class ContractEventsModule {}
