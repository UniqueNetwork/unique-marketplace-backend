import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ContractEntity, OfferEntity } from '../entities';
import { Market } from '@app/contracts/assemblies/0/market';
import { OfferStatus } from '../../types';

@Injectable()
export class OfferService {
  constructor(
    @InjectRepository(OfferEntity)
    private offerEntityRepository: Repository<OfferEntity>,
  ) {}

  async delete(id: string) {
    await this.offerEntityRepository.delete({
      id,
    });
  }

  async update(contract: ContractEntity, order: Market.OrderStructOutput, status: OfferStatus): Promise<OfferEntity | null> {
    let offer = await this.offerEntityRepository.findOne({
      where: {
        orderId: order.id,
      },
    });

    if (!offer) {
      if (order.amount === 0) {
        return null;
      }

      const isEthereumSeller = order.seller.eth && order.seller.eth != '0x0000000000000000000000000000000000000000';

      offer = this.offerEntityRepository.create();
      offer.id = uuid();
      offer.orderId = order.id;
      offer.collectionId = order.collectionId;
      offer.tokenId = order.tokenId;
      offer.seller = isEthereumSeller ? order.seller.eth : order.seller.sub.toHexString();
      offer.status = OfferStatus.Opened;
    } else {
      offer.status = status;
    }

    offer.priceParsed = order.price.toBigInt();
    offer.priceRaw = order.price.toString();
    offer.amount = order.amount;
    offer.contract = contract;

    await this.offerEntityRepository.save(offer);

    return offer;
  }

  async find(collectionId: number, tokenId: number): Promise<OfferEntity | null> {
    return this.offerEntityRepository.findOne({
      where: {
        collectionId,
        tokenId,
      },
      relations: ['contract'],
    });
  }

  async getAllByCollection(collectionId: number): Promise<OfferEntity[]> {
    return this.offerEntityRepository.find({
      where: {
        collectionId,
      },
    });
  }
}
