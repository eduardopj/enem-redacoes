import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { requestContext } from './utils/request-context.js';
import { authRoutes } from './routes/auth.routes.js';
import { docsRoutes } from './routes/docs.routes.js';
import { openAiRoutes } from './routes/openai.routes.js';
import { researchRoutes } from './routes/research.routes.js';
import { syncRoutes } from './routes/sync.routes.js';
import db from './services/database.js';
import { getQueueStats } from './utils/correction-queue.js';
import { writeLog } from './utils/logger.js';
import { captureException, Sentry } from './utils/sentry.js';
import { createRateLimitStore } from './utils/rate-limit-store.js';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';

const app = express();

// Trust the immediate upstream proxy (Nginx on the same host).
// Required so express-rate-limit can read X-Forwarded-For safely.
app.set('trust proxy', 1);

// Resolved once at startup — shared across all rate limiters
const rateLimitStore = await createRateLimitStore();

// Security headers — disabled CSP/CORP since this is a pure JSON API consumed by mobile
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Gzip/brotli compression for all JSON responses (saves ~60% bandwidth)
app.use(compression());

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (env.corsOrigins.includes('*')) return true;
  return env.corsOrigins.includes(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Origem não permitida pelo CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })
);

app.use((req, res, next) => {
  req.requestId = String(req.headers['x-request-id'] || randomUUID());
  res.setHeader('X-Request-Id', req.requestId);
  // Propaga requestId para todo o chain async — lido automaticamente pelo logger
  requestContext.run({ requestId: req.requestId }, next);
});

app.use(express.json({ limit: env.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.requestBodyLimit }));

app.get('/health', (req, res) => {
  let dbOk = true;
  try { db.prepare('SELECT 1').get(); } catch { dbOk = false; }
  const ok = dbOk;
  res.set('Cache-Control', 'no-store');
  res.status(ok ? 200 : 503).json({
    success: ok,
    requestId: req.requestId,
    data: {
      ok,
      service: 'enem-redacoes-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      db: dbOk ? 'ok' : 'error',
      queue: getQueueStats(),
    },
  });
});

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    writeLog(res.statusCode >= 500 ? 'error' : 'info', 'request_finished', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
});

// Rate limiters are no-ops in test env to allow unrestricted test runs
const noopMiddleware = (_req, _res, next) => next();
const makeRateLimiter = (opts) =>
  process.env.NODE_ENV === 'test' ? noopMiddleware : rateLimit(opts);

const correctionLimiter = makeRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore,
  message: (_req, res) => ({
    success: false,
    requestId: res.req?.requestId,
    error: {
      code: 'RATE_LIMITED',
      message: 'Muitas correções em pouco tempo. Aguarde alguns minutos e tente novamente.',
    },
  }),
});

// 10 attempts per 15 min per IP — protects register/login against brute-force
const authLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore,
  message: (_req, res) => ({
    success: false,
    requestId: res.req?.requestId,
    error: {
      code: 'RATE_LIMITED',
      message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
    },
  }),
});

// 30 lookups per min per IP for the unauthenticated turma-by-code endpoint
const turmaLookupLimiter = makeRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore,
  message: (_req, res) => ({
    success: false,
    requestId: res.req?.requestId,
    error: {
      code: 'RATE_LIMITED',
      message: 'Muitas tentativas. Tente novamente em breve.',
    },
  }),
});

// /sync/turmas/by-code/:code is public (students join without teacher token).
// All other /sync and /openai routes require Bearer token.
function syncAuth(req, res, next) {
  if (req.method === 'GET' && req.path.startsWith('/turmas/by-code/')) return next();
  return requireAuth(req, res, next);
}

// ── tRPC (typed end-to-end contract, alongside REST for backwards compat) ─────
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// ── Docs (public — no auth, no rate limit) ───────────────────────────────────
app.use('/', docsRoutes);

// ── v1 routes (canonical) ────────────────────────────────────────────────────
app.use('/v1/auth', authLimiter, authRoutes);
app.use('/v1/research', researchRoutes);
app.use('/v1/sync/turmas/by-code', turmaLookupLimiter);
app.use('/v1/sync', syncAuth, syncRoutes);
app.use('/v1/openai/correct-essay', correctionLimiter);
app.use('/v1/openai', requireAuth, openAiRoutes);

// ── Legacy routes (backward-compat for older app builds) ─────────────────────
app.use('/auth', authLimiter, authRoutes);
app.use('/research', researchRoutes);
app.use('/sync/turmas/by-code', turmaLookupLimiter);
app.use('/sync', syncAuth, syncRoutes);
app.use('/openai/correct-essay', correctionLimiter);
app.use('/openai', requireAuth, openAiRoutes);

// Sentry must capture errors before any other error handler sees them
Sentry.setupExpressErrorHandler?.(app);

app.use((err, req, res, _next) => {
  captureException(err, { requestId: req.requestId, path: req.originalUrl });
  writeLog('error', 'unhandled_error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    error: err?.message ?? String(err),
  });

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      requestId: req.requestId,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'A imagem enviada é muito grande. Tire uma nova foto ou reduza o arquivo.',
      },
    });
  }

  return res.status(500).json({
    success: false,
    requestId: req.requestId,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'O servidor não conseguiu concluir a operação. Tente novamente.',
    },
  });
});

export { app };
