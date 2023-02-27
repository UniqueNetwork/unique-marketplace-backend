import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';


import { green, yellow } from 'cli-color';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import swaggerInit from "./swagger";
import {AppModule} from "./app.module";


export default async function (app: INestApplication, logger: Logger) {
  app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Start app
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);
  //Swagger
  await swaggerInit(app, configService);

  // Listener port

  await app.listen(configService.get('app.port'), () => {
    logger.log(`API application on port: ${yellow(configService.get('app.port'))}`);
    logger.log(`API application ${green('version:')} ${yellow(configService.get('app.version'))} ${green('started!')}`);
  });
  return app;
}
