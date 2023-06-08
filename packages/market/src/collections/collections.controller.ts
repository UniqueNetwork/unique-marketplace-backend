import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus, NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards
} from "@nestjs/common";
import { CollectionsService } from './collections.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollectionStatus } from '@app/common/modules/types';
import { BaseController } from '@app/common/src/lib/base.controller';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { AddTokensDto, PaginateCollectionDto, ResponseTokenDto } from './dto/create-collection.dto';
import { readApiDocs } from '../utils/utils';
import { LoginGuard } from '../admin/guards/login.guard';

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
  @ApiOperation({
    summary: 'Adding the collection and its tokens to the database',
    description: readApiDocs('collection-add.md'),
  })
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  async getOne(@Query('collectionId') collectionId: number) {
    const collection = await this.collectionsService.findOne(collectionId);
    if (!collection) {
      throw new NotFoundException(`Collection by ID ${collectionId} not found on market`);
    }
    // todo add cover, social links, etc.
    return collection;
  }

  @Patch('/add')
  @ApiOperation({
    summary: 'Adding the collection and its tokens to the database',
    description: readApiDocs('collection-add.md'),
  })
  //@ApiBearerAuth()
  //@UseGuards(LoginGuard)
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  @ApiQuery({ name: 'account', type: 'string', required: false })
  async addCollection(@Query('collectionId') collectionId: number) {
    return await this.collectionsService.addCollection(collectionId);
  }

  @Patch('test/add')
  @ApiOperation({
    summary: 'Adding the collection and its tokens to the database',
    description: readApiDocs('collection-add.md'),
  })
  @ApiBearerAuth()
  @UseGuards(LoginGuard)
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  @ApiQuery({ name: 'account', type: 'string', required: false })
  async addCollectionTest(@Query('collectionId') collectionId: number) {
    return { collectionId: collectionId };
  }

  @Patch('/allowed/tokens/:collectionId')
  @HttpCode(HttpStatus.OK)
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
  @ApiQuery({ name: 'status', enum: CollectionStatus })
  async updateStatus(@Query('id') id: number, @Query('status') status: CollectionStatus) {
    return await this.collectionsService.toggleCollection({
      collectionId: id,
      status: status,
    });
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(+id);
  }
}
