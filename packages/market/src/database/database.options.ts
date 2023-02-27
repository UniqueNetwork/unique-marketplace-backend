import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';
import * as PostgressConnectionStringParser from 'pg-connection-string';
import { DatabaseLogger } from './database.logger';
import { DataSource } from 'typeorm';

export const databaseConfig = () => {
  const urlDatabase = ''; // config.get('db.url');
  const connectionOptions = PostgressConnectionStringParser.parse(urlDatabase);
  const dataSourceBasicOptions: DataSourceOptions = {
    type: 'postgres',
    host: connectionOptions.host,
    port: +connectionOptions.port,
    username: connectionOptions.user,
    password: connectionOptions.password,
    database: connectionOptions.database,
    entities: [
      __dirname + './**/entity.{t,j}s',
      __dirname + './entity/*.{t,j}s',
    ],
    migrations: [__dirname + './migrations/*.{t,j}s'],
    logging: ['error'],
    logger: new DatabaseLogger(),
    synchronize: false,
    migrationsRun: true, //config.get('db.migration.run'),
    migrationsTableName: 'migrations',
    subscribers: [__dirname + './migrations/*.{t,j}s'],
  };
  return dataSourceBasicOptions;
};
export default databaseConfig;
export const AppDataSource = new DataSource(databaseConfig());
