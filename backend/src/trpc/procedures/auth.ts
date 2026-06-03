import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init.js';
import {
  registerTeacher,
  loginTeacher,
  revokeToken,
  savePushToken,
} from '../../services/auth.service.js';

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      teacherId:    z.string().min(1).max(100),
      teacherEmail: z.string().max(254).optional().or(z.literal('')),
      teacherName:  z.string().min(1).max(200),
      passwordHash: z.string().length(64).optional(),
    }))
    .mutation(async ({ input }) => {
      const token = await registerTeacher(input.teacherId, input.teacherEmail ?? '', input.teacherName, input.passwordHash);
      if (token === null) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta.' });
      return { token };
    }),

  login: publicProcedure
    .input(z.object({
      email:        z.string().email().max(254),
      passwordHash: z.string().length(64),
    }))
    .mutation(async ({ input }) => {
      const result = await loginTeacher(input.email, input.passwordHash);
      if (!result) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha incorretos.' });
      return result;
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.rawToken) await revokeToken(ctx.rawToken);
      return { ok: true };
    }),

  savePushToken: protectedProcedure
    .input(z.object({ pushToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await savePushToken(ctx.teacherId!, input.pushToken);
      return { ok: true };
    }),
});
