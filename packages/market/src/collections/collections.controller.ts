import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import {
  UpdateCollectionDto,
  UpdateCollectionStatusDto,
} from './dto/update-collection.dto';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CollectionStatus } from '@app/common/modules/types';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('/')
  @ApiQuery({ name: 'page', example: 1 })
  @ApiQuery({ name: 'pageSize', example: 10 })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.collectionsService.findAll({
      page,
      limit,
      routingLabels: {
        limitLabel: 'pageSize', // default: limit
      },
    });
  }

  @Get('/test')
  test() {
    return this.collectionsService.testClientMessage();
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
