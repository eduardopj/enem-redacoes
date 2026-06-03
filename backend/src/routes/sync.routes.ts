import { existsSync } from 'node:fs';
import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  getEssayById,
  getEssayImagePath,
  getEssaysByTeacher,
  getTurmaByCode,
  IMAGES_DIR,
  updateTeacherEval,
  upsertEssay,
  upsertTurma,
} from '../services/sync.service.js';
import {
  GetEssaysByTeacherSchema,
  TeacherEvalSchema,
  UpsertEssaySchema,
  UpsertTurmaSchema,
} from '../validators/sync.validators.js';
import { join, resolve, sep } from 'node:path';

const router: RouterType = Router();

function sendError(res: Response, status: number, code: string, message: string): Response {
  return res.status(status).json({
    success: false,
    requestId: res.req?.requestId,
    error: { code, message },
  });
}

// ── Student/teacher pushes corrected essay ───────────────────────────────────
router.post('/essays', validateBody(UpsertEssaySchema), async (req: Request, res: Response) => {
  // IDOR fix: reject if body teacherId doesn't match the authenticated teacher
  if ((req.body as { teacherId: string }).teacherId !== req.teacherId) {
    return sendError(res, 403, 'FORBIDDEN', 'teacherId não confere com o token.');
  }
  try {
    const result = await upsertEssay(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[sync] upsertEssay error:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

// ── Teacher registers turma join code ────────────────────────────────────────
router.post('/turmas', validateBody(UpsertTurmaSchema), (req: Request, res: Response) => {
  // IDOR fix: validate body teacherId matches token
  if ((req.body as { teacherId: string }).teacherId !== req.teacherId) {
    return sendError(res, 403, 'FORBIDDEN', 'teacherId não confere com o token.');
  }
  try {
    res.json({ success: true, data: upsertTurma(req.body) });
  } catch (err) {
    console.error('[sync] upsertTurma error:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

// ── Student looks up turma by join code (public) ─────────────────────────────
router.get('/turmas/by-code/:code', (req: Request, res: Response) => {
  const code = String(req.params.code ?? '').toUpperCase();
  if (!code || code.length < 6) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CODE', message: 'Código inválido. Verifique com seu professor.' },
    });
  }
  try {
    const turma = getTurmaByCode(code);
    if (!turma) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Código inválido ou expirado.' },
      });
    }
    res.json({ success: true, data: turma });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

// ── Teacher fetches paginated essays ─────────────────────────────────────────
// IDOR fix: req.teacherId from auth token — ignores any teacherId query param
router.get('/essays', validateQuery(GetEssaysByTeacherSchema), (req: Request, res: Response) => {
  try {
    const result = getEssaysByTeacher(req.teacherId, {
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit as number | undefined,
    });
    // Weak ETag based on newest syncedAt + page size — cheap to compute, avoids re-parsing
    const firstItem = result.data[0] as { syncedAt?: string } | undefined;
    const etag = `"${firstItem?.syncedAt ?? '0'}-${result.data.length}-${result.hasMore}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.set('ETag', etag);
    res.set('Cache-Control', 'private, no-cache');
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[sync] getEssaysByTeacher error:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

// ── Get single essay ─────────────────────────────────────────────────────────
router.get('/essays/:id', (req: Request, res: Response) => {
  try {
    const essay = getEssayById(req.params.id as string);
    if (!essay) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Redação não encontrada.' },
      });
    }
    // IDOR: only the owning teacher may fetch this essay
    if ((essay as { teacherId: string }).teacherId !== req.teacherId) {
      return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');
    }
    res.json({ success: true, data: essay });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

// ── Serve backed-up essay image ──────────────────────────────────────────────
router.get('/images/:id', (req: Request, res: Response) => {
  try {
    const essay = getEssayById(req.params.id as string);
    if (!essay) return sendError(res, 404, 'NOT_FOUND', 'Redação não encontrada.');
    if ((essay as { teacherId: string }).teacherId !== req.teacherId) return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');

    const imagePath = getEssayImagePath(req.params.id as string);
    if (!imagePath) return sendError(res, 404, 'NOT_FOUND', 'Imagem não encontrada.');

    // Path traversal protection: reject if resolved path escapes IMAGES_DIR
    const resolvedPath = resolve(imagePath);
    const safeBase = resolve(IMAGES_DIR);
    if (!resolvedPath.startsWith(safeBase + sep)) {
      return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');
    }

    if (!existsSync(resolvedPath)) return sendError(res, 404, 'NOT_FOUND', 'Imagem não encontrada.');
    // Images are write-once — cache aggressively; Express sendFile handles ETag + 304 automatically
    res.set('Cache-Control', 'private, max-age=86400, immutable');
    res.sendFile(resolvedPath);
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

// ── Teacher adds/updates eval ────────────────────────────────────────────────
router.put('/essays/:id/teacher-eval', validateBody(TeacherEvalSchema), (req: Request, res: Response) => {
  try {
    // Verify ownership before updating
    const essay = getEssayById(req.params.id as string);
    if (!essay) return sendError(res, 404, 'NOT_FOUND', 'Redação não encontrada.');
    if ((essay as { teacherId: string }).teacherId !== req.teacherId) return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');

    const { teacherScore, teacherNote } = req.body as { teacherScore?: number | null; teacherNote?: string | null };
    res.json({ success: true, data: updateTeacherEval(req.params.id as string, teacherScore ?? null, teacherNote ?? null) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: (err as Error).message } });
  }
});

export { router as syncRoutes };
