/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from "./app/app.module";
import { startMetricsServer } from "@app/common/modules/monitoring";
import { initSentry } from "@app/common/modules/sentry";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  initSentry(app);
  await startMetricsServer(app);
  Logger.log(
    `🚀 Application is running`
  );
}

bootstrap();
