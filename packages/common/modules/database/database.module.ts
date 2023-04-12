import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import {
  ContractEntity,
  OfferEntity,
  OfferEventEntity,
  SettingEntity,
} from './entities';
import {
  CollectionsTable1681108635456,
  ContractsTable1677511684518,
  DeployContractV0_1677512245943,
  OfferEventsTable1679993242288,
  OffersTable1679578453871,
  SettingsTable1677511684518,
} from './migrations';
import { ContractService, OfferService } from './services';
import { OfferEventService } from './services/offer-event.service';
import { CollectionEntity } from './entities/collection.entity';
import { TokensEntity } from './entities/tokens.entity';
import { PropertiesEntity } from './entities/properties.entity';
import { TokensTable1681310408111 } from './migrations/1681310408111-TokensTable';
import { PropertiesTable1681310408929 } from './migrations/1681310408929-PropertiesTable';

const entities = [
  SettingEntity,
  ContractEntity,
  OfferEntity,
  OfferEventEntity,
  CollectionEntity,
  TokensEntity,
  PropertiesEntity,
];
const migrations = [
  SettingsTable1677511684518,
  ContractsTable1677511684518,
  DeployContractV0_1677512245943,
  OffersTable1679578453871,
  OfferEventsTable1679993242288,
  CollectionsTable1681108635456,
  TokensTable1681310408111,
  PropertiesTable1681310408929,
];

function typeOrmModulesFactory(
  appendOptions: Pick<
    Partial<TypeOrmModuleOptions>,
    'migrations' | 'migrationsRun' | 'migrationsTransactionMode' | 'logger'
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
          logging: configService.get('logging'),
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
  static forRoot(): DynamicModule {
    return {
      global: true,
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

  static forFeature(): DynamicModule {
    return {
      global: true,
      module: DatabaseModule,
      imports: [
        ...typeOrmModulesFactory({
          logger: 'advanced-console',
        }),
      ],
      providers: [ContractService, OfferService, OfferEventService],
      exports: [ContractService, OfferService, OfferEventService],
    };
  }
}
