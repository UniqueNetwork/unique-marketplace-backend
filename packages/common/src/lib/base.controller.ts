import { ConfigService } from '@nestjs/config';

export class BaseController<T> {
  constructor() {}
  async routeLablel() {
    return {
      routingLabels: {
        limitLabel: 'page-size', // default: limit
        pageLabel: 'current-page', //default: page
      },
    };
  }
}
