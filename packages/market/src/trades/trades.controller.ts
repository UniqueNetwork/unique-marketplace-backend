import { Controller, DefaultValuePipe, Get, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesFilterDto } from './dto/create-trade.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { TradeSortingRequest } from '../offers/dto/offers.dto';
import { ParseTradesFilterPipe } from './pipes/trade-filter.pipe';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get trades with sort and filters',
    description: readApiDocs('trades.md'),
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  get(
    @Query('accountId') accountId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query() sort: TradeSortingRequest,
    @Query(ParseTradesFilterPipe) tradesFilter: TradesFilterDto,
  ): Promise<any> {
    const paginationRequest = { page, limit } as PaginationRouting;
    console.dir(tradesFilter, { depth: 10 });
    return this.tradesService.get(tradesFilter, accountId, paginationRequest, sort);
  }
}
