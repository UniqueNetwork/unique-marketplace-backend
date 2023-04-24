import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { BundleService } from './bundle.service';
import { ViewOffersService } from './view-offers.service';
import { CollectionsService } from '../collections/collections.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, BundleService, ViewOffersService],
  exports: [OffersService],
})
export class OffersModule {}
