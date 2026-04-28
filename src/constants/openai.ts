const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://192.168.0.38:3333';

const normalizedBackendUrl = rawBackendUrl.replace(/\/+$/, '');

export const OPENAI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
  model: process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'gpt-4.1-mini',
  timeoutMs: Number(process.env.EXPO_PUBLIC_OPENAI_TIMEOUT_MS ?? '45000'),
  useBackend: true,
  backendUrl: normalizedBackendUrl,
};

