import { Controller, DefaultValuePipe, Get, HttpStatus, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { OfferEntityDto, OffersAttributesResultDto, OffersFilter, OffersResultDto } from './dto/offers.dto';
import { ParseOffersFilterPipe } from './pipes/offer-filter.pipe';
import { SortingOfferRequest } from '@app/common/modules/types/requests';
import { ParseSortFilterPipe } from './pipes/sort-order.pipe';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get offers, filters and seller',
    description: readApiDocs('offers-get.md'),
  })
  @ApiResponse({ type: OffersResultDto, status: HttpStatus.OK })
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  async get(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number = 10,
    @Query(ParseOffersFilterPipe) offerFilter: OffersFilter,
    @Query(ParseSortFilterPipe) sortFilter: SortingOfferRequest,
  ) {
    const limit = pageSize > 100 ? 100 : pageSize;
    const pagination = { page, limit } as PaginationRouting;
    return await this.offersService.getOffers(offerFilter, pagination, sortFilter);
  }

  @Get('/attributes')
  @ApiOperation({
    summary: 'Get offers attributes',
  })
  @ApiResponse({ type: OffersAttributesResultDto, status: HttpStatus.OK })
  async getAttributes() {
    return await this.offersService.getOfferAttributes();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get offer by ID',
  })
  getById(@Param('id') offerId: string): Promise<OfferEntityDto | null> {
    return this.offersService.getOne({ offerId });
  }

  @Get('/:collectionId/:tokenId')
  @ApiOperation({
    summary: 'Get one offer',
    description: readApiDocs('offers-get.md'),
  })
  @ApiResponse({ type: OfferEntityDto, status: HttpStatus.OK })
  async getOneOffer(
    @Param('collectionId', ParseIntPipe) collectionId: number,
    @Param('tokenId', ParseIntPipe) tokenId: number,
  ): Promise<OfferEntityDto> {
    const offer = await this.offersService.getOne({ collectionId, tokenId });
    if (offer) {
      return offer;
    } else {
      throw new NotFoundException(`No active offer for collection ${collectionId}, token ${tokenId}`);
    }
  }
}
