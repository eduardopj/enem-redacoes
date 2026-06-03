import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestStore {
  requestId: string;
}

/**
 * AsyncLocalStorage para propagar o requestId pelo chain async inteiro.
 * Definido no middleware do Express e lido automaticamente pelo logger.
 *
 * Uso no middleware:
 *   requestContext.run({ requestId: req.requestId }, next);
 *
 * Leitura em qualquer service/util:
 *   getRequestId() → string | '-'
 */
export const requestContext = new AsyncLocalStorage<RequestStore>();

export function getRequestId(): string {
  return requestContext.getStore()?.requestId ?? '-';
}
