import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ButtonDefaultColor, ButtonTitleMaxLen, ButtonUrlMaxLen, DescriptionMaxLen, TitleMaxLen } from '../types';

export class EditBannerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(TitleMaxLen)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(DescriptionMaxLen)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonTitleMaxLen)
  buttonTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonUrlMaxLen)
  buttonUrl?: string;

  @ApiProperty({ required: false, default: ButtonDefaultColor })
  @IsOptional()
  @IsString()
  buttonColor: string;

  @ApiProperty({ required: false })
  @IsOptional()
  sortIndex?: string;

  @ApiProperty({ required: false, default: 'false' })
  @IsOptional()
  off?: string;

  @ApiProperty({ required: false, default: '0' })
  @IsOptional()
  collectionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonTitleMaxLen)
  secondaryButtonTitle: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonUrlMaxLen)
  secondaryButtonUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  backgroundColor: string;
}
