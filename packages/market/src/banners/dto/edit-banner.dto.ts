import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BannerOptional, ButtonDefaultColor, ButtonTitleMaxLen, ButtonUrlMaxLen, DescriptionMaxLen, TitleMaxLen } from '../types';

export class EditBannerDto implements BannerOptional {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(TitleMaxLen)
  title: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(DescriptionMaxLen)
  description: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonTitleMaxLen)
  buttonTitle: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonUrlMaxLen)
  buttonUrl: string | undefined;

  @ApiProperty({ required: false, default: ButtonDefaultColor })
  @IsOptional()
  @IsString()
  buttonColor: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  sortIndex: string | undefined;

  @ApiProperty({ required: false, default: 'false' })
  @IsOptional()
  off: string | undefined;

  @ApiProperty({ required: false, default: '0' })
  @IsOptional()
  collectionId: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonTitleMaxLen)
  secondaryButtonTitle: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(ButtonUrlMaxLen)
  secondaryButtonUrl: string | undefined;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  backgroundColor: string | undefined;
}
