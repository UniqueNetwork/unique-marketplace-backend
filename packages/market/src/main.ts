import { INestApplication, Logger } from '@nestjs/common';
import bootstrap from './bootstrap';

let app: INestApplication;
const logger = new Logger('NestApplication', { timestamp: true });

/**
 * Shutdown the application.
 */
bootstrap(app, logger).catch((error: unknown) => {
  logger.error(`API bootstrapping application failed! ${error}`);
});
