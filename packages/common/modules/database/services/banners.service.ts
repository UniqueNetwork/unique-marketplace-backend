import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { BannerEntity } from '../entities';
import { Repository } from 'typeorm';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(BannerEntity)
    private bannerEntityRepository: Repository<BannerEntity>,
  ) {}

  public getAll(): Promise<BannerEntity[]> {
    return this.bannerEntityRepository.find();
  }

  public getById(id: string): Promise<BannerEntity | null> {
    return this.bannerEntityRepository.findOne({ where: { id } });
  }

  public async create(data: Omit<BannerEntity, 'id' | 'createdAt'>): Promise<BannerEntity> {
    const banner = this.bannerEntityRepository.create();

    banner.id = uuid();
    banner.title = data.title;
    banner.description = data.description;
    banner.minioFile = data.minioFile;
    banner.buttonUrl = data.buttonUrl;
    banner.buttonTitle = data.buttonTitle;
    banner.sortIndex = data.sortIndex;
    banner.collectionId = data.collectionId;
    banner.createdAt = new Date();
    banner.off = false;

    await this.bannerEntityRepository.save(banner);

    return banner;
  }

  public async edit(id: string, data: Partial<Omit<BannerEntity, 'id' | 'createdAt'>>): Promise<BannerEntity | null> {
    await this.bannerEntityRepository.update(
      {
        id,
      },
      data,
    );
    return this.getById(id);
  }

  public async delete(id: string): Promise<boolean> {
    await this.bannerEntityRepository.delete({
      id,
    });

    return true;
  }
}
