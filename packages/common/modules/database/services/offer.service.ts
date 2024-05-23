import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Address } from '@unique-nft/utils';
import { ContractEntity, OfferEntity } from '../entities';
import { OfferStatus } from '../../types';
import { ChainPropertiesResponse } from '@unique-nft/sdk/full';
import { Market } from '../../../../contracts/assemblies/3/market';
import { formatCrossAccount } from '../../../src/lib/utils';

interface FindOptions {
  contract?: ContractEntity;
  status?: OfferStatus;
}

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
    let offer = await this.offerEntityRepository.findOneBy({
      contract: {
        address: contract.address,
      },
      orderId: Number(order.id),
    });

    if (!offer) {
      if (order.amount === 0n) {
        return null;
      }

      offer = this.offerEntityRepository.create();
      offer.id = uuid();
      offer.orderId = Number(order.id);
      offer.collectionId = Number(order.collectionId);
      offer.tokenId = Number(order.tokenId);
      offer.seller = Address.extract.addressNormalized(formatCrossAccount(order.seller));
    }
    const priceOrder = BigInt(order.price);
    const priceDir = parseFloat(priceOrder.toString()) / 10 ** 18;
    offer.priceParsed = parseFloat(priceDir.toFixed(18));
    offer.priceRaw = order.price.toString();
    offer.currency = Number(order.currency);
    offer.amount = Number(order.amount);
    offer.contract = contract;
    offer.status = status;

    await this.offerEntityRepository.save(offer);

    return offer;
  }

  async updateStatus(id: string, status: OfferStatus) {
    await this.offerEntityRepository.update({ id }, { status });
  }

  async find(collectionId: number, tokenId: number, options?: FindOptions): Promise<OfferEntity | null> {
    return this.offerEntityRepository.findOne({
      where: {
        ...options,
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
    const result = BigInt(strNum);
    const dividedBy = result / BigInt('1000000000000000000');
    const dividedByFloat = parseFloat(dividedBy.toString());
    const dividedByFixed = dividedByFloat.toFixed(5);

    return dividedByFixed;
  }
}
