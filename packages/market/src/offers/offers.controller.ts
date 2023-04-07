import { OfferService } from '@app/common/modules/database/services/offer.service';
import { Controller, forwardRef, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Get('/offers')
  async getOffers() {}
}
