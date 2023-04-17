import { Inject, Injectable } from '@nestjs/common';
import { Sdk, CollectionData, Room } from '@unique-nft/sdk/full';
import { OfferService, OfferEntity } from '@app/common/modules/database';

@Injectable()
export class CollectionEventsHandler {
  private abiByAddress: Record<string, any>;

  constructor(
    private readonly sdk: Sdk,
    @Inject(OfferService)
    private readonly offerService: OfferService
  ) {}

  public init(abiByAddress: Record<string, any>) {
    this.abiByAddress = abiByAddress;
  }

  public async onEvent(room: Room, data: CollectionData) {
    const { parsed, event } = data;

    const { collectionId, tokenId } = parsed;

    const { method } = event;

    if (tokenId) {
      const offer = await this.offerService.find(collectionId, tokenId);
      if (!offer) {
        return;
      }

      if (method === 'ItemDestroyed') {
        await this.deleteOffer(offer);
      }

      if (method === 'Approved') {
        await this.runCheckApproved(offer);
      }

      if (method === 'Transfer') {
        await this.runCheckApproved(offer);
      }
    } else {
      if (method === 'CollectionDestroyed') {
        await this.deleteCollectionOffers(collectionId);
      }
    }
  }

  private async deleteOffer(offer: OfferEntity) {
    await this.offerService.delete(offer.id);

    await this.runCheckApproved(offer);
  }

  private async runCheckApproved(offer: OfferEntity) {
    const abi = this.abiByAddress[offer.contract.address];

    const address = this.sdk.options.signer.address;
    const contract = await this.sdk.evm.contractConnect(
      offer.contract.address,
      abi
    );
    const result = await contract.send.submitWaitResult({
      address,
      funcName: 'checkApproved',
      args: {
        collectionId: offer.collectionId,
        tokenId: offer.tokenId,
      },
    });
    console.log('result', JSON.stringify(result, null, 2));
  }

  private async deleteCollectionOffers(collectionId: number) {
    const offers = await this.offerService.getAllByCollection(collectionId);
    // todo delete all by one call in smart-contract
    await Promise.all(offers.map((offer) => this.runCheckApproved(offer)));
  }
}
