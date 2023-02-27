import { ConsoleLogger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { CaptureContext } from '@sentry/types';
import { instanceToPlain } from 'class-transformer';
import { getErrorSource } from './utils';

export class SentryLogger extends ConsoleLogger {
  static sendMessage(error: unknown, stack?: string, context?: string): void {
    if (!error) return;

    const data = instanceToPlain(error);

    const captureContext: CaptureContext = {
      extra: { stack, context, ...data },
    };

    if (typeof error === 'string') {
      Sentry.captureMessage(error, captureContext);

      return;
    }

    if (error instanceof Error) {
      captureContext.tags = { 'error.source': getErrorSource(error) };

      Sentry.captureException(error, captureContext);

      return;
    }

    Sentry.captureMessage('Unknown error', captureContext);
  }

  error(message: any, stack?: string, context?: string) {
    SentryLogger.sendMessage(message, stack, context);

    super.error(message, stack, context);
  }
}
