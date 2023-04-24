import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { OffersDto, OffersFilter, OfferSortingRequest } from './dto/offers.dto';
import { OfferEntity } from '@app/common/modules/database';

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
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number = 10,
    @Query() offerFilter: OffersFilter,
    @Query() sort: OfferSortingRequest,
  ) {
    const limit = pageSize > 100 ? 100 : pageSize;
    const pagination = { page, limit } as PaginationRouting;
    return await this.offersService.getOffers(offerFilter, pagination, sort);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get offer by ID',
  })
  getById(@Param('id') id: string): Promise<OfferEntity> {
    return this.offersService.getOfferById(id);
  }

  @Get(':collectionId/:tokenId')
  @ApiOperation({
    summary: 'Get offer by CollectionId and TokeId',
  })
  getByCollectionIdAndTokenId(
    @Param('collectionId') collectionId: string,
    @Param('tokenId') tokenId: string,
  ): Promise<OfferEntity[]> {
    return this.offersService.getOffersByCursor({
      collectionId: Number(collectionId),
      tokenId: Number(tokenId),
    });
  }

  @Post('/test_create')
  async postOffers(@Body() offer: OffersDto) {
    return this.offersService.testAddOffer(offer);
  }
}
