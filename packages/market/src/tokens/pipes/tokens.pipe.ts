import { ArgumentMetadata, HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { ParseOffersFilterPipeOptions, TransformationResult } from '../../offers/pipes/offer-filter.pipe';
import { TokensViewFilterDto } from '../dto/tokens.dto';
import { HelperService } from '@app/common/src/lib/helper.service';
import { UntypedRequest } from '@app/common/modules/types';

@Injectable()
export class ParseTokensFilterPipe implements PipeTransform<any, TransformationResult<TokensViewFilterDto>> {
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
  transform(value: UntypedRequest<TokensViewFilterDto>, metadata: ArgumentMetadata): TransformationResult<TokensViewFilterDto> {
    if (metadata?.metatype?.name !== 'TokensViewFilterDto') {
      return value;
    }

    return {
      tokenId: HelperService.parseCollectionIdRequest(value.tokenId),
      maxPrice: HelperService.parseBigIntRequest(value.maxPrice, () => {
        throw this.exceptionFactory(`Failed to parse maxPrice. Expected a big integer value, got ${value.maxPrice}`);
      }),
      minPrice: HelperService.parseBigIntRequest(value.minPrice, () => {
        throw this.exceptionFactory(`Failed to parse minPrice. Expected a big integer value, got ${value.minPrice}`);
      }),
      searchLocale: value.searchLocale,
      searchText: value.searchText,
      seller: value.seller,
      numberOfAttributes: HelperService.requestArray(value.numberOfAttributes)
        .map((id) =>
          HelperService.parseIntRequest(id, () => {
            throw this.exceptionFactory(
              `Failed to parse traits count. Expected an array of integers, got ${JSON.stringify(value.numberOfAttributes)}`,
            );
          }),
        )
        .filter((id) => id != null) as number[],
      attributes: HelperService.requestArray(value.attributes).filter((id) => id != null) as string[],
    };
  }
}
