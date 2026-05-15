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
};

if (!env.openAiApiKey) {
  console.warn('OPENAI_API_KEY não encontrada no backend/.env');
}
if (!env.smtpHost) {
  console.warn('SMTP_HOST não configurado — recuperação de senha por e-mail desabilitada.');
}
