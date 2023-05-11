import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SdkMarketService } from '../sdk/sdk.service';
import { sdkProvider } from '@app/common/modules/sdk/sdk.provider';

@Module({
  controllers: [AdminController],
  providers: [AdminService, sdkProvider, SdkMarketService],
})
export class AdminModule {}
