import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance, Type } from 'class-transformer';
import { TradeViewEntity } from '@app/common/modules/database';

export class CreateTradeDto {}

export class TradesFilterDto {
  @ApiProperty({
    name: 'collectionId',
    items: { type: 'integer', default: '' },
    required: false,
    type: 'array',
    isArray: true,
  })
  public collectionId?: number[];

  @ApiProperty({
    name: 'tokenId',
    items: { type: 'integer', default: '' },
    required: false,
    type: 'array',
    isArray: true,
  })
  public tokenId?: number[];

  @ApiProperty({ required: false })
  public searchText?: string;

  @ApiProperty({
    name: 'traits',
    items: { type: 'string', default: '' },
    required: false,
    type: 'array',
    isArray: true,
  })
  public traits?: string[];
}

export class TradeOfferEvents {
  buyer: string;
  seller: string;
  collectionId: number;
  tokenId: number;
  creationDate: Date;
  price: string;
  tradeDate: Date;
  status: string;
  offerId: string;
}

export class TradePriceDto {
  parsed: number;
  raw: string;
  commission: number;
}

export class TradeOfferDto {
  @ApiProperty({ description: 'Collection ID' })
  @Expose()
  @Type(() => Number)
  collectionId: number;

  @ApiProperty({ description: 'Token ID' })
  @Expose()
  @Type(() => Number)
  tokenId: number;

  @ApiProperty({ description: 'Price' })
  @Expose()
  @Type(() => TradePriceDto)
  price: TradePriceDto;

  @ApiProperty({ description: 'Seller' })
  @Expose()
  @Type(() => String)
  seller: string;

  @ApiProperty({ description: 'Buyer' })
  @Expose()
  @Type(() => String)
  buyer: string;

  @ApiProperty({})
  @Expose()
  @Type(() => Date)
  creationDate: Date;

  @ApiProperty({})
  @Expose()
  tradeDate: Date;

  @ApiProperty({ description: 'Offer Id' })
  @Expose()
  @Type(() => String)
  offerId: string;

  @ApiProperty({ description: 'Offer Id' })
  @Expose()
  @Type(() => Object)
  tokenDescription: any;

  static parseItem(trade: TradeViewEntity): TradeOfferDto {
    const { data } = trade;
    const item: Record<string, any> = {
      tokenId: +trade.token_id,
      collectionId: trade.collection_id,
      offerId: trade.offer_id,
      buyer: trade.buyer,
      seller: trade.seller,
      price: { parsed: +trade.price_parsed, raw: trade.price_raw, commission: trade.contract_commission },
      contract: { address: trade.contract_address, commission: trade.contract_commission },
      creationDate: trade.created_date,
      tradeDate: trade.trade_date,
      owners: data?.owner,
      tokenDescription: {
        collectionName: data?.collection?.name,
        coverPicture: data?.collection?.info.cover_image.url,
        mode: data?.collection?.mode,
        prefix: data?.collection?.tokenPrefix,
        description: data?.collection?.description,
        image: data?.image,
        attributes: data?.attributes,
      },
    };

    return plainToInstance<TradeOfferDto, Record<string, any>>(TradeOfferDto, item, {
      excludeExtraneousValues: false,
    });
  }
}
