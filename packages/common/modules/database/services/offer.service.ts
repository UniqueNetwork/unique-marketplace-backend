import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Address } from '@unique-nft/utils';
import { ContractEntity, CurrencyEntity, OfferEntity } from '../entities';
import { OfferStatus } from '../../types';
// TODO: SDK_UPGRADE - Update ChainPropertiesResponse type after @unique-nft/sdk upgrade
import { ChainPropertiesResponse } from '@unique-nft/sdk/full';
import { Market } from '../../../../contracts/assemblies/3/market';
import { formatCrossAccount } from '../../../src/lib/utils';
import { HelperService } from '../../../src/lib/helper.service';

interface FindOptions {
  contract?: ContractEntity;
  status?: OfferStatus;
}

@Injectable()
export class OfferService {
  private logger: Logger = new Logger(OfferService.name);

  constructor(
    @InjectRepository(OfferEntity)
    private offerEntityRepository: Repository<OfferEntity>,

    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
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

    const currencyId = order.currency ? Number(order.currency) : 0;

    const currency = await this.currencyRepository.findOne({
      where: { id: currencyId },
      cache: true
    });

    if (!currency) {
      this.logger.warn(`Currency with id ${currencyId} not found in database`);
    }

    const currencyDecimals = currency?.decimals ?? chain?.decimals ?? 18;

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

    offer.priceParsed = Number(HelperService.getParsedAmount(order.price.toString(), currencyDecimals));
    offer.priceRaw = order.price.toString();
    offer.currency = currencyId;
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
