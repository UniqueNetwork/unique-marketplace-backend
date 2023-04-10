import { CacheConfig } from './cache.config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export type Config = {
  environment: string;
  port: number;
  cors: string;
  swagger: string;

  market: MarketSwaggerOptions;
  cache: CacheConfig;

  signer?: SignerConfig;

  releaseVersion: string;

  sentryDsnUrl?: string;
  sentryReleaseVersion?: string;

  monitoringPort?: number;

  prefix?: string;

  uniqueSdkRestUrl: string;
  uniqueRpcUrl: string;

  database: PostgresConnectionOptions;
  logging: boolean;
};

export type MarketSwaggerOptions = {
  title: string;
  name: string;
};

export type SignerConfig = {
  seed?: string;
};
