import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingEntity } from '../entities';
import { CurrencyDto } from '../../../../market/src/contracts/dto/set-currencies.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingEntity)
    private settingEntityRepository: Repository<SettingEntity>,
  ) {}

  private async getValue(key: string): Promise<string | undefined> {
    const entity = await this.settingEntityRepository.findOne({
      where: {
        key,
      },
    });
    return entity?.value;
  }

  private async setValue(key: string, value: string): Promise<void> {
    const currentEntity = await this.settingEntityRepository.findOne({
      where: {
        key,
      },
    });
    if (currentEntity) {
      await this.settingEntityRepository.update(
        {
          key,
        },
        {
          value,
        },
      );
    } else {
      const newEntity = await this.settingEntityRepository.create({
        key,
        value,
      });
      await this.settingEntityRepository.save(newEntity);
    }
  }

  public async getSubscribeCollectionBlock(): Promise<number | undefined> {
    const value = await this.getValue('subscribe_collection_block');
    return value ? +value : undefined;
  }

  public async setSubscribeCollectionBlock(block: number): Promise<void> {
    return this.setValue('subscribe_collection_block', `${block}`);
  }

  public async setContractCurrencies(currencies: CurrencyDto[]): Promise<void> {
    return this.setValue('contract_currencies', JSON.stringify(currencies));
  }

  public async addContractCurrency(currency: CurrencyDto): Promise<void> {
    const currencies = await this.getContractCurrencies();
    const found = currencies.find((c) => c.collectionId === currency.collectionId);
    if (found) {
      found.iconUrl = currency.iconUrl;
      found.decimals = currency.decimals;
      found.fee = currency.fee;
      found.name = currency.name;
    } else {
      currencies.push(currency);
    }
    return this.setContractCurrencies(currencies);
  }

  public async removeContractCurrency(collectionId: number): Promise<void> {
    const currencies = await this.getContractCurrencies();
    const newCurrencies = currencies.filter((c) => c.collectionId !== collectionId);

    return this.setContractCurrencies(newCurrencies);
  }

  public async getContractCurrencies(): Promise<CurrencyDto[]> {
    const value = await this.getValue('contract_currencies');
    return value ? JSON.parse(value) : [];
  }
}
