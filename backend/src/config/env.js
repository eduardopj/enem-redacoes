import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 3333),
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '18mb',
};

if (!env.openAiApiKey) {
  console.warn('OPENAI_API_KEY não encontrada no backend/.env');
}
