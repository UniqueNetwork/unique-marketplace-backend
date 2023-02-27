import { INestApplication, Logger } from '@nestjs/common';
import bootstrap from "./bootstrap";


let app: INestApplication;
const logger = new Logger('NestApplication', { timestamp: true });

/**
 * Shutdown the application.
 */
bootstrap(app, logger).catch((error: unknown) => {
  logger.error(`API bootstrapping application failed! ${error}`);
});

/**
 * GracefulShutdown
 */
async function gracefulShutdown(app): Promise<void> {
  if (app !== undefined) {
    await app.close();
    logger.warn(`API application closed!`);
  }
  process.exit(0);
}

/**
 * Handle the SIGINT signal.
 */
process.once('SIGTERM', async () => {
  logger.warn(`SIGTERM: API graceful shutdown... `);
  await gracefulShutdown(app);
});

/**
 * Handle the SIGINT signal.
 */
process.once('SIGINT', async () => {
  logger.warn(`SIGINT: API graceful shutdown... `);
  await gracefulShutdown(app);
});
