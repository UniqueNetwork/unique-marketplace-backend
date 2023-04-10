import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.testCreate(createCollectionDto);
  }

  @Get('/')
  findAll() {
    return this.collectionsService.findAll();
  }

  @Get('/:id/')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(+id);
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto
  ) {
    return this.collectionsService.update(+id, updateCollectionDto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(+id);
  }
}
