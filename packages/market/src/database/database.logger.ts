import { Logger } from 'typeorm/logger/Logger';
import { QueryRunner } from 'typeorm';

export class DatabaseLogger implements Logger {
  private _queryRunner: QueryRunner;
  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    queryRunner?: QueryRunner
  ): any {
    this._queryRunner = queryRunner;
  }

  logMigration(message: string, queryRunner?: QueryRunner): any {
    this._queryRunner = queryRunner;
  }

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
    this._queryRunner = queryRunner;
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner
  ): any {
    this._queryRunner = queryRunner;
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner
  ): any {
    this._queryRunner = queryRunner;
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
    this._queryRunner = queryRunner;
  }
}
