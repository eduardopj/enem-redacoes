import cors from 'cors';
import express from 'express';
import { openAiRoutes } from './routes/openai.routes.js';
import { researchRoutes } from './routes/research.routes.js';
import { syncRoutes } from './routes/sync.routes.js';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/openai', openAiRoutes);
app.use('/research', researchRoutes);
app.use('/sync', syncRoutes);

app.use((err, _req, res, _next) => {
  console.error('Erro global no backend:', err);

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload muito grande. A imagem enviada excede o limite permitido.',
    });
  }

  return res.status(500).json({
    error: err?.message || 'Erro interno no servidor.',
  });
});

export { app };
