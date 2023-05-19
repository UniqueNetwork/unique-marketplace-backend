import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { WorkerService } from 'nestjs-graphile-worker';
import { CollectionData, Sdk } from '@unique-nft/sdk/full';
import { CollectionEntity } from '@app/common/modules/database';
import { SdkService } from '../app/sdk.service';

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
  ) {}

  async observer(collectionId: number, tokenId: number) {
    const collection = await this.collectionRepository.findOne({ where: { collectionId: collectionId } });
    if (collection) {
      const chain = await this.sdk.getChainProperties();
      await this.addUpdateTokenAndProperties(tokenId, collectionId, chain.token);
    }
  }

  private async addUpdateTokenAndProperties(tokenId: number, collectionId: number, network: string) {
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
