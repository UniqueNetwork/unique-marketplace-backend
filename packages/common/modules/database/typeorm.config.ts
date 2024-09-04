import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();
const migrationsDir = path.join(__dirname, 'migrations');
const entitiesDir = path.join(__dirname, 'entities');
const isTestMode = process.env.NODE_ENV === 'test';

const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST!,
  port: +process.env.POSTGRES_PORT!,
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  database: process.env.POSTGRES_DATABASE!,
  entities: [path.join(entitiesDir, '/**/*{.ts,.js}')],
  synchronize: false,
  migrationsRun: true,
  migrations: isTestMode ? [] : [path.join(migrationsDir, '/index{.ts,.js}')],
  logging: process.env.LOGGING === '1',
};

export default typeormConfig;

export const AppDataSource = new DataSource(typeormConfig);
