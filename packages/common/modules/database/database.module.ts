import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';
import {
  ContractEntity,
  OfferEntity,
  OfferEventEntity,
  ViewOffers,
  SettingEntity,
  CollectionEntity,
  TokensEntity,
  PropertiesEntity,
  AdminSessionEntity,
  TradeViewEntity,
  TokensViewer,
} from './entities';
import {
  AdminSessionsTable1683194096000,
  CollectionsTable1681108635456,
  ContractsTable1677511684518,
  DeployContractV0_1677512245943,
  OfferEventsTable1679993242288,
  OffersTable1679578453871,
  PropertiesTable1681310408929,
  SettingsTable1677511684518,
  TokensTable1681310408111,
  ViewOffers1682699159580,
  ViewTrades1683809743000,
  ViewTokens1684221119187,
  MarketTradeToOffers1684739540151,
  MarketTradeToOfferEvents1684739540519,
  VerifyMessageContract1686310569001,
  NormalizeAddress1688973356000,
} from './migrations';
import { ContractService, OfferService, SettingsService } from './services';
import { OfferEventService } from './services/offer-event.service';

const entities = [
  SettingEntity,
  ContractEntity,
  OfferEntity,
  OfferEventEntity,
  ViewOffers,
  CollectionEntity,
  TokensEntity,
  PropertiesEntity,
  AdminSessionEntity,
  TradeViewEntity,
  TokensViewer,
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
  ViewOffers1682699159580,
  AdminSessionsTable1683194096000,
  ViewTrades1683809743000,
  ViewTokens1684221119187,
  MarketTradeToOffers1684739540151,
  MarketTradeToOfferEvents1684739540519,
  VerifyMessageContract1686310569001,
  NormalizeAddress1688973356000,
];

function typeOrmModulesFactory(
  appendOptions: Pick<
    Partial<TypeOrmModuleOptions>,
    'migrations' | 'migrationsRun' | 'migrationsTransactionMode' | 'logger' | 'migrationsTableName' | 'metadataTableName'
  > = {},
) {
  return [
    TypeOrmModule.forFeature(entities),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config>): TypeOrmModuleOptions => {
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
          migrationsTableName: 'new_migrations',
          metadataTableName: 'new_typeorm_metadata',
        }),
      ],
      providers: [ContractService, OfferService, OfferEventService, SettingsService],
      exports: [ContractService, OfferService, OfferEventService, SettingsService],
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
      providers: [ContractService, OfferService, OfferEventService, SettingsService],
      exports: [ContractService, OfferService, OfferEventService, SettingsService],
    };
  }
}
