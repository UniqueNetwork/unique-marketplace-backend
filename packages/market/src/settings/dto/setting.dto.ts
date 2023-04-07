import { ApiProperty } from '@nestjs/swagger';
import { SettingBlockchain } from '../interfaces/settings.interface';

export class SettingsDto {
  @ApiProperty({})
  marketType: string;
  @ApiProperty({})
  administrators: string[];

  @ApiProperty({})
  blockchain: SettingBlockchain;
}
