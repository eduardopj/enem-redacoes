import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init.js';
import {
  getEssaysByTeacher,
  getEssayById,
  upsertEssay,
  upsertTurma,
  getTurmaByCode,
  updateTeacherEval,
} from '../../services/sync.service.js';

const EssayInput = z.object({
  id:                 z.string().min(1),
  teacherId:          z.string().min(1),
  studentId:          z.string().min(1),
  studentName:        z.string().max(200).optional().nullable(),
  turmaId:            z.string().max(100).optional().nullable(),
  turmaName:          z.string().max(200).optional().nullable(),
  themeTitle:         z.string().max(300).optional().nullable(),
  inputMode:          z.enum(['manuscrita', 'digitada', 'upload']).optional().default('manuscrita'),
  essayText:          z.string().max(20_000).optional().nullable(),
  status:             z.enum(['pendente', 'processando', 'corrigida', 'precisa_revisao', 'baixa_confiabilidade']).optional().default('corrigida'),
  totalScore:         z.number().int().min(0).max(1000).optional().nullable(),
  teacherScore:       z.number().int().min(0).max(1000).optional().nullable(),
  teacherNote:        z.string().max(5000).optional().nullable(),
  correctionJson:     z.record(z.unknown()).optional().nullable(),
  createdAt:          z.string().datetime().optional().nullable(),
  correctedAt:        z.string().datetime().optional().nullable(),
  updatedAt:          z.string().datetime().optional().nullable(),
  imageBase64:        z.string().max(15_000_000).optional().nullable(),
  imageMimeType:      z.enum(['image/jpeg', 'image/png', 'image/webp']).optional().nullable(),
  submittedByStudent: z.boolean().optional().default(false),
});

export const essaysRouter = router({
  list: protectedProcedure
    .input(z.object({
      cursor: z.string().datetime().optional(),
      limit:  z.coerce.number().int().min(1).max(200).optional().default(50),
    }))
    .query(({ ctx, input }) =>
      getEssaysByTeacher(ctx.teacherId!, { cursor: input.cursor, limit: input.limit })
    ),

  detail: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const essay = await getEssayById(input.id);
      if (!essay) throw new TRPCError({ code: 'NOT_FOUND', message: 'Redação não encontrada.' });
      if ((essay as { teacherId: string }).teacherId !== ctx.teacherId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      return essay;
    }),

  push: protectedProcedure
    .input(EssayInput)
    .mutation(async ({ ctx, input }) => {
      if (input.teacherId !== ctx.teacherId) throw new TRPCError({ code: 'FORBIDDEN', message: 'teacherId não confere com o token.' });
      return upsertEssay(input);
    }),

  updateTeacherEval: protectedProcedure
    .input(z.object({
      id:          z.string().min(1),
      teacherScore: z.number().int().min(0).max(1000).optional().nullable(),
      teacherNote:  z.string().max(5000).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const essay = await getEssayById(input.id);
      if (!essay) throw new TRPCError({ code: 'NOT_FOUND', message: 'Redação não encontrada.' });
      if ((essay as { teacherId: string }).teacherId !== ctx.teacherId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado.' });
      return updateTeacherEval(input.id, input.teacherScore ?? null, input.teacherNote ?? null);
    }),

  upsertTurma: protectedProcedure
    .input(z.object({
      joinCode:     z.string().min(6).max(20).toUpperCase(),
      teacherId:    z.string().min(1),
      teacherName:  z.string().max(200).optional().default(''),
      teacherEmail: z.string().email().optional().default(''),
      turmaId:      z.string().min(1),
      turmaName:    z.string().max(200).optional().default(''),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.teacherId !== ctx.teacherId) throw new TRPCError({ code: 'FORBIDDEN', message: 'teacherId não confere com o token.' });
      return upsertTurma(input);
    }),

  turmaByCode: publicProcedure
    .input(z.object({ code: z.string().min(6).max(20) }))
    .query(async ({ input }) => {
      const turma = await getTurmaByCode(input.code.toUpperCase());
      if (!turma) throw new TRPCError({ code: 'NOT_FOUND', message: 'Código inválido ou expirado.' });
      return turma;
    }),
});
