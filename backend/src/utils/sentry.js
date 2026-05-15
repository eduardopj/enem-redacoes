import * as Sentry from '@sentry/node';

const DSN = process.env.SENTRY_DSN;
const ENV = process.env.NODE_ENV ?? 'development';

export function initSentry() {
  if (!DSN) return; // Sentry is opt-in — no DSN = disabled
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    tracesSampleRate: ENV === 'production' ? 0.2 : 0,
  });
}

export function captureException(err, context = {}) {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(err);
  });
}

export { Sentry };
