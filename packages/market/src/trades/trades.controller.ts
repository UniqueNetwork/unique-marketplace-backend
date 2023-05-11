import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto, MarketTradeDto, ResponseMarketTradeDto, TradesFilterDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import fs from 'fs';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginationRequest, TradeSortingRequest } from '../offers/dto/offers.dto';
import { ParseTradesFilterPipe } from './pipes/trade-filter.pipe';
import { PaginationResult } from '../offers/interfaces/offers.interface';
import { queryArray, readApiDocs } from '../utils/utils';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Get('/')
  @ApiQuery(queryArray('collectionId', 'integer'))
  @ApiOperation({
    summary: 'Get trades with sort and filters',
    description: readApiDocs('trades.md'),
  })
  @ApiResponse({ type: ResponseMarketTradeDto, status: HttpStatus.OK })
  get(
    @Query() pagination: PaginationRequest,
    @Query() sort: TradeSortingRequest,
    @Query(ParseTradesFilterPipe) tradesFilter: TradesFilterDto,
  ): Promise<PaginationResult<MarketTradeDto>> {
    return this.tradesService.get(tradesFilter, undefined, pagination, sort);
  }
}
