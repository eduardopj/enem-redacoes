import { existsSync } from 'node:fs';
import { Router } from 'express';
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

const router = Router();

function sendError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    requestId: res.req?.requestId,
    error: { code, message },
  });
}

// ── Student/teacher pushes corrected essay ───────────────────────────────────
router.post('/essays', validateBody(UpsertEssaySchema), async (req, res) => {
  // IDOR fix: reject if body teacherId doesn't match the authenticated teacher
  if (req.body.teacherId !== req.teacherId) {
    return sendError(res, 403, 'FORBIDDEN', 'teacherId não confere com o token.');
  }
  try {
    const result = await upsertEssay(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[sync] upsertEssay error:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

// ── Teacher registers turma join code ────────────────────────────────────────
router.post('/turmas', validateBody(UpsertTurmaSchema), (req, res) => {
  // IDOR fix: validate body teacherId matches token
  if (req.body.teacherId !== req.teacherId) {
    return sendError(res, 403, 'FORBIDDEN', 'teacherId não confere com o token.');
  }
  try {
    res.json({ success: true, data: upsertTurma(req.body) });
  } catch (err) {
    console.error('[sync] upsertTurma error:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

// ── Student looks up turma by join code (public) ─────────────────────────────
router.get('/turmas/by-code/:code', (req, res) => {
  const code = req.params.code?.toUpperCase?.() ?? '';
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
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

// ── Teacher fetches paginated essays ─────────────────────────────────────────
// IDOR fix: req.teacherId from auth token — ignores any teacherId query param
router.get('/essays', validateQuery(GetEssaysByTeacherSchema), (req, res) => {
  try {
    const result = getEssaysByTeacher(req.teacherId, {
      cursor: req.query.cursor,
      limit: req.query.limit,
    });
    // Weak ETag based on newest syncedAt + page size — cheap to compute, avoids re-parsing
    const etag = `"${result.data[0]?.syncedAt ?? '0'}-${result.data.length}-${result.hasMore}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.set('ETag', etag);
    res.set('Cache-Control', 'private, no-cache');
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[sync] getEssaysByTeacher error:', err);
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

// ── Get single essay ─────────────────────────────────────────────────────────
router.get('/essays/:id', (req, res) => {
  try {
    const essay = getEssayById(req.params.id);
    if (!essay) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Redação não encontrada.' },
      });
    }
    // IDOR: only the owning teacher may fetch this essay
    if (essay.teacherId !== req.teacherId) {
      return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');
    }
    res.json({ success: true, data: essay });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

// ── Serve backed-up essay image ──────────────────────────────────────────────
router.get('/images/:id', (req, res) => {
  try {
    const essay = getEssayById(req.params.id);
    if (!essay) return sendError(res, 404, 'NOT_FOUND', 'Redação não encontrada.');
    if (essay.teacherId !== req.teacherId) return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');

    const imagePath = getEssayImagePath(req.params.id);
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
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

// ── Teacher adds/updates eval ────────────────────────────────────────────────
router.put('/essays/:id/teacher-eval', validateBody(TeacherEvalSchema), (req, res) => {
  try {
    // Verify ownership before updating
    const essay = getEssayById(req.params.id);
    if (!essay) return sendError(res, 404, 'NOT_FOUND', 'Redação não encontrada.');
    if (essay.teacherId !== req.teacherId) return sendError(res, 403, 'FORBIDDEN', 'Acesso negado.');

    res.json({ success: true, data: updateTeacherEval(req.params.id, req.body.teacherScore, req.body.teacherNote) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

export { router as syncRoutes };
