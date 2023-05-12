import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { AdminController } from './admin.controller';
import { SdkMarketService } from '../sdk/sdk.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';

@Module({
  controllers: [AdminController],
  providers: [SessionService, sdkProvider, SdkMarketService],
})
export class AdminModule {}
