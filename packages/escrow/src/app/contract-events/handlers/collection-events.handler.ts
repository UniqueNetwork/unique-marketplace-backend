import { Inject, Injectable, Logger } from '@nestjs/common';
import { CollectionData, Sdk } from '@unique-nft/sdk/full';
import { OfferEntity, OfferService } from '@app/common/modules/database';
import { OfferStatus } from '@app/common/modules/types';
import { TokensService } from '../../../collections/tokens.service';
import { CollectionsService } from "../../../collections/collections.service";

@Injectable()
export class CollectionEventsHandler {
  private abiByAddress: Record<string, any>;
  private logger: Logger = new Logger(CollectionEventsHandler.name);

  private queueIsBusy: boolean;
  private approveQueue: OfferEntity[] = [];

  constructor(
    private readonly sdk: Sdk,
    @Inject(OfferService)
    private readonly offerService: OfferService,
    @Inject(TokensService)
    private readonly tokensService: TokensService,
    @Inject(CollectionsService)
    private readonly collectionsService: CollectionsService,
  ) {}

  public init(abiByAddress: Record<string, any>) {
    this.abiByAddress = abiByAddress;
  }

  public async onEvent(room, data: CollectionData) {
    const { parsed } = data;

    const { collectionId, tokenId, event } = parsed;

    const { method } = event;
    if (tokenId) {
      await this.tokensService.observer(collectionId, tokenId, data);
    }

    this.logger.verbose(`Collection:onEvent: ${method} for C:${collectionId} T:${tokenId}`);

    if (tokenId) {
      const offer = await this.offerService.find(collectionId, tokenId);
      if (!offer) {
        return;
      }

      if (method === "ItemDestroyed") {
        await this.deleteOffer(offer);
      }

      if (method === "Approved") {
        const { addressTo } = parsed;
        if (addressTo && this.abiByAddress[addressTo.toLowerCase()]) {
          await this.runCheckApproved(offer);
        }
      }

      if (method === "Transfer") {
        await this.runCheckApproved(offer);
      }
    } else {
      if (method === "CollectionDestroyed") {
        await this.deleteCollectionOffers(collectionId);
      }
    }
  }

  private async deleteOffer(offer: OfferEntity) {
    await this.offerService.delete(offer.id);

    await this.runCheckApproved(offer);
  }

  private async runCheckApproved(offer: OfferEntity) {
    const { isAllowed } = await this.sdk.token.allowance({
      collectionId: offer.collectionId,
      tokenId: offer.tokenId,
      from: offer.seller,
      to: offer.contract.address,
    });
    console.log('runCheckApproved', isAllowed);
    if (!isAllowed && offer.status === OfferStatus.Opened) {
      await this.offerService.updateStatus(offer.id, OfferStatus.Canceled);
    }

    await this.runContractCheckApproved(offer);
  }

  private async runContractCheckApproved(offer: OfferEntity) {
    console.log('runContractCheckApproved', this.queueIsBusy);
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

    const abi = this.abiByAddress[offer.contract.address];

    const address = this.sdk.options.signer.address;

    const contract = await this.sdk.evm.contractConnect(offer.contract.address, abi);

    const args = {
      address,
      funcName: 'checkApproved',
      gasLimit: 10_000_000,
      args: {
        collectionId: offer.collectionId,
        tokenId: offer.tokenId,
      },
    };

    try {
      await contract.call(args);

      await contract.send.submitWaitResult(args);
    } catch (err) {
      console.log('checkApproved err', err);
    }

    this.queueIsBusy = false;

    if (this.approveQueue.length) {
      this.runCheckApproved(this.approveQueue.shift());
    }
  }

  private async deleteCollectionOffers(collectionId: number) {
    const offers = await this.offerService.getAllByCollection(collectionId);
    // todo delete all by one call in smart-contract
    await Promise.all(offers.map((offer) => this.runCheckApproved(offer)));
  }
}
