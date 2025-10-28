import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UniqueIndexerSubscriptions } from '@unique-nft/sdk-v2/uniqueIndexerSubscriptions';
import { Config } from '../config';

export const INDEXER_SUBSCRIPTIONS = 'INDEXER_SUBSCRIPTIONS';

export const indexerSubscriptionsProvider: Provider = {
  provide: INDEXER_SUBSCRIPTIONS,
  useFactory: (configService: ConfigService<Config>): UniqueIndexerSubscriptions => {
    // Use dedicated indexer V2 WebSocket URL from config
    const wsUrl = configService.get('uniqueIndexerV2WsUrl');

    console.log(`Indexer Subscriptions provider created with wsUrl: ${wsUrl}`);
    
    return new UniqueIndexerSubscriptions({
      wsUrl,
      verbose: true,
      reconnectAttempts: 5,
      reconnectDelay: 3000
    });
  },
  inject: [ConfigService],
};