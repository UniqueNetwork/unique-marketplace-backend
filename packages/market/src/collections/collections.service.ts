import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CollectionDto,
  CreateCollectionDto,
} from './dto/create-collection.dto';
import {
  UpdateCollectionDto,
  UpdateCollectionStatusDto,
} from './dto/update-collection.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from '@app/common/modules/database';
import { BaseService } from '@app/common/src/lib/base.service';
import { CollectionStatus } from '@app/common/modules/types';

@Injectable()
export class CollectionsService extends BaseService<
  CollectionEntity,
  CollectionDto
> {
  private logger: Logger = new Logger(CollectionsService.name);

  constructor(
    @InjectRepository(CollectionEntity)
    private collectionRepository: Repository<CollectionEntity>
  ) {
    super({});
  }

  async testCreate(collectionId: number, allowedTokens: string) {
    const collectioExist = await this.collectionRepository.findOne({
      where: { collectionId: collectionId },
    });
    if (collectioExist) {
      throw new BadRequestException('Collection is already');
    }
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

  async findAll(): Promise<any> {
    const qb = await this.collectionRepository.createQueryBuilder();
    return await this.getDataAndCountMany(qb);
  }

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
}
