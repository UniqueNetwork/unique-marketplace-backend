import { ApiProperty } from '@nestjs/swagger';

export class EditBannerDto {
  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  minioFile?: string;

  @ApiProperty({ required: false })
  buttonTitle?: string;

  @ApiProperty({ required: false })
  buttonUrl?: string;

  @ApiProperty({ required: false })
  sortIndex?: string;

  @ApiProperty({ required: false, default: 'false' })
  off?: string;

  @ApiProperty({ required: false, default: '0' })
  collectionId?: string;
}
