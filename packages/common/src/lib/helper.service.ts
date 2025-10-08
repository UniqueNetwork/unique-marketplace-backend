import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryParamArray } from '../types';

@Injectable()
export class HelperService {
  static parseBigIntRequest(request: string | undefined, onError: () => void): bigint | undefined {
    if (request === undefined || request === null) {
      return undefined;
    }
    try {
      return BigInt(request);
    } catch (e) {
      onError();
    }
  }

  static parseNumberRequest(request: string | undefined, onError: () => void): number | undefined {
    if (request === undefined || request === null) {
      return undefined;
    }
    try {
      return parseFloat(request);
    } catch (e) {
      onError();
    }
  }

  static parseIntArrayRequest(request: QueryParamArray, onError: (badValue: string) => void): number[] {
    return this.requestArray(request)
      .map((v) => this.parseIntRequest(v, () => onError(v)))
      .filter((v) => v != null) as number[];
  }

  static requestArray(request: string | string[] | undefined | null): string[] {
    if (Array.isArray(request)) {
      return request;
    }

    if (request == null) {
      return [];
    }

    return [request];
  }

  static parseCollectionIdRequest(collectionId: QueryParamArray): number[] {
    return this.parseIntArrayRequest(collectionId, (v) => {
      throw new BadRequestException(
        {},
        `Failed to parse collection id from ${JSON.stringify(collectionId)}, unable to parse ${v} as integer.`,
      );
    });
  }

  static parseIntRequest(value: string | undefined | null, onError: () => void): number | undefined {
    if (this.nullOrWhitespace(value)) {
      return undefined;
    }

    const int = parseInt(value as string);
    if (Number.isNaN(int) || !Number.isFinite(int)) {
      onError();
    }
    return int;
  }

  static nullOrWhitespace(str: string | null | undefined): boolean {
    const regex = /\S/;
    return str == null || !regex.test(str);
  }

  /**
   * Transforms a price value based on the specified path.
   *
   * @param {number|string|null|undefined} value - The value to transform.
   * @param {string|null|undefined} path - The path to transform the value for. Must be either "to" or "from".
   *
   * @returns {string|bigint|null|undefined} The transformed value. If the path is "to", the value will be returned as a string. If the path is "from", the value will be returned as a BigInt. If the path is not "to" or "from", null will be returned.
   *
   * @throws {TypeError} If the value is not a number, string, null, or undefined.
   * @throws {RangeError} If the value is a string that cannot be parsed as a number.
   */
  static priceTransformer(value, path): string | null | bigint {
    if (typeof value !== 'number' && typeof value !== 'string' && value !== null && value !== undefined) {
      throw new TypeError('Invalid value type. Expected number, string, null, or undefined.');
    }

    if (path !== 'to' && path !== 'from' && path !== null && path !== undefined) {
      throw new TypeError('Invalid path. Must be either "to" or "from".');
    }

    switch (path) {
      case 'to':
        return value?.toString();
      case 'from':
        if (typeof value === 'string') {
          const parsedValue = parseInt(value, 10);
          if (isNaN(parsedValue)) {
            throw new RangeError(`Invalid value. Could not parse "${value}" as a number.`);
          }
          return BigInt(parsedValue);
        } else if (typeof value === 'number') {
          return BigInt(value);
        } else {
          return null;
        }
      default:
        return null;
    }
  }

  static getRawAmount(amount: string, decimals: number): string {
    const [whole, fraction = ''] = amount.split('.');
    const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);

    return whole + fractionPadded;
  }

  static getPriceInUsdt(
    usdtCurrency: { id: number; decimals: number } | null,
    priceInUsdtParsed: string | null,
  ): { parsed: number; raw: string; currency: number } | null {
    if (!priceInUsdtParsed || !usdtCurrency) return null;

    const parsed = +priceInUsdtParsed;
    const raw = HelperService.getRawAmount(priceInUsdtParsed, usdtCurrency.decimals);

    return {
      parsed,
      raw,
      currency: usdtCurrency.id
    }
  }
}
