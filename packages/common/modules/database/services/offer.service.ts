import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Address } from '@unique-nft/utils';
import { ContractEntity, OfferEntity } from '../entities';
import { Market } from '@app/contracts/assemblies/0/market';
import { OfferStatus } from '../../types';
import { ChainPropertiesResponse } from '@unique-nft/sdk/full';
import { BigNumber } from 'ethers';

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

  async update(
    contract: ContractEntity,
    order: Market.OrderStructOutput,
    status: OfferStatus,
    chain?: ChainPropertiesResponse,
  ): Promise<OfferEntity | null> {
    let offer = await this.offerEntityRepository.findOne({
      where: {
        orderId: order.id,
      },
    });

    if (!offer) {
      if (order.amount === 0) {
        return null;
      }

      offer = this.offerEntityRepository.create();
      offer.id = uuid();
      offer.orderId = order.id;
      offer.collectionId = order.collectionId;
      offer.tokenId = order.tokenId;
      offer.seller = Address.extract.addressNormalized(order.seller);
    }
    const priceOrder: BigNumber = BigNumber.from(order.price);
    const priceDir = parseFloat(priceOrder.toString()) / 10 ** 18;
    offer.priceParsed = parseFloat(priceDir.toFixed(18));
    offer.priceRaw = order.price.toString();
    offer.amount = order.amount;
    offer.contract = contract;
    offer.status = status;

    console.log('save data', offer);
    await this.offerEntityRepository.save(offer);

    return offer;
  }

  async updateStatus(id: string, status: OfferStatus) {
    await this.offerEntityRepository.update({ id }, { status });
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

  getAmount(strNum: string) {
    const result = BigNumber.from(strNum);
    const dividedBy = result.div(BigNumber.from('1000000000000000000'));
    const dividedByFloat = parseFloat(dividedBy.toString());
    const dividedByFixed = dividedByFloat.toFixed(5);

    return dividedByFixed;
  }
}
