import { BannerEntity } from '@app/common/modules/database';

export type BannerCreateData = Omit<BannerEntity, 'id' | 'createdAt'>;

export type BannerEditData = Partial<BannerCreateData>;

export type BannerClient = BannerEntity & {
  mediaUrl: string;
};
