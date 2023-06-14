import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollectionStatus } from '@app/common/modules/types';
import { BaseController } from '@app/common/src/lib/base.controller';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { AddTokensDto, PaginateCollectionDto, ResponseTokenDto } from './dto/create-collection.dto';
import { readApiDocs } from '../utils/utils';
import { ApiBearerAuthMetamaskAndSubstrate } from '../admin/decorators/login.decorator';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController extends BaseController<CollectionsService> {
  constructor(private readonly collectionsService: CollectionsService) {
    super();
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    type: PaginateCollectionDto,
    status: HttpStatus.OK,
  })
  @ApiOperation({
    summary: 'Show the entire list of collections',
    description: readApiDocs('collection-add.md'),
  })
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10,
  ): Promise<PaginateCollectionDto> {
    limit = limit > 100 ? 100 : limit;
    return await this.collectionsService.findAll({
      page,
      limit,
    } as PaginationRouting);
  }

  @Get('/:collectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adding the collection and its tokens to the database',
    description: readApiDocs('collection-add.md'),
  })
  @ApiParam({ name: 'collectionId', type: 'integer' })
  async getOne(@Param('collectionId') collectionId: number) {
    return await this.collectionsService.getOneColection(collectionId);
  }

  @Patch('/add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adding the collection and its tokens to the database',
    description: readApiDocs('collection-add.md'),
  })
  @ApiBearerAuthMetamaskAndSubstrate()
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  @ApiQuery({ name: 'force', type: 'boolean', required: false })
  async addCollection(@Query('collectionId') collectionId: number, @Query('force') force: boolean = false) {
    return await this.collectionsService.addCollection(collectionId, force ?? false);
  }

  @Patch('/metadata/:collectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create and update metadata for collection',
    description: readApiDocs('collection-add.md'),
  })
  @ApiBearerAuthMetamaskAndSubstrate()
  @ApiParam({ name: 'collectionId', type: 'integer' })
  @ApiBody({
    schema: {
      properties: {
        metadata: { type: 'object', example: { facebook: 'url' } },
      },
    },
  })
  async editeMetadata(@Body('metadata') body: any, @Param('collectionId') collectionId: number) {
    console.dir({ body }, { depth: 10 });
    return await this.collectionsService.updateMetaData(collectionId, body);
  }

  @Patch('/allowed/tokens/:collectionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuthMetamaskAndSubstrate()
  @ApiOperation({
    summary: 'Adding and removing tokens that can be put up for sale',
    description: readApiDocs('tokens-for-sales.md'),
  })
  @ApiResponse({ status: HttpStatus.OK, type: ResponseTokenDto })
  async addTokens(@Param('collectionId') collectionId: number, @Body() data: AddTokensDto): Promise<ResponseTokenDto> {
    return await this.collectionsService.allowedTokens(collectionId, data);
  }

  @Patch('/toggle')
  @ApiQuery({ name: 'id' })
  @ApiBearerAuthMetamaskAndSubstrate()
  @ApiQuery({ name: 'status', enum: CollectionStatus })
  async updateStatus(@Query('id') id: number, @Query('status') status: CollectionStatus) {
    return await this.collectionsService.toggleCollection({
      collectionId: id,
      status: status,
    });
  }
}
