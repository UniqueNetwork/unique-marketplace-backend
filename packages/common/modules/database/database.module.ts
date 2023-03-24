import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import { SettingsTable1677511684518 } from './migrations/1677511684518-SettingsTable';
import { SettingEntity } from './entities/setting.entity';
import { DeployContractV0_1677512245943 } from './migrations/1677512245943-DeployContractV0';
import { ContractsTable1677511684518 } from './migrations/1679480574000-ContractsTable';
import { ContractEntity } from './entities/contract.entity';
import { ContractService } from './services/contract.service';
import { OfferEntity } from './entities/offer.entity';
import { OffersTable1679578453871 } from './migrations/1679578453871-OffersTable';
import { OfferService } from './services/offer.service';

const entities = [SettingEntity, ContractEntity, OfferEntity];
const migrations = [
  SettingsTable1677511684518,
  ContractsTable1677511684518,
  DeployContractV0_1677512245943,
  OffersTable1679578453871,
];

function typeOrmModulesFactory(
  appendOptions: Pick<
    Partial<TypeOrmModuleOptions>,
    'migrations' | 'migrationsRun' | 'migrationsTransactionMode'
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
          migrationsTransactionMode: 'each',
        }),
      ],
      providers: [ContractService, OfferService],
      exports: [ContractService, OfferService],
    };
  }

  static forMarket(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [...typeOrmModulesFactory()],
    };
  }
}
