import { INestApplication, INestApplicationContext, INestMicroservice } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { Config } from '../config';
import { SentryInterceptor } from './sentry.interceptor';
import { SentryLogger } from './sentry.logger';
import { NestApplication } from "@nestjs/core";
import { NestMicroservice } from "@nestjs/microservices";

export const initSentry = (app: INestApplication | INestMicroservice | INestApplicationContext) => {
  const config: ConfigService<Config> = app.get(ConfigService);

  const sentryDsnUrl = config.get('sentryDsnUrl');
  if (!sentryDsnUrl) return;

  Sentry.init({
    environment: config.get('environment'),
    dsn: sentryDsnUrl,
    tracesSampleRate: 1.0,
    release: config.get('sentryReleaseVersion'),
    normalizeDepth: 10,
  });


  if (app instanceof NestApplication || app instanceof NestMicroservice) {
    app.useGlobalInterceptors(new SentryInterceptor());
  }
  app.useLogger(new SentryLogger());
};
