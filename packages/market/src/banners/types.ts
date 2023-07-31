import { BannerEntity } from '@app/common/modules/database';

export type BannerCreateData = Omit<BannerEntity, 'id' | 'createdAt'>;

export type BannerEditData = Partial<BannerCreateData>;

export type BannerClient = BannerEntity & {
  mediaUrl: string;
};

export enum OffFilter {
  All = 'All',
  Off = 'Off',
  On = 'On',
}

export const TitleMinLen = 3;
export const TitleMaxLen = 100;

export const DescriptionMinLen = 3;
export const DescriptionMaxLen = 2000;

export const ButtonTitleMinLen = 3;
export const ButtonTitleMaxLen = 100;
export const ButtonUrlMinLen = 3;
export const ButtonUrlMaxLen = 100;
