export interface PaginationResult<T> {
  items: T[];
  itemsCount: number;
  page: number;
  pageSize: number;
  attributes?: Array<any>;
  attributesCount?: Array<any>;
}

export enum SortingOrder {
  Asc = 0,
  Desc = 1,
}

export interface SortingParameter {
  column: string;

  order: SortingOrder;
}

export type CollectionToken = {
  collectionId: number;
  tokenId: number;
  network?: string;
};

export type TokenInfo = {
  locale: string;
  is_trait?: boolean;
  text?: string;
  type: TypeAttributToken;
  key: string;
  items: Array<string>;
};

export enum TypeAttributToken {
  ImageURL = 'ImageURL',
  Enum = 'Enum',
  String = 'String',
  Prefix = 'Prefix',
  Number = 'Number',
  VideoURL = 'VideoURL',
}

export type TypeConstSchema = {
  tokenPrefix: string;
  constOnChainSchema: {
    [propName: string]: any;
  };
  name: string;
  offchainSchema: string;
  description: string;
  collectionCover: string;
};

export interface TokenDescription {
  key?: string;
  value: string;
  type?: TypeAttributToken;
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
  currency: number;
};

export type OffersItemType = {
  collectionId: number;
  tokenId: number;
  price: OfferPrice;
  seller: string;
  creationDate: Date | null;
  [key: string]: any;
};

export interface GetOneFilter {
  offerId?: string;
  collectionId?: number;
  tokenId?: number;
}
