import {
  Body,
  Controller,
  DefaultValuePipe,
  Get, Param,
  ParseIntPipe,
  Post,
  Query
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { OffersDto } from './dto/offers.dto';
import { OfferEntity } from "@app/common/modules/database";

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

  @Get(':id')
  @ApiOperation({
    summary: 'Get offer by ID',
  })
  getById(
    @Param('id') id: string,
  ): Promise<OfferEntity> {
    return this.offersService.getOffer(id);
  }

  @Post('/test_create')
  async postOffers(@Body() offer: OffersDto) {
    return this.offersService.testAddOffer(offer);
  }
}
