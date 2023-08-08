import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { readApiDocs } from '../utils/utils';
import { CreateBannerDto, EditBannerDto } from './dto';
import { BannersService } from './banners.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { bannerSchema } from './schemas/banner.schema';
import { GetAllDto } from './dto/get-all.dto';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new banner',
    description: readApiDocs('banners-create.md'),
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: bannerSchema,
  })
  @UseInterceptors(FileInterceptor('file'))
  async createBanner(@Query('secretKey') secretKey: string, @Body() dto: CreateBannerDto, @UploadedFile() file) {
    return this.bannersService.create(secretKey, dto, file);
  }

  @Patch(':bannerId')
  @ApiOperation({
    summary: 'Edit banner',
    description: readApiDocs('banners-create.md'),
  })
  @ApiParam({ name: 'bannerId', type: 'string', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: bannerSchema,
  })
  @UseInterceptors(FileInterceptor('file'))
  async editBanner(
    @Query('secretKey') secretKey: string,
    @Param('bannerId') bannerId: string,
    @Body() dto: EditBannerDto,
    @UploadedFile() file,
  ) {
    return this.bannersService.edit(secretKey, bannerId, dto, file);
  }

  @Delete(':bannerId')
  @ApiOperation({
    summary: 'Delete banner by id',
  })
  @ApiParam({ name: 'bannerId', type: 'string', required: true })
  async deleteOne(@Query('secretKey') secretKey: string, @Param('bannerId') bannerId: string) {
    return this.bannersService.deleteOne(secretKey, bannerId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all banners',
  })
  async getAll(@Query() dto: GetAllDto) {
    return this.bannersService.getAll(dto);
  }

  @Get(':bannerId')
  @ApiOperation({
    summary: 'Get banner by id',
  })
  @ApiParam({ name: 'bannerId', type: 'string', required: true })
  async getOne(@Param('bannerId') bannerId: string) {
    return this.bannersService.getOne(bannerId);
  }
}
