export declare namespace Market {
  export interface Payload {
    collectionId: number;
    tokenId: number;
    network?: string;
  }
}

export type CollectionToken = {
  collectionId: number;
  tokenId: number;
  network?: string;
};

export interface TokenPayload {
  tokenId: number;
  collectionId: number;
  network: string;
}

export type UnknownObject = {
  [key: string]: any | Object | string | number;
};

export interface TokenDataForUpdate {
  tokenId: number;
  collectionId: number;
  network: string;
  otherOwners: UnknownObject;
  owner_token: string;
  nested: UnknownObject;
  data: UnknownObject;
}

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

export type BundleType = {
  collectionId: number;
  tokenId: number;
};
export interface TokenDescription {
  key?: string;
  value: string;
  type?: TypeAttributToken;
}

export type SerializeTokenType = {
  items: TokenInfo[];
  token: any;
  collection: any;
  serializeBundle: Array<BundleType>;
};
