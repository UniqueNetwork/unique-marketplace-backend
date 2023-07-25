import { DynamicModule, Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { loadFileStorageConfig } from '@app/common/modules/config/load.config';

@Module({})
export class BannersModule {
  static register(): DynamicModule {
    const config = loadFileStorageConfig();

    if (!config || !config.endPoint || !config.bucketName || !config.accessKey || !config.secretKey) {
      return {
        module: BannersModule,
      };
    }

    return {
      controllers: [BannersController],
      providers: [BannersService],
      module: BannersModule,
    };
  }
}
