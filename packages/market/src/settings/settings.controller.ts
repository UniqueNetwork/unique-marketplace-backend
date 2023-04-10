import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsDto } from './dto/setting.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as utils from '../utils/utils';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get market settings',
    description: utils.readApiDocs('settings.md'),
  })
  @ApiResponse({ type: SettingsDto, status: HttpStatus.OK })
  async getSettings(): Promise<SettingsDto> {
    return this.settingsService.getSettings();
  }
}
