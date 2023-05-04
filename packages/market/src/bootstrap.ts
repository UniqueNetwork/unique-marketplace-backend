import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { green, yellow } from 'cli-color';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import swaggerInit from './swagger';
import { AppModule } from './app.module';
import { pgNotifyClient } from '@app/common/pg-transport/pg-notify-client.symbol';
import helmet from 'helmet';
import { initSentry } from '@app/common/modules/sentry';

export default async function (app: INestApplication, logger: Logger) {
  app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Start app

  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  //app.get(pgNotifyClient).emit('new-collection-added', { collectionId: 12 }); // todo uncomment for debug
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);
  // Swagger
  await swaggerInit(app, configService);
  initSentry(app);
  app.enableCors({
    allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe, Signature, Authorization',
    origin: true,
    credentials: true,
  });
  app.use(helmet());

  // Listener port

  await app.listen(configService.get('port'), () => {
    logger.log(`API application on port: ${yellow(configService.get('port'))}`);
    logger.log(`API application ${green('version:')} ${yellow(configService.get('releaseVersion'))} ${green('started!')}`);
  });
  return app;
}
