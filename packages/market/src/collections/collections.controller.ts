import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  findAll() {
    return this.collectionsService.findAll();
  }

  @Patch('/')
  @ApiQuery({ name: 'collectionId', type: 'integer' })
  @ApiQuery({ name: 'allowedTokens', required: false })
  async create(
    @Query('collectionId') collectionId: number,
    @Query('allowedTokens') allowedTokens: string
  ) {
    console.dir({ collectionId, allowedTokens }, { depth: 10 });
    return await this.collectionsService.testCreate(
      collectionId,
      allowedTokens
    );
  }

  @Patch('/toggle')
  @ApiQuery({ name: 'id' })
  @ApiQuery({ name: 'status', enum: CollectionStatus })
  updateStatus(
    @Query('id') id: number,
    @Query('status') status: CollectionStatus
  ) {
    return this.collectionsService.toggleCollection({
      collectionId: id,
      status: status,
    });
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(+id);
  }
}
