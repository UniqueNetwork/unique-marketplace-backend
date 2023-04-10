import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { OffersDto } from './dto/offers.dto';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Get('/')
  async get() {
    return await this.offersService.getOffers();
  }

  @Post('/test_create')
  async postOffers(@Body() offer: OffersDto) {
    return this.offersService.testAddOffer(offer);
  }
}
