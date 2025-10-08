import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { Helpers } from 'graphile-worker';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyEntity } from '@app/common/modules/database';
import { loadConfig } from '@app/common/modules/config';

@Injectable()
@Task('refreshCurrenciesRates')
export class CurrenciesRatesTask {
  private logger = new Logger(CurrenciesRatesTask.name);

  private apiKey: string;

  constructor(
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
  ) {
    const config = loadConfig()
    this.apiKey = config.coingeckoApiKey || '';
  }

  @TaskHandler()
  async handler(_: unknown, helpers: Helpers): Promise<void> {
    this.logger.log('Starting refreshCurrenciesRates task');
    if (!this.apiKey) {
      this.logger.error('CoinGecko API key is not set. Skipping task.');
      return;
    }

    try {
      const currencies = await this.getCurrenciesList();
      const coingeckoIds = currencies.map((c) => c.coingeckoId).filter((id): id is string => !!id);

      const rates = await this.fetchRates(coingeckoIds);
      this.logger.log(`Fetched rates: ${JSON.stringify(rates)}`);

      for (const currency of currencies) {
        const newPrice = rates[currency.coingeckoId!];
        if (newPrice !== undefined && currency.usdPrice !== newPrice) {
          this.logger.log(`Updating currency ${currency.name} (${currency.coingeckoId}) price from ${currency.usdPrice} to ${newPrice}`);

          currency.usdPrice = newPrice;
          currency.updatedAt = new Date();

          await this.currencyRepository.save(currency);
        }
      }
    } catch (error) {
      this.logger.error(`Error in refreshCurrenciesRates task: ${error.message}`, error.stack);
      // throw error;
    }
  }

  private async getCurrenciesList() {
    const currencies = await this.currencyRepository.find();

    return currencies.filter((c) => !!c.coingeckoId);
  }

  private async fetchRates(coingeckoIds: string[]): Promise<Record<string, number>> {
    if (coingeckoIds.length === 0) {
      this.logger.warn('No coingeckoIds provided for fetching rates');
      return {};
    }

    const url = new URL('https://api.coingecko.com');
    url.pathname = '/api/v3/simple/price';
    url.searchParams.append('vs_currencies', 'usd');
    url.searchParams.append('ids', coingeckoIds.join(','));

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': this.apiKey,
      },
    };

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Coingecko HTTP error! status: ${response.status}`);

    const data = await response.json();

    const rates: Record<string, number> = {};

    for (const id of coingeckoIds) {
      const price = data[id]?.usd;
      if (price !== undefined) {
        rates[id] = price;
      } else {
        this.logger.warn(`Price for coingeckoId ${id} not found in response`);
      }
    }

    return rates;
  }
}
