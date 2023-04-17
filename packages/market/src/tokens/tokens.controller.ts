import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginateCollectionDto } from '../collections/dto/create-collection.dto';
import { readApiDocs } from '../utils/utils';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
@ApiTags('Tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    type: PaginateCollectionDto,
    status: HttpStatus.OK,
  })
  @ApiOperation({
    summary: 'Show the entire list of tokens',
    description: readApiDocs('tokens-list.md'),
  })
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10
  ): Promise<PaginateCollectionDto> {
    limit = limit > 100 ? 100 : limit;
    return await this.tokensService.findAll({
      page,
      limit,
    } as PaginationRouting);
  }

  @Get('/:cid/:id')
  findOne(@Param('cid') cid: string, @Param('id') id: string) {
    return this.tokensService.findOne(+id);
  }

  @Patch('/:cid/:id')
  update(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @Body() updateTokenDto: UpdateTokenDto
  ) {
    return this.tokensService.update(+id, updateTokenDto);
  }

  @Delete('/:cid/:id')
  remove(@Param('cid') cid: string, @Param('id') id: string) {
    return this.tokensService.remove(+id);
  }
}
