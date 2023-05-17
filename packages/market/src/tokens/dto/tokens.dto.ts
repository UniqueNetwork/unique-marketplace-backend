import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance, Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { SortingParameter } from '../../offers/interfaces/offers.interface';
import { CollectionDescriptionDto, OfferPriceDto, TokenDescriptionDto } from '../../offers/dto/offers.dto';

export class TokensViewDto {
  @ApiProperty()
  totalItems: number;
  @ApiProperty()
  itemCount: number;
  @ApiProperty()
  itemsPerPage: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  currentPage: number;
  @ApiProperty()
  @Type(() => TokensEntityDto)
  items: TokensEntityDto[];
  @ApiProperty()
  attributes: any;
  @ApiProperty()
  attributesCount: any[];
}

export class TokensViewFilterDto {
  @ApiProperty({ description: 'Token ID', example: 16 })
  @Expose()
  tokenId: number[];

  @ApiProperty({ required: false, type: String })
  @Type(() => BigInt)
  @IsOptional()
  public minPrice?: bigint;

  @ApiProperty({ required: false, type: String })
  @Type(() => BigInt)
  @IsOptional()
  public maxPrice?: bigint;

  @ApiProperty({ required: false })
  public seller?: string;

  @ApiProperty({
    name: 'numberOfAttributes',
    items: { type: 'integer', default: '' },
    required: false,
    type: 'array',
    isArray: true,
  })
  public numberOfAttributes?: number[];

  @ApiProperty({ required: false })
  public searchText?: string;

  @ApiProperty({ required: false })
  public searchLocale?: string;

  @ApiProperty({
    name: 'attributes',
    items: { type: 'string', default: '' },
    required: false,
    type: 'array',
    isArray: true,
  })
  public attributes?: string[];

  @ApiProperty({
    items: { type: 'string', default: 'desc(CreationDate)' },
    description: 'Possible values: asc(Price), desc(Price), asc(TokenId), desc(TokenId), asc(CreationDate), desc(CreationDate)',
    required: false,
  })
  public sort?: SortingParameter[];
}

export class TokensEntityDto {
  @ApiProperty({ description: 'Collection ID', example: 16 })
  @Expose()
  collectionId: number;

  @ApiProperty({ description: 'Token ID', example: 4 })
  @Expose()
  tokenId: number;

  @ApiProperty({ description: 'Price', example: OfferPriceDto })
  @Expose()
  price: OfferPriceDto;

  @ApiProperty({ description: 'Contract ask from', example: '5CfC8HRcV5Rc4jHFHmZsSjADCMYc7zoWbvxdoNG9qwEP7aUB' })
  @Expose()
  seller: string;

  @ApiProperty({ description: 'Status offer', example: 'Opened' })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Data created', example: new Date() })
  @Expose()
  creationAt: Date;

  @ApiProperty({ description: 'Token description' })
  @Expose()
  @Type(() => TokenDescriptionDto)
  tokenDescription: TokenDescriptionDto;

  @ApiProperty({ description: 'Collection description' })
  @Expose()
  @Type(() => CollectionDescriptionDto)
  collectionDescription: CollectionDescriptionDto;

  static fromViewer(offersData: any): TokensEntityDto {
    console.dir(offersData, { depth: 10 });
    const plain: Record<string, any> = {
      ...offersData,
      collectionId: +offersData.collection_id,
      tokenId: +offersData.token_id,
      order: +offersData.offer_order_id,
      price: offersData.offer_price_parsed,
      seller: offersData.offer_seller,
      creationAt: offersData.offer_created_at,
      status: offersData.offer_status,
    };

    return plainToInstance<TokensEntityDto, Record<string, any>>(TokensEntityDto, plain, {
      excludeExtraneousValues: true,
    });
  }
}
