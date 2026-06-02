import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.teacherId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token de autenticação ausente.' });
  }
  return next({ ctx: { ...ctx, teacherId: ctx.teacherId } });
});
