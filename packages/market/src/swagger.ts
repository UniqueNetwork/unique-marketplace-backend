import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as utils from './utils/utils';
import { version } from '../../../package.json';

export default async function swaggerInit(
  app: INestApplication,
  config: ConfigService
) {
  const fileDocumentSecondary = utils.readApiDocs('description.md');
  const description = [fileDocumentSecondary].filter((el) => el).join('\n\n');
  const documentBuild = new DocumentBuilder()
    .setTitle(config.get('market.name'))
    .setDescription(description)
    .setVersion(`v${version}`)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'accessToken'
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'refreshToken'
    )
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'apiKey')
    .build();

  const document = SwaggerModule.createDocument(app, documentBuild, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup('api/swagger', app, document, {
    explorer: true,
    customSiteTitle: config.get('market.title'),
  });
}
