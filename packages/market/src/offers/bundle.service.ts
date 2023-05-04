import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PropertiesEntity } from '@app/common/modules/database/entities/properties.entity';
import { ViewOffers } from '@app/common/modules/database';

type Pair = {
  collectionId: number;
  tokenId: number;
};

type PairOffer = {
  offer_id: string;
  collection_id: number;
  token_id: number;
};

@Injectable()
export class BundleService {
  private logger: Logger;
  private searchIndex: Repository<PropertiesEntity>;

  constructor(private connection: DataSource) {
    this.searchIndex = this.connection.getRepository(PropertiesEntity);
    this.logger = new Logger(BundleService.name, { timestamp: true });
  }

  public async bundle(
    collectionId: number,
    tokenId: number,
  ): Promise<{
    collectionId: number;
    tokenId: number;
  }> {
    const offers = await this.checkOffers([{ collectionId, tokenId }]);
    if (offers.length === 0) {
      const ids = await this.ids(collectionId, tokenId);
      if (ids.length === 0) {
        return { collectionId, tokenId };
      }
      const offersWithBunlde = await this.checkOffers(ids);
      const item = offersWithBunlde.pop();
      return {
        collectionId: +item.collection_id,
        tokenId: +item.token_id,
      };
    }
    return {
      collectionId,
      tokenId,
    };
  }

  private async ids(collectionId: number, tokenId: number): Promise<Array<Pair>> {
    const ids = await this.connection.manager
      .createQueryBuilder()
      .select(['collection_id', 'token_id'])
      .distinct()
      .from(PropertiesEntity, 'properties')
      .where('properties.nested @? :nested', {
        nested: `$[*] ? (@.collectionId == ${+collectionId} && @.tokenId == ${+tokenId})`,
      })
      .getRawMany();
    return ids.map((item) => {
      return {
        collectionId: +item.collection_id,
        tokenId: +item.token_id,
      };
    });
  }

  private async checkOffers(items: Array<Pair>): Promise<Array<PairOffer>> {
    if (items.length === 0) {
      return [];
    }

    const collections = items.map((item) => item.collectionId);
    const tokens = items.map((item) => item.tokenId);
    return this.connection.manager
      .createQueryBuilder(ViewOffers, 'view_offers')
      .select(['offer_id', 'collection_id', 'token_id'])
      .distinct()
      .where('view_offers.collection_id in (:...collectionId)', { collectionId: collections })
      .andWhere('view_offers.token_id in (:...tokenId)', { tokenId: tokens })
      .andWhere('view_offers.offer_status in (:...status)', { status: ['Opened'] })
      .getRawMany();
  }
}
