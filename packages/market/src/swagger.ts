import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as utils from './utils/utils';
import { version } from '../../../package.json';

export default async function swaggerInit(app: INestApplication, config: ConfigService) {
  const fileDocumentSecondary = utils.readApiDocs('description.md');
  const description = [fileDocumentSecondary].filter((el) => el).join('\n\n');
  const documentBuild = new DocumentBuilder()
    .setTitle(config.get('market.name'))
    .setDescription(description)
    .setVersion(`v${version}`)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentBuild, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup('swagger', app, document, {
    explorer: true,
    customSiteTitle: config.get('market.title'),
  });
}
