import { ArgumentMetadata, HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { ParseOffersFilterPipeOptions, TransformationResult } from '../../offers/pipes/offer-filter.pipe';
import { SortingRequest } from '@app/common/modules/types/requests';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { UntypedRequest } from '@app/common/modules/types';
import { SortingOrder } from '../../offers/interfaces/offers.interface';

@Injectable()
export class ParseSortTradeFilterPipe implements PipeTransform<any, TransformationResult<SortingRequest>> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() options?: ParseOffersFilterPipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  transform(value: UntypedRequest<SortingRequest>, metadata: ArgumentMetadata): TransformationResult<SortingRequest> {
    if (metadata?.metatype?.name !== 'SortingRequest') {
      return value;
    }

    if (typeof value.sort === 'string') {
      const arrayParams = (value.sort as string).split(',').filter((v) => !!v);
      const sortedOffers = arrayParams.map((soring) => {
        return {
          column: (soring as string).split('(')[1].replace(')', ''),
          order: (soring as string).startsWith('asc') ? SortingOrder.Asc : SortingOrder.Desc,
        };
      });
      return {
        sort: sortedOffers,
      };
    }
  }
}
