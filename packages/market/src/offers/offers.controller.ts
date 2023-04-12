import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { OfferEventDto, OffersDto } from './dto/offers.dto';
import fs from 'fs';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get offers, filters and seller',
    description: readApiDocs('offers-get.md'),
  })
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  async get(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10
  ) {
    limit = limit > 100 ? 100 : limit;
    return await this.offersService.getOffers({
      page,
      limit,
    } as PaginationRouting);
  }

  @Post('/test_create')
  async postOffers(@Body() offer: OfferEventDto) {
    return this.offersService.testAddOffer(offer);
  }
}
