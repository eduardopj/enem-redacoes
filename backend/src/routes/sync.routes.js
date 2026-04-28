import { Router } from 'express';
import { getEssayById, getEssaysByTeacher, getTurmaByCode, updateTeacherEval, upsertEssay, upsertTurma } from '../services/sync.service.js';

const router = Router();

// Student pushes corrected essay
router.post('/essays', (req, res) => {
  try {
    const result = upsertEssay(req.body);
    res.json(result);
  } catch (err) {
    console.error('[sync] upsertEssay error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Teacher registers turma join code (called when QR is generated)
router.post('/turmas', (req, res) => {
  const { joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName } = req.body;
  if (!joinCode || !teacherId || !turmaId) {
    return res.status(400).json({ error: 'joinCode, teacherId e turmaId são obrigatórios' });
  }
  try {
    res.json(upsertTurma({ joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName }));
  } catch (err) {
    console.error('[sync] upsertTurma error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Student looks up turma by join code
router.get('/turmas/by-code/:code', (req, res) => {
  try {
    const turma = getTurmaByCode(req.params.code.toUpperCase());
    if (!turma) return res.status(404).json({ error: 'Código inválido ou expirado.' });
    res.json(turma);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher fetches all student essays
router.get('/essays', (req, res) => {
  const { teacherId } = req.query;
  if (!teacherId) return res.status(400).json({ error: 'teacherId obrigatório' });
  try {
    res.json(getEssaysByTeacher(teacherId));
  } catch (err) {
    console.error('[sync] getEssaysByTeacher error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single essay
router.get('/essays/:id', (req, res) => {
  try {
    const essay = getEssayById(req.params.id);
    if (!essay) return res.status(404).json({ error: 'Não encontrado' });
    res.json(essay);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher adds/updates eval
router.put('/essays/:id/teacher-eval', (req, res) => {
  const { teacherScore, teacherNote } = req.body;
  try {
    res.json(updateTeacherEval(req.params.id, teacherScore, teacherNote));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as syncRoutes };
