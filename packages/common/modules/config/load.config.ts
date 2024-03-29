import { createCacheConfig } from './cache.config';
import { Config, FileStorageConfig } from './types';
import { loadDatabaseConfig } from './database.config';

export function loadFileStorageConfig(): FileStorageConfig {
  return {
    endPoint: process.env.MINIO_END_POINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucketName: process.env.MINIO_BUCKET_NAME,
  };
}

export const loadConfig = (): Config => ({
  environment: process.env.ENVIRONMENT || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  // chainWsUrl: process.env.CHAIN_WS_URL,
  cors: process.env.CORS || '',
  swagger: process.env.SWAGGER || 'swagger',

  market: {
    title: 'Unique Market v3.0',
    name: 'Market REST API',
  },

  signer: {
    metamaskSeed: process.env.METAMASK_SIGNER_SEED,
    substrateSeed: process.env.SUBSTRATE_SIGNER_SEED,
  },
  signatureKey: process.env.SIGNATURE_KEY || '', // Sign and Verify key (sign the following data)

  cache: createCacheConfig(process.env),

  releaseVersion: process.env.npm_package_version,

  sentryDsnUrl: process.env.SENTRY_DSN_URL,
  sentryReleaseVersion: `unique-marketplace@${process.env.npm_package_version}`,

  monitoringPort: +process.env.MONITORING_PORT || 0,

  database: loadDatabaseConfig(),
  logging: process.env.POSTGRES_LOG === 'true',

  uniqueSdkRestUrl: process.env.UNIQUE_SDK_REST_URL,
  uniqueRpcUrl: process.env.UNIQUE_RPC_URL,

  fileStorage: loadFileStorageConfig(),
  adminSecretKey: process.env.ADMIN_SECRET_KEY,
});
