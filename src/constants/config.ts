import Constants from 'expo-constants';

const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim() ?? '';

export const APP_CONFIG = {
  backendUrl: rawBackendUrl.replace(/\/+$/, ''),
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '120000'),
  privacyPolicyUrl:
    (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ??
    'https://enemredacoes.app/privacidade',
};

export function requireBackendUrl() {
  if (!APP_CONFIG.backendUrl) {
    throw new Error('Configure EXPO_PUBLIC_BACKEND_URL no .env do app.');
  }

  return APP_CONFIG.backendUrl;
}
