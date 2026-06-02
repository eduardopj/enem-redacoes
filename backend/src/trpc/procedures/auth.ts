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
    .mutation(({ input }) => {
      const token = (registerTeacher as Function)(input.teacherId, input.teacherEmail, input.teacherName, input.passwordHash);
      if (token === null) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta.' });
      return { token: token as string };
    }),

  login: publicProcedure
    .input(z.object({
      email:        z.string().email().max(254),
      passwordHash: z.string().length(64),
    }))
    .mutation(({ input }) => {
      const result = (loginTeacher as Function)(input.email, input.passwordHash);
      if (!result) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha incorretos.' });
      return result as { teacherId: string; teacherEmail: string; token: string };
    }),

  logout: protectedProcedure
    .mutation(({ ctx }) => {
      if (ctx.rawToken) (revokeToken as Function)(ctx.rawToken);
      return { ok: true };
    }),

  savePushToken: protectedProcedure
    .input(z.object({ pushToken: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      (savePushToken as Function)(ctx.teacherId, input.pushToken);
      return { ok: true };
    }),
});
