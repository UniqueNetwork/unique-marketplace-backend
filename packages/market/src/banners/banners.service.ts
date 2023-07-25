import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { BannersService as BannersServiceDb } from '@app/common/modules/database/services';
import { EditBannerDto, CreateBannerDto } from './dto';
import { BannerEntity } from '@app/common/modules/database';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { FileStorageConfig } from '@app/common/modules/config/types';
import { BannerEditData } from './types';

@Injectable()
export class BannersService {
  private readonly fileStorageConfig: FileStorageConfig;
  private readonly adminSecretKey: string;
  private readonly minioClient: Minio.Client;

  constructor(config: ConfigService, private readonly bannerDbService: BannersServiceDb) {
    this.fileStorageConfig = config.get('fileStorage');
    this.adminSecretKey = config.get('adminSecretKey');

    const { endPoint, accessKey, secretKey } = this.fileStorageConfig;
    this.minioClient = new Minio.Client({
      endPoint,
      accessKey,
      secretKey,
    });
  }

  private checkSecret(secret: string) {
    if (secret !== this.adminSecretKey) {
      throw new UnauthorizedException('Invalid secret key');
    }
  }

  private async uploadFile(id: string, file) {
    const exec = file.originalname ? /(?<ext>\.\w+)$/.exec(file.originalname) : null;
    const ext = exec ? exec.groups.ext : '';
    const filename = `${id}-${Date.now()}${ext}`;
    const result = await this.minioClient.putObject(this.fileStorageConfig.bucketName, filename, file.buffer);

    if (!result || !result.etag) {
      throw new InternalServerErrorException('Invalid upload file');
    }

    await this.bannerDbService.edit(id, {
      minioFile: filename,
    });
  }

  public async getAll() {
    const banners = await this.bannerDbService.getAll();
    return {
      banners,
    };
  }

  public async getOne(id: string) {
    const banner = await this.bannerDbService.getById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return {
      banner,
    };
  }

  public async create(secretKey: string, dto: CreateBannerDto, file) {
    this.checkSecret(secretKey);

    if (!file) {
      throw new BadRequestException('Invalid file for create banner');
    }

    const data: Omit<BannerEntity, 'id' | 'createdAt'> = {
      title: dto.title,
      description: dto.description,
      minioFile: '',
      buttonTitle: dto.buttonTitle,
      buttonUrl: dto.buttonUrl,
      sortIndex: +dto.sortIndex || 0,
      off: dto.off === 'true',
      collectionId: +dto.collectionId || 0,
    };

    if (!data.title || !data.description || !data.buttonTitle || !data.buttonUrl) {
      throw new BadRequestException('Invalid parameters for create banner');
    }

    const banner = await this.bannerDbService.create(data);

    await this.uploadFile(banner.id, file);

    return {
      banner,
    };
  }

  public async edit(secretKey: string, id: string, dto: EditBannerDto, file) {
    this.checkSecret(secretKey);

    let banner = await this.bannerDbService.getById(id);
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    const data: BannerEditData = {};

    if (dto.title) data.title = dto.title;
    if (dto.description) data.description = dto.description;
    if (dto.buttonUrl) data.buttonUrl = dto.buttonUrl;
    if (dto.buttonTitle) data.buttonTitle = dto.buttonTitle;
    if (dto.off) data.off = dto.off === 'true';
    if (dto.sortIndex) data.sortIndex = +dto.sortIndex || 0;
    if (dto.collectionId) data.collectionId = +dto.collectionId || 0;

    await this.bannerDbService.edit(id, data);

    banner = await this.bannerDbService.getById(id);

    if (file) {
      if (banner.minioFile) {
        await this.minioClient.removeObject(this.fileStorageConfig.bucketName, banner.minioFile);
      }

      await this.uploadFile(banner.id, file);
    }

    return {
      banner,
    };
  }

  public async deleteOne(secretKey: string, id: string) {
    this.checkSecret(secretKey);

    const banner = await this.bannerDbService.getById(id);
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    await this.minioClient.removeObject(this.fileStorageConfig.bucketName, banner.minioFile);

    await this.bannerDbService.delete(id);

    return {
      ok: true,
    };
  }
}
