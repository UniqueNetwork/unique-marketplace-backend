import { ApiProperty } from '@nestjs/swagger';

export enum SortingOrder {
  Asc = 0,
  Desc = 1,
}

export interface SortingParameter {
  column: string;

  order: SortingOrder;
}

export class SortingRequest {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      enum: [
        'asc(Price)',
        'desc(Price)',
        'asc(TokenId)',
        'desc(TokenId)',
        'asc(CollectionId)',
        'desc(CollectionId)',
        'asc(TradeDate)',
        'desc(TradeDate)',
      ],
    },
    default: ['desc(TradeDate)'],
    description:
      'Possible values: asc(Price), desc(Price), asc(TokenId), desc(TokenId), asc(CollectionId), desc(CollectionId), asc(TradeDate), desc(TradeDate)',
    required: false,
  })
  public sort: SortingParameter[];
}

export class SortingOfferRequest {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      enum: [
        'asc(Price)',
        'desc(Price)',
        'asc(TokenId)',
        'desc(TokenId)',
        'asc(CollectionId)',
        'desc(CollectionId)',
        'asc(CreationDate)',
        'asc(CreationDate)',
      ],
    },
    default: ['desc(CreationDate)'],
    description:
      'Possible values: asc(Price), desc(Price), asc(TokenId), desc(TokenId), asc(CollectionId), desc(CollectionId), asc(CreationDate), asc(CreationDate)',
    required: false,
  })
  public sort: SortingParameter[];
}

export type OffersFilterType = {
  offer_id: string;
  offer_status: string;
  offer_order_id: string;
  collection_id: number;
  token_id: number;
  offer_network: string;
  offer_price: OfferPrice;
  offer_seller: string | null;
  offer_created_at: Date | null;
};

export type OfferPrice = {
  raw: string;
  parsed: number;
  currency?: number;
};

export type OffersItemType = {
  collectionId: number;
  tokenId: number;
  price: OfferPrice;
  seller: string;
  creationDate: Date | null;
  [key: string]: any;
};
