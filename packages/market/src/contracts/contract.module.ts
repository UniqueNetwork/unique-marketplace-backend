import { forwardRef, Module, DynamicModule } from '@nestjs/common';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';
import { SdkMarketService } from '../sdk/sdk.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';
import { SessionService } from '../admin/session.service';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contract.controller';
import { loadFileStorageConfig } from '@app/common/modules/config/load.config';

@Module({})
export class ContractModule {
  static register(): DynamicModule {
    const config = loadFileStorageConfig();

    if (!config || !config.endPoint || !config.bucketName || !config.accessKey || !config.secretKey) {
      return {
        module: ContractModule,
      };
    }

    return {
      imports: [forwardRef(() => PgNotifyClientModule)],
      controllers: [ContractsController],
      providers: [ContractsService, sdkProvider, SdkMarketService, SessionService],
      module: ContractModule,
    };
  }
}
