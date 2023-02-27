import { DataSource } from 'typeorm';
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MigrationsRunner {
  private logger = new Logger(MigrationsRunner.name);

  constructor(private readonly datasource: DataSource) {}

  async checkMigrations() {
    const migrations = await this.datasource.runMigrations();

    const migrationNames = migrations.map((m) => m.name).join();

    const message = migrationNames
      ? `Applied migrations: ${migrationNames}`
      : 'No new migrations';

    this.logger.log(message);
  }
}
