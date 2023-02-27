import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import typeOrmConfig from './database.options';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigService],
      useFactory: async (config) => {
        const optionsConnection = typeOrmConfig();
        return optionsConnection;
      },
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
  ],
})
export class DatabaseModule {}
