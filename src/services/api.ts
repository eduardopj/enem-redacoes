import { APP_CONFIG, requireBackendUrl } from '@/constants/config';

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
};

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
};

function getFriendlyNetworkMessage(error: unknown) {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'A solicitação demorou mais que o esperado. Verifique a conexão e tente novamente.';
  }

  return 'Não foi possível conectar ao servidor. Verifique a internet e tente novamente.';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = requireBackendUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? APP_CONFIG.apiTimeoutMs
  );

  try {
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(getFriendlyNetworkMessage(error));
    }

    let payload: ApiResponse<T> | T | undefined;

    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (!response.ok) {
      const apiError = payload as ApiResponse<T> | undefined;
      throw new Error(
        apiError?.error?.message ||
          `O servidor retornou erro ${response.status}. Tente novamente.`
      );
    }

    const apiPayload = payload as ApiResponse<T> | undefined;
    if (apiPayload && typeof apiPayload === 'object' && 'success' in apiPayload) {
      if (!apiPayload.success) {
        throw new Error(apiPayload.error?.message ?? 'Não foi possível concluir a solicitação.');
      }

      return apiPayload.data as T;
    }

    return payload as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
