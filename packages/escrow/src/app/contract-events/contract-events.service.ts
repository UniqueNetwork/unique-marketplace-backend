import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IndexerSubscriptionsService } from './indexer-subscriptions.service';

@Injectable()
export class ContractEventsService implements OnModuleInit {
  private readonly logger = new Logger(ContractEventsService.name);

  constructor(
    private readonly indexerSubscriptionsService: IndexerSubscriptionsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Migrating to new IndexerSubscriptionsService...');
    
    // The new IndexerSubscriptionsService will handle initialization automatically
    // via its OnModuleInit hook
    
    this.logger.log('✅ Contract Events Service initialized (delegated to IndexerSubscriptionsService)');
  }

  // Legacy compatibility methods
  get connected(): boolean {
    return this.indexerSubscriptionsService.connected;
  }

  async shutdown(): Promise<void> {
    return this.indexerSubscriptionsService.shutdown();
  }
}
