import { CacheConfig } from './cache.config';
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export type Config = {
  environment: string;
  port: number;
  cors: string;
  swagger: string;

  cache: CacheConfig;

  signer?: SignerConfig;

  releaseVersion: string;

  sentryDsnUrl?: string;
  sentryReleaseVersion?: string;

  monitoringPort?: number;

  prefix?: string;

  database: PostgresConnectionOptions;
};

export type SignerConfig = {
  seed?: string;
};

