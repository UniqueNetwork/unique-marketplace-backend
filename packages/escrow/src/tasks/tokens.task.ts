import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { Helpers } from 'graphile-worker';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { SdkService } from '../app/sdk.service';
import { Address } from '@unique-nft/utils';
import { TokenDataForUpdate, TokenPayload } from './task.types';
import { CollectionEntity } from '@app/common/modules/database';

@Injectable()
@Task('collectTokens')
export class TokensTask {
  private logger = new Logger(TokensTask.name);

  constructor(
    private sdkService: SdkService,
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>,

    @InjectRepository(CollectionEntity)
    private collectionsRepository: Repository<CollectionEntity>,
  ) {}

  /**
   * Token Task Handler
   * @description Incoming data handler. Processes data on the `collectTokens` event
   * @param {TokenPayload} payload - input data
   * @param {Helpers} helpers
   */
  @TaskHandler()
  async handler(payload: TokenPayload, helpers: Helpers): Promise<void> {
    const { tokenId, collectionId, network } = payload;
    const upsertDataToken: TokenDataForUpdate = await this.prepareTokenData(collectionId, tokenId, network);
    if (upsertDataToken) {
      await this.upsertTokens(upsertDataToken);
    }
  }

  /**
   * Preparing data for token entry
   *
   * @param {Number} collectionId - collection ID
   * @param {Number} tokenId - token ID
   * @param {String} network - network chain
   */
  async prepareTokenData(collectionId: number, tokenId: number, network: string): Promise<TokenDataForUpdate> {
    if (tokenId === 0) {
      return;
    }
    const token = await this.sdkService
      .getSchemaToken(tokenId, collectionId)
      .then(async (token) => {
        if (token === null) {
          await this.deleteToken(tokenId, collectionId);
          return;
        }
        let owners = [];
        if (token?.owner !== null) {
          owners = (await this.sdkService.getTokenOwners(collectionId, tokenId)).human;
        } else {
          owners.push(`{ Substrate: ${token.owner} }`);
        }
        return {
          owners,
          ...token,
        };
      })
      .then(async (token) => {
        if (token === undefined) {
          return;
        }
        const tokenOwners = [];
        for (const ownerData of token.owners) {
          const address = ownerData['Substrate'] || ownerData['Ethereum'];
          const nestedToken = this.nestedCollectionAndToken(address) || {};
          const amount = await this.sdkService.getTokenBalances({
            address,
            collectionId,
            tokenId,
          });
          tokenOwners.push({ ...ownerData, ...amount, nested: nestedToken });
        }

        return {
          tokenOwners,
          ...token,
        };
      });

    if (!token) {
      return;
    }
    const otherOwners = JSON.parse(JSON.stringify(token?.tokenOwners));
    const owner_token = Address.extract.addressNormalized(token.owner);

    const nested = JSON.parse(JSON.stringify(this.nestedCollectionAndToken(token.owner))) || {};

    const data = JSON.parse(JSON.stringify(token).replace(/\\u0000/g, ''));

    return {
      tokenId,
      collectionId,
      network,
      otherOwners,
      owner_token,
      nested,
      data,
    };
  }

  /**
   * Upsert a token repository
   * @param updateTokenData
   */
  async upsertTokens(updateTokenData) {
    const { collectionId, tokenId, network } = updateTokenData;
    const already = await this.tokensRepository.findOne({ where: { collectionId, tokenId, network } });
    if (!already) {
      await this.collectionsRepository.increment({ collectionId }, 'tokensOnMarket', 1);
    }
    await this.tokensRepository.upsert(updateTokenData, ['collectionId', 'tokenId', 'network']);
  }

  async deleteToken(tokenId: number, collectionId: number): Promise<void> {
    const already = await this.tokensRepository.findOne({ where: { collectionId, tokenId } });
    if (already) {
      await this.tokensRepository.delete({ tokenId, collectionId });
      await this.collectionsRepository.decrement({ collectionId }, 'tokensOnMarket', 1);
    }
  }

  nestedCollectionAndToken(address) {
    if (Address.is.ethereumAddress(address)) {
      return Address.is.nestingAddress(address) ? Address.nesting.addressToIds(address) : null;
    } else {
      return null;
    }
  }
}
