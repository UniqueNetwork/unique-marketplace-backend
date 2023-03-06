import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { SettingsTable1677511684518 } from './migrations/1677511684518-SettingsTable';
import { SettingEntity } from './entities/setting.entity';
import { DeployContractV0_1677512245943 } from './migrations/1677512245943-DeployContractV0';

const entities = [SettingEntity];
const migrations = [SettingsTable1677511684518, DeployContractV0_1677512245943];

const imports: DynamicModule[] = [TypeOrmModule.forFeature(entities)];

function typeOrmModulesFactory(
  appendOptions: Pick<
    Partial<TypeOrmModuleOptions>,
    'migrations' | 'migrationsRun'
  > = {}
) {
  return [
    TypeOrmModule.forFeature(entities),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Config>
      ): TypeOrmModuleOptions => {
        return {
          ...configService.get('database'),
          entities,
          ...appendOptions,
        };
      },
    }),
  ];
}

@Module({
  exports: [TypeOrmModule],
})
export class DatabaseModule {
  static forEscrow(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ...typeOrmModulesFactory({
          migrations,
          migrationsRun: true,
        }),
      ],
    };
  }

  static forMarket(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [...typeOrmModulesFactory()],
    };
  }
}
