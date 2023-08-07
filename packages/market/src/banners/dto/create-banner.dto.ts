import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BannerKeys, ButtonTitleMaxLen, ButtonUrlMaxLen, DescriptionMaxLen, TitleMaxLen } from '../types';

export class CreateBannerDto implements Record<BannerKeys, any> {
  @ApiProperty()
  @IsString()
  @MaxLength(TitleMaxLen)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(DescriptionMaxLen)
  description: string;

  @ApiProperty()
  @IsString()
  @MaxLength(ButtonTitleMaxLen)
  buttonTitle: string;

  @ApiProperty()
  @IsString()
  @MaxLength(ButtonUrlMaxLen)
  buttonUrl: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  buttonColor: string;

  @ApiProperty({ required: false, default: '0' })
  @IsOptional()
  sortIndex: string;

  @ApiProperty({ required: false, default: 'false' })
  @IsOptional()
  off: string;

  @ApiProperty({ required: false, default: '0' })
  @IsOptional()
  collectionId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(ButtonTitleMaxLen)
  secondaryButtonTitle: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(ButtonUrlMaxLen)
  secondaryButtonUrl: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  backgroundColor: string;
}
