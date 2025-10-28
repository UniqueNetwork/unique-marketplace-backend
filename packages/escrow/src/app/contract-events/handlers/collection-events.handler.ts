import { Inject, Injectable, Logger } from '@nestjs/common';
import { OfferEntity, OfferService, SettingsService } from '@app/common/modules/database';
import { OfferStatus } from '@app/common/modules/types';
import { TokensService } from '../../../collections/tokens.service';
import { CollectionsService } from '../../../collections/collections.service';

// Types for new indexer events
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

interface ParsedCollectionEvent {
  collectionId?: number;
  tokenId?: number;
  owner?: string;
  to?: string;
  from?: string;
  approved?: string;
  blockNumber: number;
  method: string;
  section: string;
  eventId: string;
  extrinsicHash: string;
}

// Event transformer interface - you can implement the actual transformation logic
interface ICollectionEventTransformer {
  transformEvent(event: IndexerExtrinsicEvent): ParsedCollectionEvent | null;
}

// Default transformer implementation - customize as needed
class DefaultCollectionEventTransformer implements ICollectionEventTransformer {
  transformEvent(event: IndexerExtrinsicEvent): ParsedCollectionEvent | null {
    const { section, method, args, data } = event;
    
    // Event data comes in numeric keys format: {"0": "value1", "1": "value2", ...}
    const eventData = args || data || {};
    
    const baseEvent: ParsedCollectionEvent = {
      blockNumber: parseInt(event.blockNumber, 10),
      method,
      section,
      eventId: event.eventId,
      extrinsicHash: event.extrinsicHash,
    };

    // Transform based on section/method using numeric keys from event data
    switch (`${section}.${method}`) {
      case 'common.Transfer':
      case 'unique.Transfer':
        // Transfer: {"0": "437", "1": "0", "2": "{\"substrate\":\"from_addr\"}", "3": "{\"substrate\":\"to_addr\"}", "4": "value"}
        return {
          ...baseEvent,
          collectionId: this.extractNumber(eventData['0']),
          tokenId: this.extractNumber(eventData['1']),
          from: this.extractAddressFromJson(eventData['2']),
          to: this.extractAddressFromJson(eventData['3']),
        };

      case 'common.Approved':
      case 'unique.Approved':
        // Approved: {"0": "437", "1": "0", "2": "{\"substrate\":\"owner\"}", "3": "{\"ethereum\":\"approved\"}", "4": "value"}
        return {
          ...baseEvent,
          collectionId: this.extractNumber(eventData['0']),
          tokenId: this.extractNumber(eventData['1']),
          owner: this.extractAddressFromJson(eventData['2']),
          approved: this.extractAddressFromJson(eventData['3']),
        };

      case 'common.ItemDestroyed':
      case 'unique.ItemDestroyed':
        // ItemDestroyed: {"0": "437", "1": "0", "2": "{\"substrate\":\"owner\"}", "3": "value"}
        return {
          ...baseEvent,
          collectionId: this.extractNumber(eventData['0']),
          tokenId: this.extractNumber(eventData['1']),
          owner: this.extractAddressFromJson(eventData['2']),
        };

      case 'common.CollectionDestroyed':
      case 'unique.CollectionDestroyed':
        // CollectionDestroyed: {"0": "3787"}
        return {
          ...baseEvent,
          collectionId: this.extractNumber(eventData['0']),
        };

      case 'common.ItemCreated':
      case 'unique.ItemCreated':
        // ItemCreated: {"0": "2184", "1": "7797", "2": "{\"substrate\":\"owner\"}", "3": "amount"}
        return {
          ...baseEvent,
          collectionId: this.extractNumber(eventData['0']),
          tokenId: this.extractNumber(eventData['1']),
          owner: this.extractAddressFromJson(eventData['2']),
        };

      case 'common.CollectionCreated':
      case 'unique.CollectionCreated':
        // CollectionCreated: {"0": "3792", "1": "2", "2": "owner_address"}
        return {
          ...baseEvent,
          collectionId: this.extractNumber(eventData['0']),
          owner: this.extractString(eventData['2']),
        };

      default:
        return null;
    }
  }

  private extractNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  private extractString(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return undefined;
  }

  private extractAddressFromJson(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    
    try {
      // Parse JSON string like '{"substrate":"address"}' or '{"ethereum":"0x..."}' 
      const addressObj = JSON.parse(value);
      
      // Return the first address found (substrate or ethereum)
      if (addressObj.substrate) return addressObj.substrate;
      if (addressObj.ethereum) return addressObj.ethereum;
      
      return undefined;
    } catch (error) {
      // If not JSON, return as is (for plain address strings)
      return this.extractString(value);
    }
  }
}

@Injectable()
export class CollectionEventsHandler {
  private logger: Logger = new Logger(CollectionEventsHandler.name);

  private queueIsBusy = false;
  private approveQueue: OfferEntity[] = [];
  private eventTransformer: ICollectionEventTransformer;

