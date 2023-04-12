import {
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
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollectionStatus } from '@app/common/modules/types';
import { BaseController } from '@app/common/src/lib/base.controller';
import { PaginationRouting } from '@app/common/src/lib/base.constants';
import { PaginateCollectionDto } from './dto/create-collection.dto';

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
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10
  ): Promise<PaginateCollectionDto> {
    limit = limit > 100 ? 100 : limit;
    return await this.collectionsService.findAll({
      page,
      limit,
    } as PaginationRouting);
  }

  @Get('/test')
  test() {
    return this.collectionsService.testClientMessage();
  }

  @Patch('/add')
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  async addCollection(@Query('collectionId') collectionId: number) {
    return await this.collectionsService.addCollection(collectionId);
  }

  @Patch('/')
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  @ApiQuery({ name: 'allowedTokens', required: false })
  async create(
    @Query('collectionId') collectionId: number,
    @Query('allowedTokens') allowedTokens: string
  ) {
    return await this.collectionsService.testCreate(
      collectionId,
      allowedTokens
    );
  }

  @Patch('/toggle')
  @ApiQuery({ name: 'id' })
  @ApiQuery({ name: 'status', enum: CollectionStatus })
  async updateStatus(
    @Query('id') id: number,
    @Query('status') status: CollectionStatus
  ) {
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
