import * as Sentry from '@sentry/node';
import { httpIntegration } from '@sentry/node';

const DSN = process.env.SENTRY_DSN;
const ENV = process.env.NODE_ENV ?? 'development';

export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    tracesSampleRate: ENV === 'production' ? 0.2 : 0,
    profilesSampleRate: ENV === 'production' ? 0.1 : 0,
    integrations: [httpIntegration({ breadcrumbs: true })],
  });
}

export function captureException(err, context = {}) {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(err);
  });
}

/** Record AI correction wall-clock time in milliseconds. */
export function trackCorrectionDuration(durationMs) {
  if (!DSN) return;
  Sentry.metrics.distribution('correction.duration_ms', durationMs, {
    unit: 'millisecond',
    tags: { env: ENV },
  });
}

/** Increment retry counter for a single correction attempt. */
export function trackRetry(essayId) {
  if (!DSN) return;
  Sentry.metrics.increment('correction.retry', 1, {
    tags: { env: ENV, essayId },
  });
}

export { Sentry };
