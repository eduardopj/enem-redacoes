/**
 * Feature flags do backend — governados por variáveis de ambiente.
 * Sem dependência externa: lê process.env no startup.
 */

const bool = (key, defaultOn) => {
  const val = process.env[key];
  if (val === undefined) return defaultOn;
  return val !== 'false' && val !== '0';
};

export const flags = {
  /** Backup automático do banco — desabilitar temporariamente com FEATURE_BACKUP=false */
  enableBackup: bool('FEATURE_BACKUP', true),
  /** Push notifications via Expo — requer pushToken salvo */
  enablePushNotifications: bool('FEATURE_PUSH_NOTIFICATIONS', true),
  /** Armazenamento de imagens no S3 — requer S3_BUCKET configurado */
  enableS3Storage: bool('FEATURE_S3', !!process.env.S3_BUCKET),
  /** Rate limiting via Redis — requer REDIS_URL */
  enableRedisRateLimit: bool('FEATURE_REDIS_RATE_LIMIT', !!process.env.REDIS_URL),
  /** Salvar redações para pesquisa/treinamento */
  enableResearch: bool('FEATURE_RESEARCH', true),
  /** Swagger UI em /docs — desabilitar em produção sensível */
  enableApiDocs: bool('FEATURE_API_DOCS', true),
};
