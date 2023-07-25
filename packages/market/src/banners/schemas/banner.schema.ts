import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const bannerSchema: SchemaObject = {
  type: 'object',
  properties: {
    file: {
      type: 'string',
      format: 'binary',
      description: 'File for banner; required',
    },
    title: {
      description: 'Title for the banner; required',
      type: 'string',
    },
    description: {
      description: 'Link for the banner; required',
      type: 'string',
    },
    buttonTitle: {
      description: 'Text for the button; required',
      type: 'string',
    },
    buttonUrl: {
      description: 'Link for the button; required',
      type: 'string',
    },
    sortIndex: {
      description: 'Index for sorting; optional, default 0',
      type: 'number',
    },
    off: {
      description: 'Turn off this banner; optional, default false',
      type: 'boolean',
    },
    collectionId: {
      description: 'Collection ID',
      type: 'number',
    },
  },
};
