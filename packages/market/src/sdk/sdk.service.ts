import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk/full';
import { ResponseTokenSchema } from '../../../escrow/src/app/sdk.service';

@Injectable()
export class SdkMarketService {
  constructor(private readonly sdk: Sdk) {}

  async checkCollectionOwner(owner: string, collectionId: number): Promise<boolean> {
    let collection;

    try {
      collection = await this.sdk.collections.get({ collectionId });
    } catch (err) {
      throw new NotFoundException(`You are trying to add a collection ${collection} which does not exist!`);
    }
    if (collection.owner === owner) {
      return true;
    }
    throw new BadRequestException('The collection does not belong to you and you cannot put it up for sale!');
  }
  async getListTokensCollection(collectionId: string): Promise<any> {
    const token: ResponseTokenSchema = await this.sdk.stateQuery.execute(
      { endpoint: 'rpc', module: 'unique', method: 'collectionTokens' },
      { args: [collectionId] },
    );
    const list = token.json.sort((a, b) => a - b);

    return {
      list,
    };
  }
}
