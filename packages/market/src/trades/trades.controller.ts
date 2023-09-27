import { Controller, DefaultValuePipe, Get, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesFilterDto } from './dto/create-trade.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParseTradesFilterPipe } from './pipes/trade-filter.pipe';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { SortingRequest } from '@app/common/modules/types/requests';
import { ParseSortTradeFilterPipe } from './pipes/sort-tradefilter.pipe';

@ApiTags('Trades')
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
  get(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query(ParseSortTradeFilterPipe) sortFilter: SortingRequest,
    @Query(ParseTradesFilterPipe) tradesFilter: TradesFilterDto,
  ): Promise<any> {
    const paginationRequest = { page, limit } as PaginationRouting;
    const accountId = undefined;
    return this.tradesService.get(tradesFilter, accountId, paginationRequest, sortFilter);
  }

  @Get('/:accountId')
  @ApiOperation({
    summary: 'Get trades with sort and filters',
    description: readApiDocs('trades.md'),
  })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  getBySeller(
    @Param('accountId') accountId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query(ParseSortTradeFilterPipe) sortFilter: SortingRequest,
    @Query(ParseTradesFilterPipe) tradesFilter: TradesFilterDto,
  ): Promise<any> {
    const paginationRequest = { page, limit } as PaginationRouting;
    return this.tradesService.get(tradesFilter, accountId, paginationRequest, sortFilter);
  }
}
