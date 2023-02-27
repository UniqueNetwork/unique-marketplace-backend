import { createCacheConfig } from './cache.config';
import { Config } from './types';
import { loadDatabaseConfig } from './database.config';

export const loadConfig = (): Config => ({
  environment: process.env.ENVIRONMENT || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  // chainWsUrl: process.env.CHAIN_WS_URL,
  cors: process.env.CORS || '',
  swagger: process.env.SWAGGER || 'swagger',

  signer: {
    seed: process.env.SIGNER_SEED,
  },

  cache: createCacheConfig(process.env),

  releaseVersion: process.env.npm_package_version,

  sentryDsnUrl: process.env.SENTRY_DSN_URL,
  sentryReleaseVersion: `unique-marketplace@${process.env.npm_package_version}`,

  monitoringPort: +process.env.MONITORING_PORT || 0,

  database: loadDatabaseConfig(),
});
