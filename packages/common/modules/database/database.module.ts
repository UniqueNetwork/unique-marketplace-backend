import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import {
  SettingEntity,
  ContractEntity,
  OfferEntity,
  OfferEventEntity,
} from './entities';
import {
  SettingsTable1677511684518,
  OffersTable1679578453871,
  ContractsTable1677511684518,
  DeployContractV0_1677512245943,
  OfferEventsTable1679993242288,
} from './migrations';
import { ContractService, OfferService } from './services';
import { OfferEventService } from './services/offer-event.service';

const entities = [SettingEntity, ContractEntity, OfferEntity, OfferEventEntity];
const migrations = [
  SettingsTable1677511684518,
  ContractsTable1677511684518,
  DeployContractV0_1677512245943,
  OffersTable1679578453871,
  OfferEventsTable1679993242288,
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
        const databaseConfig = configService.get('database');
        console.log('databaseConfig', databaseConfig);
        return {
          ...databaseConfig,
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
      providers: [ContractService, OfferService, OfferEventService],
      exports: [ContractService, OfferService, OfferEventService],
    };
  }

  static forMarket(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [...typeOrmModulesFactory()],
    };
  }
}
