import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { WorkerService } from 'nestjs-graphile-worker';
import { CollectionEntity } from '@app/common/modules/database';
import { SdkService } from '../app/sdk.service';
import { CollectionData } from '@unique-nft/sdk/full';
import { Address } from '@unique-nft/utils';
import { AddressService } from '@app/common/src/lib/address.service';

@Injectable()
export class TokensService {
  private logger: Logger = new Logger(TokensService.name);

  constructor(
    private sdk: SdkService,
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>,
    /** Graphile Worker */
    private readonly graphileWorker: WorkerService,
    private readonly addressService: AddressService,
  ) {}

  async observer(collectionId: number, tokenId: number, data?: CollectionData) {
    const collection = await this.collectionRepository.findOne({ where: { collectionId: collectionId } });
    if (collection) {
      const listTokenUpdate = [];
      const chain = await this.sdk.getChainProperties();

      // Add the tokenId, collectionId, network chain to the list for update
      listTokenUpdate.push({ collectionId, tokenId, network: chain.token });

      if (data && data.parsed) {
        const { parsed } = data;
        const addressNestedTo = await this.addressService.getParentCollectionAndToken(parsed.addressTo);
        if (addressNestedTo) {
          listTokenUpdate.push({ ...addressNestedTo, network: chain.token });
        }
        const addressNested = await this.addressService.getParentCollectionAndToken(parsed.address);
        if (addressNested) {
          listTokenUpdate.push({ ...addressNested, network: chain.token });
        }
        console.dir({ nested: true, listTokenUpdate }, { depth: 10 });
      }

      listTokenUpdate.map(async (item) => await this.addUpdateTokenAndProperties(item));
    }
  }

  private async addUpdateTokenAndProperties(item: { collectionId: number; tokenId: number; network: string }) {
    const { collectionId, tokenId, network } = item;
    await this.graphileWorker.addJob('collectTokens', {
      tokenId,
      collectionId,
      network,
    });

    await this.graphileWorker.addJob('collectProperties', {
      tokenId,
      collectionId,
      network,
    });
  }
}
