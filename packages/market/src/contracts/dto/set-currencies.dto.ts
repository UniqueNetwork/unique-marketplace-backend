import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
}

export class SetCurrenciesDto {
  @ApiProperty({ type: CurrencyDto, isArray: true })
  @Type(() => CurrencyDto)
  @IsArray()
  @ValidateNested({ each: true })
  currencies: CurrencyDto[];

  @ApiProperty()
  @IsString()
  contractAddress: string;
}
