import { ArgumentMetadata, BadRequestException, HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { OffersFilter } from '../dto/offers.dto';
import { ErrorHttpStatusCode, HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { UntypedRequest } from '@app/common/modules/types';
import { QueryParamArray } from '@app/common/src'

export interface ParseOffersFilterPipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
}

const regex = /\S/;

export function nullOrWhitespace(str: string | null | undefined): boolean {
  return str == null || !regex.test(str);
}

export type TransformationResult<T> = UntypedRequest<T> | T;

@Injectable()
export class ParseOffersFilterPipe implements PipeTransform<any, TransformationResult<OffersFilter>> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() options?: ParseOffersFilterPipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  /**
   * Convert all incoming data to the new format.
   * And also change the string to an array where necessary.
   * @param {UntypedRequest<OffersFilter>} value
   * @param {ArgumentMetadata} metadata
   */
  transform(value: UntypedRequest<OffersFilter>, metadata: ArgumentMetadata): TransformationResult<OffersFilter> {
    if (metadata?.metatype?.name !== 'OffersFilter') {
      return value;
    }

    return {
      collectionId: this.parseCollectionIdRequest(value.collectionId),
      maxPrice: this.parseNumberRequest(value.maxPrice, () => {
        throw this.exceptionFactory(`Failed to parse maxPrice. Expected a big integer value, got ${value.maxPrice}`);
      }),
      minPrice: this.parseNumberRequest(value.minPrice, () => {
        throw this.exceptionFactory(`Failed to parse minPrice. Expected a big integer value, got ${value.minPrice}`);
      }),
      searchLocale: value.searchLocale,
      searchText: value.searchText,
      seller: value.seller,
      numberOfAttributes: this.requestArray(value.numberOfAttributes)
        .map((id) =>
          this.parseIntRequest(id, () => {
            throw this.exceptionFactory(
              `Failed to parse traits count. Expected an array of integers, got ${JSON.stringify(value.numberOfAttributes)}`,
            );
          }),
        )
        .filter((id) => id != null) as number[],
      attributes: this.requestArray(value.attributes).filter((id) => id != null) as string[],
    };
  }

  parseBigIntRequest(request: string | undefined, onError: () => void): bigint | undefined {
    if (request === undefined || request === null) {
      return undefined;
    }
    try {
      return BigInt(request);
    } catch (e) {
      onError();
    }
  }

  parseNumberRequest(request: string | undefined, onError: () => void): number | undefined {
    if (request === undefined || request === null) {
      return undefined;
    }
    try {
      return parseFloat(request);
    } catch (e) {
      onError();
    }
  }

  parseIntArrayRequest(request: QueryParamArray, onError: (badValue: string) => void): number[] {
    return this.requestArray(request)
      .map((v) => this.parseIntRequest(v, () => onError(v)))
      .filter((v) => v != null) as number[];
  }

  requestArray(request: string | string[] | undefined | null): string[] {
    if (Array.isArray(request)) {
      return request;
    }

    if (request == null) {
      return [];
    }

    return [request];
  }

  parseCollectionIdRequest(collectionId: QueryParamArray): number[] {
    return this.parseIntArrayRequest(collectionId, (v) => {
      throw new BadRequestException(
        {},
        `Failed to parse collection id from ${JSON.stringify(collectionId)}, unable to parse ${v} as integer.`,
      );
    });
  }

  parseIntRequest(value: string | undefined | null, onError: () => void): number | undefined {
    if (nullOrWhitespace(value)) {
      return undefined;
    }

    const int = parseInt(value as string);
    if (Number.isNaN(int) || !Number.isFinite(int)) {
      onError();
    }
    return int;
  }
}
