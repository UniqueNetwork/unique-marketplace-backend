import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsIn, Length, IsUrl } from 'class-validator';
import {
  ButtonTitleMaxLen,
  ButtonTitleMinLen,
  ButtonUrlMaxLen,
  ButtonUrlMinLen,
  DescriptionMaxLen,
  DescriptionMinLen,
  TitleMaxLen,
  TitleMinLen,
} from '../types';

export class CreateBannerDto {
  @ApiProperty()
  @IsString()
  @Length(TitleMinLen, TitleMaxLen)
  title: string;

  @ApiProperty()
  @IsString()
  @Length(DescriptionMinLen, DescriptionMaxLen)
  description: string;

  @ApiProperty()
  @IsString()
  @Length(ButtonTitleMinLen, ButtonTitleMaxLen)
  buttonTitle: string;

  @ApiProperty()
  @IsString()
  @Length(ButtonUrlMinLen, ButtonUrlMaxLen)
  buttonUrl: string;

  @ApiProperty()
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
  @Length(ButtonTitleMinLen, ButtonTitleMaxLen)
  secondaryButtonTitle: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(ButtonUrlMinLen, ButtonUrlMaxLen)
  secondaryButtonUrl: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  secondaryButtonColor: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  backgroundColor: string;
}
