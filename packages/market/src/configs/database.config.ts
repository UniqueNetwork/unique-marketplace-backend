import { registerAs } from '@nestjs/config';

export default registerAs(
  'database',
  (): Record<string, any> => ({
    url: process.env.POSTGRES_URL,

  }),
);
