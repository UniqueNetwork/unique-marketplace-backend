import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { OffersDto } from './dto/offers.dto';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Get('/')
  async get(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    limit = limit > 100 ? 100 : limit;
    return await this.offersService.getOffers({
      page,
      limit,
    });
  }

  @Post('/test_create')
  async postOffers(@Body() offer: OffersDto) {
    return this.offersService.testAddOffer(offer);
  }
}
