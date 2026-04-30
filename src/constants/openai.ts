import { APP_CONFIG } from './config';

export const OPENAI_CONFIG = {
  useBackend: true,
  backendUrl: APP_CONFIG.backendUrl,
  timeoutMs: APP_CONFIG.apiTimeoutMs,
};
