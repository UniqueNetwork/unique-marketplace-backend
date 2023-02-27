import { ConfigModule } from '@nestjs/config';
import { loadConfig } from './load.config';

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
  //  todo - implement
  validate: undefined,
});
