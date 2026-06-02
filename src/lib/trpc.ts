/**
 * tRPC client — typed end-to-end via AppRouter from backend/src/trpc/router.ts.
 *
 * The backend router is written in TypeScript (tsx loader) so the `AppRouter`
 * type can be imported directly without code generation. The import is
 * type-only: no backend code runs in the app bundle.
 *
 * Usage:
 *   const essays = await trpc.essays.list.query({ limit: 50 });
 *   const { token } = await trpc.auth.register.mutate({ ... });
 */

import type { AppRouter } from '../../backend/src/trpc/router';
import {
  createTRPCClient,
  httpBatchLink,
  type TRPCClientError,
} from '@trpc/client';
import { APP_CONFIG } from '@/constants/config';
import { useAppStore } from '@/store/app-store';

function getHeaders(): Record<string, string> {
  const token = useAppStore.getState().backendToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${APP_CONFIG.backendUrl}/trpc`,
      headers: getHeaders,
      // Disable request batching for mutations so they fire independently
      maxItems: 10,
    }),
  ],
});

export type { AppRouter, TRPCClientError };
