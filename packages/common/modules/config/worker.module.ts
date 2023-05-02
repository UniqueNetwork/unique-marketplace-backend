import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphileWorkerModule } from 'nestjs-graphile-worker';
import { Config } from "./types";
import {
  GraphileWorkerConfiguration
} from "nestjs-graphile-worker/dist/interfaces/module-config.interfaces";
import { DataSource } from "typeorm";
import { Pool } from "pg";
import { PostgresDriver } from "typeorm/driver/postgres/PostgresDriver";
import { Logger } from "@nestjs/common";

/**
 * Tasks Worker Module
 * @constructor
 *
 */
export const TasksWorkerModule = GraphileWorkerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService, DataSource],
  useFactory: (config: ConfigService<Config>, dataSource: DataSource): GraphileWorkerConfiguration => {
    const db = config.get('database');

    let pgPool: Pool;

    if (dataSource.driver instanceof PostgresDriver) {
      pgPool = dataSource.driver.master as Pool;
    }

    if (!pgPool) {
      throw new Error('Its not a PostgreSQL');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pgPool.toJSON = function(){
      return 'pgPool';
    };

    return {
      pgPool,
    };
  },
});
