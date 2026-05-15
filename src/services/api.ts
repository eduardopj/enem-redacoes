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
  token?: string;
};

/** Thrown when the server responds with a non-2xx HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Global 401 handler ───────────────────────────────────────────────────────
// Register once from _layout.tsx to redirect the user to login when their
// authenticated token is rejected by the server.

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

// ─── In-flight request deduplication ─────────────────────────────────────────
// If two callers hit the same GET URL simultaneously, share the same Promise
// instead of firing two identical network requests. Keyed by method+url.
// Only deduplicates GET requests — mutations (POST/PUT/DELETE) always fire.

const inFlight = new Map<string, Promise<unknown>>();

// ─────────────────────────────────────────────────────────────────────────────

function getFriendlyNetworkMessage(error: unknown) {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'A solicitação demorou mais que o esperado. Verifique a conexão e tente novamente.';
  }
  return 'Não foi possível conectar ao servidor. Verifique a internet e tente novamente.';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';

  // Deduplicate simultaneous identical GET requests (e.g. multiple components syncing at once)
  if (method === 'GET' && !options.token) {
    const key = path;
    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;
    const promise = _apiRequest<T>(path, options).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  return _apiRequest<T>(path, options);
}

async function _apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
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
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch (fetchError) {
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';
      const msg = getFriendlyNetworkMessage(fetchError);
      throw Object.assign(new Error(msg), {
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      });
    }

    let payload: ApiResponse<T> | T | undefined;

    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (!response.ok) {
      const apiError = payload as ApiResponse<T> | undefined;
      const message =
        apiError?.error?.message || `O servidor retornou erro ${response.status}. Tente novamente.`;
      const code = apiError?.error?.code;

      // Trigger global logout only when an *authenticated* request (with token) gets 401
      if (response.status === 401 && options.token) {
        unauthorizedHandler?.();
      }

      throw new ApiError(response.status, message, code);
    }

    const apiPayload = payload as ApiResponse<T> | undefined;
    if (apiPayload && typeof apiPayload === 'object' && 'success' in apiPayload) {
      if (!apiPayload.success) {
        throw new ApiError(
          200,
          apiPayload.error?.message ?? 'Não foi possível concluir a solicitação.',
          apiPayload.error?.code,
        );
      }
      return apiPayload.data as T;
    }

    return payload as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
