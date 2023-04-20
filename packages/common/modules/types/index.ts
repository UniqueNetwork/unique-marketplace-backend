import { CollectionInfoWithSchemaResponse } from '@unique-nft/sdk';
import { string } from 'hardhat/internal/core/params/argumentTypes';

export type CustomObject = {
  [key: string]: any | Object | Array<string> | boolean | number | string | undefined;
};

export enum OfferStatus {
  Opened = 'Opened',
  Canceled = 'Canceled',
  Completed = 'Completed',
}

export enum OfferEventType {
  Open = 'Open',
  Revoke = 'Revoke',
  Cancel = 'Cancel',
  Buy = 'Buy',
}

export enum CollectionStatus {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

export enum CollectionActive {
  true = 'true',
  false = 'false',
}

export enum CollectionMode {
  Nft = 'Nft',
  Fungible = 'Fungible',
  ReFungible = 'ReFungible',
}

export type DecodedCollection = {
  collectionId: number;
  owner: string;
  mode: CollectionMode;
  tokenPrefix: string;
  name: string;
  description: string;
  data: any;
  active?: CollectionActive;
  decimalPoints?: number;
  network: string;
};

export enum TypeAttributToken {
  ImageURL = 'ImageURL',
  Enum = 'Enum',
  String = 'String',
  Prefix = 'Prefix',
  Number = 'Number',
  VideoURL = 'VideoURL',
}

export type PayLoadCollection = {
  collectionId: number;
};

export type ChainDataResponse = {
  SS58Prefix: number;
  token: string;
  decimals: number;
  wsUrl: string;
  genesisHash: string;
};

export type CollectionSchemaAndChain = {
  collection: CollectionInfoWithSchemaResponse;
  chain: ChainDataResponse;
};
