import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CollectionDto } from './dto/create-collection.dto';
import {
  UpdateCollectionDto,
  UpdateCollectionStatusDto,
} from './dto/update-collection.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from '@app/common/modules/database';
import { BaseService } from '@app/common/src/lib/base.service';
import { pgNotifyClient } from '@app/common/pg-transport/pg-notify-client.symbol';
import { ClientProxy } from '@nestjs/microservices';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { CollectionStatus } from '@app/common/modules/types';

@Injectable()
export class CollectionsService extends BaseService<
  CollectionEntity,
  CollectionDto
> {
  private logger: Logger = new Logger(CollectionsService.name);

  constructor(
    @Inject(pgNotifyClient) private client: ClientProxy,
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>
  ) {
    super({});
  }

  async addCollection(collectionId: number): Promise<any> {
    await this.hasCollection(collectionId);
    const collection = await this.collectionRepository.create({
      collectionId,
      data: JSON.parse('{}'),
    });
    this.client.emit('new-collection-added', { collectionId });
    return await this.collectionRepository.insert(collection);
  }

  async testClientMessage(): Promise<any> {
    this.client.emit('new-collection-added', { collectionId: 12 });
  }

  async testCreate(collectionId: number, allowedTokens: string) {
    await this.hasCollection(collectionId);

    const collection = await this.collectionRepository.create({
      decimalPoints: 0,
      description: null,
      mintMode: null,
      mode: null,
      name: null,
      network: null,
      owner: null,
      tokenPrefix: null,
      collectionId,
      allowedTokens,
      data: JSON.parse('{}'),
    });
    this.logger.log(`Added collection ${collection}`);
    return await this.collectionRepository.insert(collection);
  }

  async findAll(options: IPaginationOptions): Promise<any> {
    const qb = await this.collectionRepository.createQueryBuilder();
    return await paginate<CollectionEntity>(qb, options);
  }

  /**
   * Toggle status of collection: Enabled or Disabled
   * @param updateCollectionStatusDto
   */
  async toggleCollection(
    updateCollectionStatusDto: UpdateCollectionStatusDto
  ): Promise<CollectionEntity> {
    try {
      const changedStatus = await this.collectionRepository.update(
        {
          collectionId: updateCollectionStatusDto.collectionId,
        },
        { status: updateCollectionStatusDto.status }
      );
      if (changedStatus.affected === 0) {
        throw new Error(
          `Collection ${updateCollectionStatusDto.status} not found`
        );
      }
      return await this.collectionRepository.findOne({
        where: { collectionId: updateCollectionStatusDto.collectionId },
      });
    } catch (e) {
      throw new BadRequestException('Not found');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} collection`;
  }

  update(id: number, updateCollectionDto: UpdateCollectionDto) {
    return `This action updates a #${id} collection`;
  }

  async remove(id: number) {
    return await this.collectionRepository.delete({ collectionId: id });
  }

  /**
   * Проверяем есть ли такая коллекция в списке макрета, Включена ли коллекция!
   * @param collectionId
   * @private
   */
  private async hasCollection(collectionId: number) {
    const collectioExist = await this.collectionRepository.findOne({
      where: { collectionId: collectionId },
    });
    if (collectioExist) {
      throw new BadRequestException(
        `Сollection present already on the market. Status: ${collectioExist.status}`
      );
    }
  }
}
