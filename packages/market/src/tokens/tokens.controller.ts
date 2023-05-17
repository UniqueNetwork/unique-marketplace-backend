import { Controller, DefaultValuePipe, Get, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { SortingRequest } from '@app/common/modules/types/requests';
import { ParseTokensFilterPipe } from './pipes/tokens.pipe';
import { TokensViewDto, TokensViewFilterDto } from './dto/tokens.dto';

@ApiTags('Tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get('/:collectionId')
  @ApiOperation({
    summary: 'Get all tokens with filters',
    description: readApiDocs('offers-get.md'),
  })
  @ApiResponse({ type: TokensViewDto, status: HttpStatus.OK })
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  @ApiQuery({ name: 'tokenId', required: false })
  async get(
    @Param('collectionId') collectionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number = 10,
    @Query(ParseTokensFilterPipe) tokenFilter: TokensViewFilterDto,
    @Query() sort: SortingRequest,
  ) {
    const limit = pageSize > 100 ? 100 : pageSize;
    const pagination = { page, limit } as PaginationRouting;
    return await this.tokensService.findTokensByCollection(+collectionId, tokenFilter, pagination, sort);
  }
}
