import db from './database.js';

export function upsertEssay(essay) {
  db.prepare(`
    INSERT OR REPLACE INTO essays (
      id, teacherId, studentId, studentName, turmaId, turmaName,
      themeTitle, inputMode, essayText, status,
      totalScore, teacherScore, teacherNote, correctionJson,
      createdAt, correctedAt, syncedAt
    ) VALUES (
      @id, @teacherId, @studentId, @studentName, @turmaId, @turmaName,
      @themeTitle, @inputMode, @essayText, @status,
      @totalScore, @teacherScore, @teacherNote, @correctionJson,
      @createdAt, @correctedAt, datetime('now')
    )
  `).run({
    id: essay.id,
    teacherId: essay.teacherId,
    studentId: essay.studentId,
    studentName: essay.studentName ?? null,
    turmaId: essay.turmaId ?? null,
    turmaName: essay.turmaName ?? null,
    themeTitle: essay.themeTitle ?? null,
    inputMode: essay.inputMode ?? 'manuscrita',
    essayText: essay.essayText ?? null,
    status: essay.status ?? 'corrigida',
    totalScore: essay.totalScore ?? null,
    teacherScore: essay.teacherScore ?? null,
    teacherNote: essay.teacherNote ?? null,
    correctionJson: essay.correctionJson != null ? JSON.stringify(essay.correctionJson) : null,
    createdAt: essay.createdAt ?? null,
    correctedAt: essay.correctedAt ?? null,
  });
  return { ok: true };
}

export function getEssaysByTeacher(teacherId) {
  return db
    .prepare(`
      SELECT * FROM essays
      WHERE teacherId = ?
      ORDER BY COALESCE(correctedAt, createdAt) DESC
    `)
    .all(teacherId)
    .map(parseRow);
}

export function getEssayById(id) {
  const row = db.prepare(`SELECT * FROM essays WHERE id = ?`).get(id);
  return row ? parseRow(row) : null;
}

export function updateTeacherEval(id, teacherScore, teacherNote) {
  db.prepare(`UPDATE essays SET teacherScore = ?, teacherNote = ? WHERE id = ?`)
    .run(teacherScore ?? null, teacherNote ?? null, id);
  return { ok: true };
}

function parseRow(row) {
  return {
    ...row,
    correctionJson: row.correctionJson ? JSON.parse(row.correctionJson) : null,
  };
}

export function upsertTurma({ joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName }) {
  db.prepare(`
    INSERT OR REPLACE INTO turmas (joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(joinCode, teacherId, teacherName, teacherEmail, turmaId, turmaName);
  return { ok: true };
}

export function getTurmaByCode(joinCode) {
  return db.prepare(`SELECT * FROM turmas WHERE joinCode = ?`).get(joinCode) ?? null;
}
