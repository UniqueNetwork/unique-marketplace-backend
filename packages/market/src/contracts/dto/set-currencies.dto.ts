import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RemoveCurrencyDto {
  @ApiProperty()
  @IsNumber()
  collectionId: number;

  @ApiProperty()
  @IsString()
  contractAddress: string;
}

export class CurrencyDto {
  @ApiProperty()
  @IsNumber()
  collectionId: number;

  @ApiProperty()
  @IsNumber()
  decimals: number;

  @ApiProperty()
  @IsString()
  iconUrl: string;

  @ApiProperty()
  @IsNumber()
  fee: number;

  @ApiProperty()
  @IsString()
  name: string;
}

export class SetCurrenciesDto {
  @ApiProperty({ type: CurrencyDto })
  @Type(() => CurrencyDto)
  @IsObject()
  @ValidateNested()
  currency: CurrencyDto;

  @ApiProperty()
  @IsString()
  contractAddress: string;
}
