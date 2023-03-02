import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { SettingsTable1677511684518 } from './migrations/1677511684518-SettingsTable';
import { SettingEntity } from './entities/setting.entity';
import { DeployContractV1_1677512245943 } from './migrations/1677512245943-DeployContractV1';

const entities = [SettingEntity];
const migrations = [SettingsTable1677511684518, DeployContractV1_1677512245943];

const imports: DynamicModule[] = [TypeOrmModule.forFeature(entities)];

export class DatabaseModule {
  static forEscrow(): DynamicModule {
    return {
      imports: [
        ...imports,
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (
            configService: ConfigService<Config>
          ): TypeOrmModuleOptions => {
            return {
              ...configService.get('database'),
              entities,
              migrations,
              migrationsRun: true, // todo fix
            };
          },
        }),
      ],
      module: DatabaseModule,
      exports: [TypeOrmModule],
    };
  }

  static forMarket(): DynamicModule {
    return {
      imports: [
        ...imports,
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (
            configService: ConfigService<Config>
          ): TypeOrmModuleOptions => {
            return {
              ...configService.get('database'),
              entities,
              migrations,
            };
          },
        }),
      ],
      module: DatabaseModule,
      exports: [TypeOrmModule],
    };
  }
}
