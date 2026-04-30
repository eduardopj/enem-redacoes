import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { openAiRoutes } from './routes/openai.routes.js';
import { researchRoutes } from './routes/research.routes.js';
import { syncRoutes } from './routes/sync.routes.js';

const app = express();

function writeLog(level, message, meta = {}) {
  const entry = {
    level,
    message,
    service: 'enem-redacoes-backend',
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

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
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })
);

app.use((req, res, next) => {
  req.requestId = String(req.headers['x-request-id'] || randomUUID());
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.use(express.json({ limit: env.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.requestBodyLimit }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    requestId: req.requestId,
    data: {
      ok: true,
      service: 'enem-redacoes-backend',
      timestamp: new Date().toISOString(),
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

const correctionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: (_req, res) => ({
    success: false,
    requestId: res.req?.requestId,
    error: {
      code: 'RATE_LIMITED',
      message: 'Muitas correções em pouco tempo. Aguarde alguns minutos e tente novamente.',
    },
  }),
});

app.use('/openai/correct-essay', correctionLimiter);
app.use('/openai', openAiRoutes);
app.use('/research', researchRoutes);
app.use('/sync', syncRoutes);

app.use((err, req, res, _next) => {
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
