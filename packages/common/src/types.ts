import { CollectionWithInfoV2Dto, TokenWithInfoV2Dto } from '@unique-nft/sdk/full';

export type QueryParamArray = string | string[] | undefined;

export type TokenV2WithCollectionV2 = TokenWithInfoV2Dto & {
  collection: CollectionWithInfoV2Dto;
};
