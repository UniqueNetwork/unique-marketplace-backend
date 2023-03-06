/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { startMetricsServer } from "@app/common/modules/monitoring";
import { initSentry } from "@app/common/modules/sentry";
import { PgTransportStrategy } from "@app/common/pg-transport/pg-transport.strategy";
import { loadConfig } from "@app/common/modules/config";
import { pgNotifyClient } from "@app/common/pg-transport/pg-notify-client.symbol";

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new PgTransportStrategy(
      loadConfig().database, // todo take from app context? const client: PgClient = (dataSource.driver as PostgresDriver).master._clients[0];
    ),
  });
  app.enableShutdownHooks();
  initSentry(app);
  await startMetricsServer(app);
  await app.listen();
  // app.get(pgNotifyClient).emit('new-collection-added', {collectionId: 12}); // todo uncomment for debug
  Logger.log(
    `🚀 Application is running`
  );
}

bootstrap();