  constructor(
    @Inject(OfferService)
    private readonly offerService: OfferService,
    @Inject(TokensService)
    private readonly tokensService: TokensService,
    @Inject(CollectionsService)
    private readonly collectionsService: CollectionsService,
    @Inject(SettingsService)
    private readonly settingsService: SettingsService,
  ) {
    // Initialize the event transformer
    this.eventTransformer = new DefaultCollectionEventTransformer();
  }

  /**
   * Handle collection/token events from the new indexer
   * @param events Array of extrinsic events from indexer subscription
   */
  async handleCollectionEvents(events: IndexerExtrinsicEvent[]) {
    for (const event of events) {
      try {
        const parsedEvent = this.eventTransformer.transformEvent(event);
        if (parsedEvent) {
          await this.processCollectionEvent(parsedEvent);
        }
      } catch (error) {
        this.logger.error(`Error processing collection event ${event.eventId}:`, error);
      }
    }
  }

  private async processCollectionEvent(event: ParsedCollectionEvent) {
    await this.saveBlockId(event.blockNumber);

    this.logger.verbose(`Collection:processEvent: ${event.method} for C:${event.collectionId} T:${event.tokenId}`);

    // Handle token events
    if (event.tokenId && event.collectionId) {
      // Notify tokens service about the event - creating minimal CollectionData structure
      await this.tokensService.observer(event.collectionId, event.tokenId, {
        event: {
          method: event.method,
          section: event.section,
          index: '',
          dataHex: '',
          dataHuman: '',
          dataJson: ''
        },
        extrinsic: null,
        parsed: {
          event: {
            method: event.method,
            section: event.section,
            index: '',
            dataHex: '',
            dataHuman: '',
            dataJson: ''
          },
          address: event.from,
          addressTo: event.to || event.approved
        }
      } as any);

      // Handle offers for this token
      const offer = await this.offerService.find(event.collectionId, event.tokenId, {
        status: OfferStatus.Opened,
      });

      if (!offer) {
        return;
      }

      await this.handleTokenEvent(event, offer);
    }

    // Handle collection-level events
    if (event.collectionId && !event.tokenId) {
      await this.handleCollectionLevelEvent(event);
    }
  }

  private async handleTokenEvent(event: ParsedCollectionEvent, offer: OfferEntity) {
    const { method } = event;

    switch (method) {
      case 'ItemDestroyed':
        await this.deleteOffer(offer);
        break;

      case 'Approved':
        // Check if approved to a contract we know about
        if (event.approved) {
          // TODO: Check if approved address is a known contract
          // For now, always run check approved
          await this.runCheckApproved(offer);
        }
        break;

      case 'Transfer':
        await this.runCheckApproved(offer);
        break;

      default:
        this.logger.debug(`Unhandled token event: ${method}`);
    }
  }

  private async handleCollectionLevelEvent(event: ParsedCollectionEvent) {
    const { method, collectionId } = event;

    switch (method) {
      case 'CollectionDestroyed':
        if (collectionId) {
          await this.deleteCollectionOffers(collectionId);
        }
        break;

      case 'CollectionCreated':
        this.logger.log(`Collection created: ${collectionId}`);
        // TODO: Handle collection creation if needed
        break;

      default:
        this.logger.debug(`Unhandled collection event: ${method}`);
    }
  }

  public async saveBlockId(blockId: number) {
    await this.settingsService.setSubscribeCollectionBlock(blockId);
  }

  private async deleteOffer(offer: OfferEntity) {
    await this.offerService.delete(offer.id);

    await this.runCheckApproved(offer);
  }

  private async runCheckApproved(offer: OfferEntity) {
    // TODO: SDK_UPGRADE - Implement token allowance check with new SDK
    // For now, we'll skip the allowance check and just run contract check
    this.logger.warn(`Skipping allowance check for offer ${offer.id} - not implemented in new SDK yet`);
    
    // Still run the contract check approved
    await this.runContractCheckApproved(offer);
  }

  private async runContractCheckApproved(offer: OfferEntity) {
    // TODO: SDK_UPGRADE - Implement contract interaction with new SDK
    this.logger.warn(`Contract check approved not implemented for new SDK yet - offer ${offer.id}`);
    
    if (this.queueIsBusy) {
      const exists = this.approveQueue.find(
        (o) =>
          o.collectionId === offer.collectionId && o.tokenId === offer.tokenId && o.contract.address === offer.contract.address,
      );

      if (!exists) {
        this.approveQueue.push(offer);
      }

      return;
    }
    this.queueIsBusy = true;

    try {
      // TODO: Implement actual contract call when new SDK contract interaction is available
      this.logger.debug(`Would check approved for collection ${offer.collectionId}, token ${offer.tokenId}`);
    } catch (err) {
      this.logger.error(`Error in contract check approved:`, err);
    }

    this.queueIsBusy = false;

    if (this.approveQueue.length) {
      const nextOffer = this.approveQueue.shift();
      if (nextOffer) {
        this.runCheckApproved(nextOffer);
      }
    }
  }

  private async deleteCollectionOffers(collectionId: number) {
    const offers = await this.offerService.getAllByCollection(collectionId);
    // todo delete all by one call in smart-contract
    await Promise.all(offers.map((offer) => this.runCheckApproved(offer)));
  }
}
