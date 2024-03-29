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

export type BannerKeys = Exclude<keyof BannerEntity, 'id' | 'minioFile' | 'createdAt'>;

export type BannerOptional = {
  [Property in BannerKeys]: string | undefined;
};

export const FileMaxSize = 100;
export const TitleMaxLen = 50;
export const DescriptionMaxLen = 300;
export const ButtonTitleMaxLen = 20;
export const ButtonUrlMaxLen = 1000;
export const ButtonDefaultColor = '#009CF0';
