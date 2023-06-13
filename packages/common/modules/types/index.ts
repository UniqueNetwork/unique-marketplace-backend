import { CollectionInfoWithSchemaResponse } from '@unique-nft/sdk';
import { string } from 'hardhat/internal/core/params/argumentTypes';

export type CustomObject = {
  [key: string]: any | Object | Array<string> | boolean | number | string | undefined;
};

export type UntypedRequest<T> = {
  [key in keyof T]: T[key] extends Array<infer V>
    ? string[]
    : T[key] extends Array<infer V> | undefined
    ? string[]
    : T[key] extends Array<infer V> | null
    ? string[]
    : string;
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
  tokensCount: number;
  tokensOnMarket: number;
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
  forceUpdate: boolean;
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
  tokensCount: number;
};

export enum EventMethod {
  // Unique
  ALLOW_LIST_ADDRESS_ADDDED = 'AllowListAddressAdded',
  ALLOW_LIST_ADDRESS_REMOVED = 'AllowListAddressRemoved',
  COLLECTION_ADMIN_ADDED = 'CollectionAdminAdded',
  COLLECTION_ADMIN_REMOVED = 'CollectionAdminRemoved',
  COLLECTION_SPONSOR_SET = 'CollectionSponsorSet',
  COLLECTION_SPONSOR_REMOVED = 'CollectionSponsorRemoved',
  SPONSORSHIP_CONFIRMED = 'SponsorshipConfirmed',
  OLD_COLLECTION_OWNER_CHANGED = 'CollectionOwnedChanged',
  COLLECTION_OWNER_CHANGED = 'CollectionOwnerChanged',
  COLLECTION_PERMISSION_SET = 'CollectionPermissionSet',

  // Common
  APPROVED = 'Approved',
  COLLECTION_CREATED = 'CollectionCreated',
  COLLECTION_DESTROYED = 'CollectionDestroyed',
  COLLECTION_PROPERTY_DELETED = 'CollectionPropertyDeleted',
  COLLECTION_PROPERTY_SET = 'CollectionPropertySet',
  ITEM_CREATED = 'ItemCreated',
  ITEM_DESTROYED = 'ItemDestroyed',
  PROPERTY_PERMISSION_SET = 'PropertyPermissionSet',
  TOKEN_PROPERTY_DELETED = 'TokenPropertyDeleted',
  TOKEN_PROPERTY_SET = 'TokenPropertySet',
  // and Transfer

  NEW_ACCOUNT = 'NewAccount',
  EXTRINSIC_SUCCESS = 'ExtrinsicSuccess',
  EXTRINSIC_FAILED = 'ExtrinsicFailed',
  COLLECTION_LIMIT_SET = 'CollectionLimitSet',

  // Balances
  BALANCE_SET = 'BalanceSet',
  DEPOSIT = 'Deposit',
  DUST_LOST = 'DustLost',
  ENDOWED = 'Endowed',
  RESERVED = 'Reserved',
  RESERVED_REPATRIATED = 'ReserveRepatriated',
  SLASHED = 'Slashed',
  TRANSFER = 'Transfer',
  UNRESERVED = 'Unreserved',
  WITHDRAW = 'Withdraw',

  EXECUTED = 'Executed',
  VALIDATION_FUNCTION_APPLIED = 'ValidationFunctionApplied',
}
