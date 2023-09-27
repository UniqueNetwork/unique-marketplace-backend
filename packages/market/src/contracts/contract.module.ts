import { forwardRef, Module } from '@nestjs/common';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';
import { SdkMarketService } from '../sdk/sdk.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { SessionService } from '../admin/session.service';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contract.controller';

@Module({
  imports: [forwardRef(() => PgNotifyClientModule)],
  controllers: [ContractsController],
  providers: [ContractsService, sdkProvider, SdkMarketService, SessionService],
})
export class ContractModule {}
