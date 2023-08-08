import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { BannerEntity } from '../entities';
import { Not, Repository } from 'typeorm';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(BannerEntity)
    private bannerEntityRepository: Repository<BannerEntity>,
  ) {}

  public getAll(): Promise<BannerEntity[]> {
    return this.bannerEntityRepository.find({
      order: {
        sortIndex: 1,
        createdAt: 1,
      },
    });
  }

  public getAllOff(): Promise<BannerEntity[]> {
    return this.bannerEntityRepository.find({
      where: {
        off: true,
      },
      order: {
        sortIndex: 1,
        createdAt: 1,
      },
    });
  }

  public getAllOn(): Promise<BannerEntity[]> {
    return this.bannerEntityRepository.find({
      where: {
        off: false,
      },
      order: {
        sortIndex: 1,
        createdAt: 1,
      },
    });
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
    banner.buttonColor = data.buttonColor;
    banner.sortIndex = data.sortIndex;
    banner.collectionId = data.collectionId;
    banner.off = false;
    banner.backgroundColor = data.backgroundColor;
    banner.secondaryButtonUrl = data.secondaryButtonUrl;
    banner.secondaryButtonTitle = data.secondaryButtonTitle;
    banner.createdAt = new Date();

    await this.bannerEntityRepository.save(banner);

    return banner;
  }

  public async edit(id: string, data: Partial<Omit<BannerEntity, 'id' | 'createdAt'>>): Promise<BannerEntity | null> {
    if (data.off) {
      data.sortIndex = 0;
    }

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

  public async findCuratedCollections(): Promise<number[]> {
    const banners = await this.bannerEntityRepository.find({
      where: {
        collectionId: Not(0),
        off: false,
      },
    });

    return banners.map((b) => b.collectionId);
  }
}
