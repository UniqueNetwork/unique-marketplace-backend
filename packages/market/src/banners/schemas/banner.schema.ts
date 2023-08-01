import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ButtonDefaultColor, ButtonTitleMaxLen, DescriptionMaxLen, FileMaxSize, TitleMaxLen } from '../types';
import { BannerEntity } from '@app/common/modules/database';

type BannerKeys = Exclude<keyof BannerEntity, 'id' | 'minioFile' | 'createdAt'>;

const properties: Record<BannerKeys | 'file', SchemaObject> = {
  file: {
    type: 'string',
    format: 'binary',
    description: `The banner picture; required; max size ${FileMaxSize} MB; supported formats: png, jpg, gif, svg, .mp4, webm, ogv, HTML; aspect ratio: 3*4`,
  },
  title: {
    description: `Title for the banner; required; max ${TitleMaxLen} symbols`,
    type: 'string',
  },
  description: {
    description: `Text for the banner; required; max ${DescriptionMaxLen} symbols; you can use html tags`,
    type: 'string',
  },
  backgroundColor: {
    description: 'The color of the banner background; HEX; optional; remember: the text is always black, use light colors',
    type: 'string',
  },
  buttonTitle: {
    description: `Text on the button; required; recommended: 'Explore the collection'; Max ${ButtonTitleMaxLen} symbols`,
    type: 'string',
  },
  buttonUrl: {
    description: 'Link for the button; required; recommended: the marketplace collection page link',
    type: 'string',
  },
  buttonColor: {
    description: `Color for the button; optional; default ${ButtonDefaultColor}; HEX; remember: the text is always white`,
    type: 'string',
  },
  secondaryButtonTitle: {
    description: `Text on the button, optional; max ${ButtonTitleMaxLen} symbols`,
    type: 'string',
  },
  secondaryButtonUrl: {
    description: 'Link for the button; optional',
    type: 'string',
  },
  sortIndex: {
    description:
      'Index for sorting; optional:;default 0; Recommended: 100 (for the first new banner #1 in the carousel) 200 (for the first new banner #2 in the carousel), 150 (to put new banner between them), 50 (to put new banner first) etc.',
    type: 'number',
  },
  off: {
    description:
      'Temporarily turn off this banner; optional, default false. Attention! When set to "true", the sortIndex will be cleared, when re-enabled, be sure to set new sortIndex',
    type: 'boolean',
  },
  collectionId: {
    description:
      'Collection ID, optional. If set, the collection will appear in the "Curated collections" filter on the main page',
    type: 'number',
  },
};

export const bannerSchema: SchemaObject = {
  type: 'object',
  properties,
};
