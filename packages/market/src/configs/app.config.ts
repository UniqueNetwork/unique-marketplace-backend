import { registerAs } from '@nestjs/config';
import { version } from '../../../../package.json';

export default registerAs(
  'app',
  (): Record<string, any> => ({
    port: parseInt(process.env.MARKET_PORT) || 5001,
    version,
    market: {
      title: process.env.MARKET_TITLE || 'Marketplace v2',
      siteTitle: process.env.MARKET_SITE_TITLE || 'Unique Marketplace v2',
      tag: process.env.MARKET_TAG || 'Marketplace v2'
    }

  }),
);
