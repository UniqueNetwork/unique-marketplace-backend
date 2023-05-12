import { ArgumentMetadata, BadRequestException, HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { ErrorHttpStatusCode, HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { nullOrWhitespace, QueryParamArray, TransformationResult, UntypedRequest } from '../../offers/pipes/offer-filter.pipe';
import { TradesFilterDto } from '../dto/create-trade.dto';

export interface ParseTradesFilterPipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
}

@Injectable()
export class ParseTradesFilterPipe implements PipeTransform<any, TransformationResult<TradesFilterDto>> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() options?: ParseTradesFilterPipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  transform(value: UntypedRequest<TradesFilterDto>, metadata: ArgumentMetadata): TransformationResult<TradesFilterDto> {
    if (metadata?.metatype?.name !== 'TradesFilterDto') {
      return value;
    }
    return {
      collectionId: this.parseCollectionIdRequest(value.collectionId),
      tokenId: this.parseCollectionIdRequest(value.tokenId),
      searchText: value.searchText,
      traits: this.requestArray(value.traits).filter((id) => id != null) as string[],
    };
  }

  parseCollectionIdRequest(collectionId: QueryParamArray): number[] {
    return this.parseIntArrayRequest(collectionId, (v) => {
      throw new BadRequestException(
        {},
        `Failed to parse collection id from ${JSON.stringify(collectionId)}, unable to parse ${v} as integer.`,
      );
    });
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
