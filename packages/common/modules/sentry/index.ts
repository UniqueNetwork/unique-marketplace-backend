import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { Config } from '../config';
import { SentryInterceptor } from './sentry.interceptor';
import { SentryLogger } from './sentry.logger';

export const initSentry = (app: INestApplication) => {
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

  app.useGlobalInterceptors(new SentryInterceptor());
  app.useLogger(new SentryLogger());
};
