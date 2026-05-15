import { z } from 'zod';

const INPUT_MODES = ['manuscrita', 'digitada', 'upload'];
const ESSAY_STATUSES = ['pendente', 'processando', 'corrigida', 'precisa_revisao', 'baixa_confiabilidade'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── POST /sync/essays ───────────────────────────────────────────────────────

export const UpsertEssaySchema = z.object({
  id: z
    .string({ required_error: 'id da redação é obrigatório.' })
    .trim()
    .min(1, 'id da redação não pode ser vazio.'),

  teacherId: z
    .string({ required_error: 'teacherId é obrigatório.' })
    .trim()
    .min(1, 'teacherId não pode ser vazio.'),

  studentId: z
    .string({ required_error: 'studentId é obrigatório.' })
    .trim()
    .min(1, 'studentId não pode ser vazio.'),

  studentName: z.string().trim().max(200).optional().nullable(),

  turmaId: z.string().trim().min(1).max(100).optional().nullable(),

  turmaName: z.string().trim().max(200).optional().nullable(),

  themeTitle: z.string().trim().max(300).optional().nullable(),

  inputMode: z.enum(INPUT_MODES).optional().default('manuscrita'),

  essayText: z.string().max(20_000).optional().nullable(),

  status: z.enum(ESSAY_STATUSES).optional().default('corrigida'),

  totalScore: z.number().int().min(0).max(1000).optional().nullable(),

  teacherScore: z.number().int().min(0).max(1000).optional().nullable(),

  teacherNote: z.string().max(5000).optional().nullable(),

  correctionJson: z.record(z.unknown()).optional().nullable(),

  createdAt: z
    .string()
    .datetime({ message: 'createdAt deve ser uma data ISO 8601 válida.' })
    .optional()
    .nullable(),

  correctedAt: z
    .string()
    .datetime({ message: 'correctedAt deve ser uma data ISO 8601 válida.' })
    .optional()
    .nullable(),

  updatedAt: z
    .string()
    .datetime({ message: 'updatedAt deve ser uma data ISO 8601 válida.' })
    .optional()
    .nullable(),

  // Optional image backup — base64-encoded, max ~10MB before encoding
  imageBase64: z.string().max(15_000_000).optional().nullable(),
  imageMimeType: z.enum(IMAGE_MIME_TYPES).optional().nullable(),

  submittedByStudent: z.boolean().optional().default(false),
});

// ─── POST /sync/turmas ───────────────────────────────────────────────────────

export const UpsertTurmaSchema = z.object({
  joinCode: z
    .string({ required_error: 'joinCode é obrigatório.' })
    .trim()
    .min(6, 'joinCode deve ter pelo menos 6 caracteres.')
    .max(20, 'joinCode não pode ter mais de 20 caracteres.')
    .toUpperCase(),

  teacherId: z
    .string({ required_error: 'teacherId é obrigatório.' })
    .trim()
    .min(1, 'teacherId não pode ser vazio.'),

  teacherName: z.string().trim().max(200).optional().default(''),

  teacherEmail: z
    .string()
    .trim()
    .email('teacherEmail deve ser um e-mail válido.')
    .optional()
    .default(''),

  turmaId: z
    .string({ required_error: 'turmaId é obrigatório.' })
    .trim()
    .min(1, 'turmaId não pode ser vazio.'),

  turmaName: z.string().trim().max(200).optional().default(''),
});

// ─── GET /sync/essays?cursor=...&limit=... ───────────────────────────────────

export const GetEssaysByTeacherSchema = z.object({
  // teacherId is ignored (we use req.teacherId from the auth token) — kept for
  // backward-compat so old clients that still send it don't get a 400 error
  teacherId: z.string().trim().optional(),

  cursor: z
    .string()
    .datetime({ message: 'cursor deve ser uma data ISO 8601 válida.' })
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1, 'limit deve ser pelo menos 1.')
    .max(200, 'limit não pode exceder 200.')
    .optional()
    .default(50),
});

// ─── PUT /sync/essays/:id/teacher-eval ──────────────────────────────────────

export const TeacherEvalSchema = z.object({
  teacherScore: z.number().int().min(0).max(1000).optional().nullable(),
  teacherNote: z.string().max(5000).optional().nullable(),
});
