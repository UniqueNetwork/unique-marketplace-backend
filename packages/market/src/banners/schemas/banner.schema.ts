import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ButtonTitleMaxLen, DescriptionMaxLen, TitleMaxLen } from '../types';
import { BannerEntity } from '@app/common/modules/database';

type BannerKeys = Exclude<keyof BannerEntity, 'id' | 'minioFile' | 'createdAt'>;

const properties: Record<BannerKeys | 'file', SchemaObject> = {
  file: {
    type: 'string',
    format: 'binary',
    description: `Image, GIF or video for the banner; requiredMax size 100 MB; supported formats: ___Recommended: 800:600 pixels`,
  },
  title: {
    description: `Title for the banner; requiredMax ${TitleMaxLen} symbols`,
    type: 'string',
    maximum: 3,
  },
  description: {
    description: `Text for the banner; requiredMax ${DescriptionMaxLen} symbols`,
    type: 'string',
  },
  buttonTitle: {
    description: `Text on the button; required.Recommended: 'Explore the collection'; Max ${ButtonTitleMaxLen} symbols`,
    type: 'string',
  },
  buttonUrl: {
    description: 'Link for the button; required;  Recommended: the marketplace collection page link',
    type: 'string',
  },
  buttonColor: {
    description: 'Color for the button; optional',
    type: 'string',
  },
  sortIndex: {
    description: 'Index for sorting; optional, default 0. Recommended: 100; 150: 200; 150.',
    type: 'number',
  },
  off: {
    description:
      'Temporarily turn off this banner; optional, default false. Attention! When set to "true", the sortIndex will be cleared, when re-enabled, be sure to set sortIndex again',
    type: 'boolean',
  },
  collectionId: {
    description:
      'Collection ID, optional. If set, the collection will appear in the "Curated collections" filter on the main page',
    type: 'number',
  },
  secondaryButtonTitle: {
    description: `Text on the secondary button; optional.Recommended: 'Explore the collection'; Max ${ButtonTitleMaxLen} symbols`,
    type: 'string',
  },
  secondaryButtonUrl: {
    description: 'Link for the secondary button; optional;  Recommended: the marketplace collection page link',
    type: 'string',
  },
  secondaryButtonColor: {
    description: 'Color for the secondary button; optional',
    type: 'string',
  },
  backgroundColor: {
    description: 'Background color; optional',
    type: 'string',
  },
};

export const bannerSchema: SchemaObject = {
  type: 'object',
  properties,
};
