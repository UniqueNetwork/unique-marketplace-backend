import { ArgumentMetadata, BadRequestException, HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { OffersFilter } from '../dto/offers.dto';
import { ErrorHttpStatusCode, HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';

export type UntypedRequest<T> = {
  [key in keyof T]: T[key] extends Array<infer V>
    ? string[]
    : T[key] extends Array<infer V> | undefined
    ? string[]
    : T[key] extends Array<infer V> | null
    ? string[]
    : string;
};

export interface ParseOffersFilterPipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
}

export type QueryParamArray = string | string[] | undefined;

export function parseCollectionIdRequest(collectionId: QueryParamArray): number[] {
  return parseIntArrayRequest(collectionId, (v) => {
    throw new BadRequestException(
      {},
      `Failed to parse collection id from ${JSON.stringify(collectionId)}, unable to parse ${v} as integer.`,
    );
  });
}
const regex = /\S/;
export function nullOrWhitespace(str: string | null | undefined): boolean {
  return str == null || !regex.test(str);
}

export type TransformationResult<T> = UntypedRequest<T> | T;

/**
 * Parses the incoming (typeOf request === QueryParamArray) into an number array
 * @param {QueryParamArray} request - Has different types QueryParamArray
 * @param {Function} onError - anonymous function
 * @see QueryParamArray
 * @see parseIntRequest
 */
export function parseIntArrayRequest(request: QueryParamArray, onError: (badValue: string) => void): number[] {
  return requestArray(request)
    .map((v) => parseIntRequest(v, () => onError(v)))
    .filter((v) => v != null) as number[];
}

export function parseIntRequest(value: string | undefined | null, onError: () => void): number | undefined {
  if (nullOrWhitespace(value)) {
    return undefined;
  }

  const int = parseInt(value as string);
  if (Number.isNaN(int) || !Number.isFinite(int)) {
    onError();
  }
  return int;
}

/**
 * Parse incoming strings into an array of strings
 * @param {String} request
 * @return {Array}
 */
export function requestArray(request: string | string[] | undefined | null): string[] {
  if (Array.isArray(request)) {
    return request;
  }

  if (request == null) {
    return [];
  }

  return [request];
}

@Injectable()
export class ParseOffersFilterPipe implements PipeTransform<any, TransformationResult<OffersFilter>> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() options?: ParseOffersFilterPipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  transform(value: UntypedRequest<OffersFilter>, metadata: ArgumentMetadata): TransformationResult<OffersFilter> {
    if (metadata?.metatype?.name !== 'OffersFilter') {
      return value;
    }

    // return new OffersFilter({
    //   collectionId: parseCollectionIdRequest(value.collectionId),
    //   maxPrice: parseBigIntRequest(value.maxPrice, () => {
    //     throw this.exceptionFactory(`Failed to parse maxPrice. Expected a big integer value, got ${value.maxPrice}`);
    //   }),
    //   minPrice: parseBigIntRequest(value.minPrice, () => {
    //     throw this.exceptionFactory(`Failed to parse minPrice. Expected a big integer value, got ${value.minPrice}`);
    //   }),
    //   searchLocale: value.searchLocale,
    //   searchText: value.searchText,
    //   seller: value.seller,
    //   numberOfAttributes: requestArray(value.numberOfAttributes)
    //     .map((id) =>
    //       parseIntRequest(id, () => {
    //         throw this.exceptionFactory(
    //           `Failed to parse traits count. Expected an array of integers, got ${JSON.stringify(value.numberOfAttributes)}`,
    //         );
    //       }),
    //     )
    //     .filter((id) => id != null) as number[],
    //   attributes: requestArray(value.attributes).filter((id) => id != null) as string[],
    //   bidderAddress: value.bidderAddress,
    //   isAuction: value?.isAuction || null,
    // });
  }
}
