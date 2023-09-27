import { ArgumentMetadata, HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { OffersFilter } from '../dto/offers.dto';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { UntypedRequest } from '@app/common/modules/types';
import { ParseOffersFilterPipeOptions, TransformationResult } from './offer-filter.pipe';
import { SortingOfferRequest } from '@app/common/modules/types/requests';
import { SortingOrder } from '../interfaces/offers.interface';

@Injectable()
export class ParseSortFilterPipe implements PipeTransform<any, TransformationResult<SortingOfferRequest>> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() options?: ParseOffersFilterPipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  transform(value: UntypedRequest<SortingOfferRequest>, metadata: ArgumentMetadata): TransformationResult<SortingOfferRequest> {
    if (metadata?.metatype?.name !== 'SortingOfferRequest') {
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
