import { Inject, Injectable } from '@nestjs/common';
import { OfferService } from '@app/common/modules/database/services/offer.service';
import { CollectionData, Room, Sdk } from '@unique-nft/sdk';
import { OfferEntity } from '@app/common/modules/database/entities/offer.entity';

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
    const { parsed } = data;

    const { collectionId, tokenId } = parsed;

    if (tokenId) {
      const offer = await this.offerService.find(collectionId, tokenId);
      if (!offer) {
        return;
      }

      if (parsed.event.method === 'ItemDestroyed') {
        await this.deleteOffer(offer);
      }

      if (parsed.event.method === 'Approved') {
        await this.runCheckApproved(offer);
      }

      if (parsed.event.method === 'Transfer') {
        await this.runCheckApproved(offer);
      }
    }
  }

  private async deleteOffer(offer: OfferEntity) {
    await this.offerService.delete(offer.id);

    await this.runCheckApproved(offer);
  }

  private async runCheckApproved(offer: OfferEntity) {
    const abi = this.abiByAddress[offer.contractAddress];

    try {
      // todo update accounts package and use signer.address
      // @ts-ignore
      const address = this.sdk.options.signer.getAddress();
      const contract = await this.sdk.evm.contractConnect(
        offer.contractAddress,
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
    } catch (err) {
      console.log('err', err);
    }
  }
}
