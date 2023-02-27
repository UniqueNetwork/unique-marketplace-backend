import { DynamicModule } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Config } from "../config";
import { MigrationsRunner } from "./migrations-runner.service";

const entities = [];

const imports: DynamicModule[] = [
  TypeOrmModule.forRootAsync({
    inject: [ ConfigService ],
    useFactory: (configService: ConfigService<Config>): TypeOrmModuleOptions => {
      return {
        ... configService.get('database'),
        entities,
      };
    }
  }),
  TypeOrmModule.forFeature(entities),
];

export class DatabaseModule {
  static forEscrow(): DynamicModule {
    return {
      imports,
      module: DatabaseModule,
      providers: [
        MigrationsRunner,
        {
          provide: 'run-migrations',
          inject: [MigrationsRunner],
          useFactory: async (migrationsRunner: MigrationsRunner): Promise<void> => {
            await migrationsRunner.checkMigrations();
          },
        }
      ],
    }
  }

  static forMarket(): DynamicModule {
    return {
      module: DatabaseModule,
    }
  }
}
