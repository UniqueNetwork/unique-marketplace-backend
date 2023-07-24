import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  mediaUrl: string;

  @ApiProperty()
  buttonTitle: string;

  @ApiProperty()
  buttonUrl: string;

  @ApiProperty({ required: false, default: '0' })
  sortIndex: string;

  @ApiProperty({ required: false, default: 'false' })
  off: string;

  @ApiProperty({ required: false, default: '0' })
  collectionId: string;
}
