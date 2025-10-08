import { CacheConfig } from './cache.config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export interface FileStorageConfig {
  endPoint: string;
  bucketName: string;
  accessKey: string;
  secretKey: string;
}

export type Config = {
  environment: string;
  port: number;
  cors: string;
  swagger: string;

  market: MarketSwaggerOptions;
  cache: CacheConfig;

  signer?: SignerConfig;
  signatureKey?: string;
  releaseVersion: string;

  sentryDsnUrl?: string;
  sentryReleaseVersion?: string;

  monitoringPort?: number;

  prefix?: string;

  uniqueSdkRestUrl: string;
  uniqueRpcUrl: string;

  database: PostgresConnectionOptions;
  logging: boolean;

  fileStorage: FileStorageConfig;
  adminSecretKey: string;

  coingeckoApiKey?: string;
};

export type MarketSwaggerOptions = {
  title: string;
  name: string;
};

export type SignerConfig = {
  metamaskSeed?: string;
  substrateSeed?: string;
};
