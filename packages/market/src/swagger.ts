import * as fs from 'fs';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

export default async function swaggerInit (app: INestApplication,config: ConfigService) {
  const fileDocumentSecondary = fs.readFileSync(join(process.cwd(), 'docs', 'description.md')).toString();
  const description = [fileDocumentSecondary].filter((el) => el).join('\n\n');
  const documentBuild = new DocumentBuilder()
    .setTitle(config.get('app.market.title'))
    .setDescription(description)
    .setVersion(`v${config.get('app.version')}`)
    .addTag(config.get('app.market.tag'))
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refreshToken')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'apiKey')
    .build();

  const document = SwaggerModule.createDocument(app, documentBuild, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup('swagger', app, document, {
    explorer: true,
    customSiteTitle: config.get('app.market.siteTitle'),
  });
}
