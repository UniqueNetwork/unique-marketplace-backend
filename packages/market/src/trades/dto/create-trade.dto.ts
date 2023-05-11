import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance, Type } from 'class-transformer';
import { TokenDescriptionDto } from '../../offers/dto/offers.dto';
import { TypeAttributToken } from '@app/common/modules/types';
import { OfferEntity, OfferEventEntity } from '@app/common/modules/database';

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

export class MarketTradeDto {
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
  @Type(() => String)
  price: string;

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

  @ApiProperty({ description: 'Token description' })
  @Expose()
  @Type(() => TokenDescriptionDto)
  tokenDescription: TokenDescriptionDto;

  // static fromTrade(trade: TradeOfferEvents): any {
  //   console.dir(trade, { depth: 10 });
  //   const plain: Record<string, any> = {
  //     buyer: trade.seller,
  //     seller: trade.seller,
  //     collectionId: +trade.offer.collectionId,
  //     creationDate: trade.offer.createdAt,
  //     price: trade.offer.priceRaw,
  //     tokenId: +trade.offer.tokenId,
  //     tradeDate: trade.createdAt,
  //     offerId: trade?.offer.id || null,
  //   };
  //
  //   if (Array.isArray(trade?.) {
  //     plain.tokenDescription = trade?.token_properties.reduce(
  //       (acc, item) => {
  //         if (item.type === TypeAttributToken.Prefix) {
  //           acc.prefix = item.items.pop();
  //         }
  //         //TODO: Переделать сборку токена
  //         if (item.key === 'collectionName') {
  //           acc.collectionName = item.items.pop();
  //         }
  //
  //         if (item.key === 'description') {
  //           acc.description = item.items.pop();
  //         }
  //
  //         if ([TypeAttributToken.ImageURL, TypeAttributToken.VideoURL].includes(item.type)) {
  //           acc[`${item.key}`] = item.items.pop();
  //         }
  //
  //         if (
  //           (item.type === TypeAttributToken.String || item.type === TypeAttributToken.Enum) &&
  //           !['collectionName', 'description'].includes(item.key)
  //         ) {
  //           acc.attributes.push({
  //             key: item.key,
  //             value: item.items.length === 1 ? item.items.pop() : item.items,
  //             type: item.type,
  //           });
  //         }
  //         return acc;
  //       },
  //       {
  //         attributes: [],
  //       },
  //     );
  //   }
  //
  //   return plainToInstance<MarketTradeDto, Record<string, any>>(MarketTradeDto, plain, {
  //     excludeExtraneousValues: true,
  //   });
  //}
}

export class ResponseMarketTradeDto {
  @ApiProperty({})
  page: number;

  @ApiProperty({})
  pageSize: number;

  @ApiProperty({})
  itemsCount: number;

  @ApiProperty({ type: [MarketTradeDto], format: 'array' })
  items: [MarketTradeDto];
}
