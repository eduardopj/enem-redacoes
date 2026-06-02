import { router } from './init.js';
import { essaysRouter } from './procedures/essays.js';
import { authRouter } from './procedures/auth.js';

export const appRouter = router({
  essays: essaysRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
