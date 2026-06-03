import * as Sentry from '@sentry/node';
import { httpIntegration } from '@sentry/node';

const DSN = process.env.SENTRY_DSN;
const ENV = process.env.NODE_ENV ?? 'development';

export function initSentry(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    tracesSampleRate: ENV === 'production' ? 0.2 : 0,
    profilesSampleRate: ENV === 'production' ? 0.1 : 0,
    integrations: [httpIntegration({ breadcrumbs: true })],
  });
}

export function captureException(err: unknown, context: Record<string, unknown> = {}): void {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(err);
  });
}

/** Record AI correction wall-clock time in milliseconds. */
export function trackCorrectionDuration(durationMs: number): void {
  if (!DSN) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Sentry as any).metrics?.distribution?.('correction.duration_ms', durationMs, { unit: 'millisecond' });
}

/** Increment retry counter for a single correction attempt. */
export function trackRetry(_essayId: string): void {
  if (!DSN) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Sentry as any).metrics?.increment?.('correction.retry', 1, {});
}

export { Sentry };
