import { Injectable } from '@nestjs/common';

import {
  CollectionInfoWithSchemaResponse,
  Sdk,
  TokenByIdResponse,
} from '@unique-nft/sdk';
import { Address } from '@unique-nft/utils';

export type ResponseTokenSchema = {
  rawType: string;
  isEmpty: boolean;
  hash: string;
  human: string[];
  json: number[];
  hex: string;
};

export type TokenBalance = {
  address: string;
  collectionId: number;
  tokenId: number;
};

@Injectable()
export class SdkService {
  constructor(private readonly sdk: Sdk) {}

  /**
   * Get a list of token numbers
   * @param collectionId
   */
  async getTokensCollection(collectionId: string): Promise<any> {
    const token: ResponseTokenSchema = await this.sdk.stateQuery.execute(
      { endpoint: 'rpc', module: 'unique', method: 'collectionTokens' },
      { args: [collectionId] }
    );
    const list = token.json.sort((a, b) => a - b);

    return {
      ...token,
      list,
    };
  }
  async getTokenOwners(collectionId: number, tokenId: number): Promise<any> {
    const token: ResponseTokenSchema = await this.sdk.stateQuery.execute(
      { endpoint: 'rpc', module: 'unique', method: 'tokenOwners' },
      { args: [collectionId.toString(), tokenId.toString()] }
    );
    return token;
  }

  async getTokenBalances(
    tokenBalance: TokenBalance,
    at?: string
  ): Promise<any> {
    const { collectionId } = tokenBalance;
    const collection = await this.getSchemaCollection(collectionId);
    if (collection.mode === 'NFT') {
      return {
        amount: 1,
      };
    }
    if (collection.mode === 'ReFungible') {
      return {
        amount: (await this.sdk.refungible.getBalance(tokenBalance)).amount,
      };
    }
  }

  async getTotalPieces(
    tokenId: number,
    collectionId: number,
    at?: string
  ): Promise<any> {
    return await this.sdk.refungible.totalPieces({
      tokenId,
      collectionId,
    });
  }

  /**
   * Get collection Schemas from `SDK`
   * @description Return the structure of the collection, its schema and attributes,
   * all this data is written to data to display information about the collection.
   * @param {String} id - collection ID
   * @return ({Promise<CollectionInfoWithSchemaResponse>})
   */
  async getSchemaCollection(
    id: number
  ): Promise<CollectionInfoWithSchemaResponse> {
    return await this.sdk.collections.get({ collectionId: id });
  }

  /**
   * Get Scheme and Properties token
   * @param tokenId
   * @param collectionId
   * @param at
   */
  async getSchemaToken(
    tokenId: number,
    collectionId: number,
    at?: string
  ): Promise<TokenByIdResponse> {
    return await this.sdk.tokens.get({ collectionId, tokenId, at });
  }

  async getChainProperties(): Promise<any> {
    return this.sdk.common.chainProperties();
  }
}
