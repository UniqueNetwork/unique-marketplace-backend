import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UniqueIndexerSubscriptions } from '@unique-nft/sdk-v2/uniqueIndexerSubscriptions';
import { INDEXER_SUBSCRIPTIONS } from '@app/common/modules/sdk/indexer-subscriptions.provider';
import { ContractEntity, OfferService, SettingsService } from '@app/common/modules/database';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionsService } from '../../collections/collections.service';
import { TokensService } from '../../collections/tokens.service';
import { CollectionEventsHandler } from './handlers/collection-events.handler';
import { ContractEventsHandler } from './handlers/contract-events.handler';

// Types for indexer subscription data
interface IndexerEvent {
  eventId: string;
  extrinsicHash: string;
  blockNumber: string;
  section: string;
  method: string;
  data: {
    log?: string; // JSON string containing the actual log data
  };
  asHex: string;
  createdAt: string;
  blockTimestamp: string;
}

interface IndexerExtrinsicEvent {
  eventId: string;
  extrinsicHash: string;
  blockNumber: string;
  section: string;
  method: string;
  data?: Record<string, unknown>;
  args?: Record<string, unknown>;
  createdAt: string;
  blockTimestamp: string;
}



@Injectable()
export class IndexerSubscriptionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerSubscriptionsService.name);
  
  private isConnected = false;
  private subscriptionIds: string[] = [];

  constructor(
    @Inject(INDEXER_SUBSCRIPTIONS)
    private readonly subscriptions: UniqueIndexerSubscriptions,
    @InjectRepository(ContractEntity)
    private readonly contractRepository: Repository<ContractEntity>,
    private readonly collectionsService: CollectionsService,
    private readonly tokensService: TokensService,
    private readonly settingsService: SettingsService,
    private readonly offerService: OfferService,
    private readonly collectionEventsHandler: CollectionEventsHandler,
    private readonly contractEventsHandler: ContractEventsHandler,
  ) {}

  async onModuleInit() {
    try {
      await this.init();
    } catch (error) {
      this.logger.error('Failed to initialize indexer subscriptions:', error);
    }
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  async init() {
    try {
      await this.subscriptions.connect();
      this.isConnected = true;
      this.logger.log('✅ Connected to WebSocket');
      
      // Initialize subscriptions
      await this.initContractSubscriptions();
      await this.initCollectionSubscriptions();
      
    } catch (error) {
      this.logger.error('❌ Connection failed:', error);
      throw error;
    }
  }

  // Subscribe to contract events (analog of subscribeContract)
  async subscribeToContract(contractAddress: string, fromBlock = 0): Promise<string> {
    this.logger.log(`📜 Subscribing to contract ${contractAddress} from block ${fromBlock}`);
    
    const subId = await this.subscriptions.subscribeContractEvents({
      contractAddress,
      fromBlockNumber: fromBlock
    }, (data) => {
      this.handleContractEvents(contractAddress, data);
    });
    
    this.subscriptionIds.push(subId);
    return subId;
  }

  // Subscribe to collection events (analog of subscribeCollection)
  async subscribeToCollections(fromBlock = 0): Promise<string> {
    this.logger.log(`📦 Subscribing to collection events from block ${fromBlock}`);
    
    const subId = await this.subscriptions.subscribeExtrinsics({
      fromBlockNumber: fromBlock,
      sectionMethods: [
        { section: 'unique', method: 'Transfer' },
        { section: 'unique', method: 'Approved' }, 
        { section: 'unique', method: 'ItemDestroyed' },
        { section: 'unique', method: 'CollectionDestroyed' },
        { section: 'unique', method: 'ItemCreated' },
        { section: 'unique', method: 'CollectionCreated' }
      ]
    }, (data) => {
      this.handleCollectionEvents(data);
    });
    
    this.subscriptionIds.push(subId);
    return subId;
  }

  // Contract events handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleContractEvents(contractAddress: string, data: any) {
    this.logger.log(`📨 Contract ${contractAddress} events: ${data.items?.length || 0}`);
    
    if (data.items && Array.isArray(data.items)) {
      // Delegate to the contract events handler with contractAddress from subscription
      await this.contractEventsHandler.handleContractEvents(contractAddress, data.items);
    }
  }  // Collection events handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleCollectionEvents(data: any) {
    this.logger.log(`📦 Collection events: ${data.items?.length || 0}`);
    
    if (data.items && Array.isArray(data.items)) {
      // Map the data to match IndexerExtrinsicEvent format expected by handler
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const indexerEvents: IndexerExtrinsicEvent[] = data.items.map((item: any) => ({
        eventId: item.eventId || item.id || '',
        extrinsicHash: item.extrinsicHash || '',
        blockNumber: item.blockNumber?.toString() || '',
        section: item.section || '',
        method: item.method || '',
        data: item.data || {},
        args: item.args || item.data || {},
        createdAt: item.createdAt || new Date().toISOString(),
        blockTimestamp: item.blockTimestamp || new Date().toISOString(),
      }));
      
      await this.collectionEventsHandler.handleCollectionEvents(indexerEvents);
    }
  }



  // Initialize contract subscriptions (analog of initContracts)
  private async initContractSubscriptions() {
    try {
      const contracts = await this.contractRepository.find();
      this.logger.log(`Found ${contracts.length} contracts to subscribe to`);
      
      for (const contract of contracts) {
        // Initialize ABI for this contract
        await this.contractEventsHandler.initializeContract(contract.address, contract.version.toString());
        this.logger.log(`✅ Initialized ABI for contract ${contract.address} (version ${contract.version})`);
        
        const fromBlock = await this.getFromBlock(contract.address);
        await this.subscribeToContract(contract.address, fromBlock);
      }
    } catch (error) {
      this.logger.error('Error initializing contract subscriptions:', error);
    }
  }

  private async initCollectionSubscriptions() {
    try {
      const fromBlock = await this.getCollectionFromBlock();
      await this.subscribeToCollections(fromBlock);
    } catch (error) {
      this.logger.error('Error initializing collection subscriptions:', error);
    }
  }

  private async getFromBlock(contractAddress: string): Promise<number> {
    const contract = await this.contractRepository.findOne({ 
      where: { address: contractAddress.toLowerCase() } 
    });
    
    if (!contract) {
      throw new Error(`Contract not found: ${contractAddress}`);
    }
    
    if (!contract.processedAt) {
      throw new Error(`Contract ${contractAddress} has no processedAt block`);
    }
    
    return contract.processedAt;
  }

  private async getCollectionFromBlock(): Promise<number> {
    const block = await this.settingsService.getSubscribeCollectionBlock();
    return block || 1;
  }

  // Graceful shutdown
  async shutdown() {
    this.logger.log('🛑 Shutting down subscriptions...');
    
    try {
      await this.subscriptions.unsubscribeAll();
      this.subscriptions.close();
      this.isConnected = false;
      this.subscriptionIds = [];
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}