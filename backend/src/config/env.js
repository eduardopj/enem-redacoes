import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 3333),
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '32mb',

  // E-mail transacional — configure via .env (SMTP, Gmail, Resend, etc.)
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'ENEM IA <no-reply@enemredacoes.app>',

  // Optional Redis URL — when set, rate limiters use Redis instead of in-memory
  // Example: redis://localhost:6379 or rediss://user:pass@host:6380
  redisUrl: process.env.REDIS_URL || '',

  // Optional S3 image storage — when set, images are uploaded to S3 instead of local filesystem
  // Requires: S3_BUCKET, S3_REGION, and either IAM role or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
  s3Bucket:    process.env.S3_BUCKET    || '',
  s3Region:    process.env.S3_REGION    || 'us-east-1',
  s3KeyPrefix: process.env.S3_KEY_PREFIX || 'essays/',
  // Optional CloudFront domain — when set, public image URLs use CDN instead of S3 directly
  cdnDomain:   process.env.CDN_DOMAIN   || '',

  // PostgreSQL connection — when set, use PostgreSQL instead of SQLite (requires migration)
  databaseUrl: process.env.DATABASE_URL || '',
};

if (!env.openAiApiKey) {
  console.warn('OPENAI_API_KEY não encontrada no backend/.env');
}
if (!env.smtpHost) {
  console.warn('SMTP_HOST não configurado — recuperação de senha por e-mail desabilitada.');
}
