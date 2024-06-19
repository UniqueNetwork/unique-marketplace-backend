import { Injectable, Logger } from '@nestjs/common';

import { ChainPropertiesResponse, CollectionWithInfoV2Dto, NestedToken, Sdk, TokenWithInfoV2Dto } from '@unique-nft/sdk/full';
import { BundleType } from '../tasks/task.types';
import { TokenV2WithCollectionV2 } from '@app/common/src';

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
  private logger = new Logger('SDK');
  constructor(private readonly sdk: Sdk) {}

  async isBundle(token: number, collection: number): Promise<any> {
    try {
      return await this.sdk.token.isBundle({ collectionId: collection, tokenId: token });
    } catch (error) {
      throw new Error(error);
    }
  }

  async getBundle(token: number, collection: number): Promise<NestedToken> {
    try {
      return await this.sdk.token.getBundle({ collectionId: collection, tokenId: token });
    } catch (error) {
      throw new Error(error);
    }
  }

  public serializeBunlde(bundle: NestedToken): Array<BundleType> {
    function recurseBundle(bundle: NestedToken): Array<BundleType> {
      if (bundle?.nestingChildTokens) {
        if (Array.isArray(bundle.nestingChildTokens)) {
          const items = [
            {
              collectionId: +bundle.collectionId,
              tokenId: +bundle.tokenId,
            },
          ];
          bundle.nestingChildTokens.forEach((child) => {
            items.push(...recurseBundle(child));
          });
          return items;
        } else {
          return [
            {
              collectionId: +bundle.collectionId,
              tokenId: +bundle.tokenId,
            },
            ...recurseBundle(bundle.nestingChildTokens),
          ];
        }
      } else {
        return [
          {
            collectionId: +bundle.collectionId,
            tokenId: +bundle.tokenId,
          },
        ];
      }
    }

    return [...new Set(recurseBundle(bundle))];
  }

  async getTokenSchema(collectionId: number, tokenId: number): Promise<TokenWithInfoV2Dto | null> {
    let token: TokenWithInfoV2Dto;
    try {
      token = await this.sdk.token.getV2({ collectionId: collectionId, tokenId: tokenId });
    } catch (error) {
      if (error.message === 'Token not found') {
        return null;
      }

      throw error;
    }

    return token;
  }

  /**
   * Get a list of token numbers
   * @param collectionId
   */
  async getTokensCollection(collectionId: number): Promise<any> {
    const token: ResponseTokenSchema = await this.sdk.stateQuery.execute(
      { endpoint: 'rpc', module: 'unique', method: 'collectionTokens' },
      { args: [String(collectionId)] },
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
      { args: [collectionId.toString(), tokenId.toString()] },
    );
    return token;
  }

  async getTokenBalances(tokenBalance: TokenBalance, at?: string): Promise<any> {
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

  async getTotalPieces(tokenId: number, collectionId: number, at?: string): Promise<any> {
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
  async getSchemaCollection(id: number): Promise<CollectionWithInfoV2Dto> {
    return await this.sdk.collection.getV2({ collectionId: id });
  }

  /**
   * Get Scheme and Properties token
   * @param tokenId
   * @param collectionId
   * @param at
   */
  async getSchemaToken(tokenId: number, collectionId: number): Promise<TokenV2WithCollectionV2 | null> {
    let token: TokenWithInfoV2Dto;
    try {
      token = await this.sdk.token.getV2({ collectionId, tokenId });
    } catch (error) {
      if (error.message === 'Token not found') {
        return null;
      }

      throw error;
    }

    if (!token) {
      return null;
    }
    const collection = await this.getSchemaCollection(collectionId);

    return {
      ...token,
      collection,
    };
  }

  async getChainProperties(): Promise<ChainPropertiesResponse> {
    return this.sdk.common.chainProperties();
  }
}
