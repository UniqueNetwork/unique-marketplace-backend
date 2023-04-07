import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { AddressService } from '../utils/address.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AddressService],
  exports: [AddressService],
})
export class SettingsModule {}
