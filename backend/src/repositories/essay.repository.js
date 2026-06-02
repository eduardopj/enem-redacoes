import db from '../services/database.js';

const upsertStmt = db.prepare(`
  INSERT INTO essays (
    id, teacherId, studentId, studentName, turmaId, turmaName,
    themeTitle, inputMode, essayText, status,
    totalScore, teacherScore, teacherNote, correctionJson,
    createdAt, correctedAt, updatedAt, imagePath, submittedByStudent, syncedAt
  ) VALUES (
    @id, @teacherId, @studentId, @studentName, @turmaId, @turmaName,
    @themeTitle, @inputMode, @essayText, @status,
    @totalScore, @teacherScore, @teacherNote, @correctionJson,
    @createdAt, @correctedAt, @updatedAt, @imagePath, @submittedByStudent, datetime('now')
  )
  ON CONFLICT(id) DO UPDATE SET
    teacherId    = excluded.teacherId,
    studentId    = excluded.studentId,
    studentName  = excluded.studentName,
    turmaId      = excluded.turmaId,
    turmaName    = excluded.turmaName,
    themeTitle   = excluded.themeTitle,
    inputMode    = excluded.inputMode,
    essayText    = excluded.essayText,
    status       = excluded.status,
    totalScore   = excluded.totalScore,
    teacherScore = excluded.teacherScore,
    teacherNote  = excluded.teacherNote,
    correctionJson = excluded.correctionJson,
    createdAt    = excluded.createdAt,
    correctedAt  = excluded.correctedAt,
    updatedAt    = excluded.updatedAt,
    imagePath    = COALESCE(excluded.imagePath, essays.imagePath),
    submittedByStudent = excluded.submittedByStudent,
    syncedAt     = excluded.syncedAt
`);

const checkConflictStmt = db.prepare('SELECT updatedAt, status FROM essays WHERE id = ?');

export function findEssayById(id) {
  const row = db.prepare('SELECT * FROM essays WHERE id = ?').get(id);
  return row ? parseRow(row) : null;
}

/** Returns `{ updatedAt, status }` for the stored essay, or undefined if not found. */
export function checkEssayConflict(id) {
  return checkConflictStmt.get(id);
}

/**
 * Raw upsert — caller is responsible for resolving imagePath before calling.
 * Returns true if this was an INSERT (new row), false if UPDATE.
 */
export function upsertEssayRow(data, isNew) {
  db.transaction(() => upsertStmt.run(data))();
}

export function findEssayImagePath(id) {
  const row = db.prepare('SELECT imagePath FROM essays WHERE id = ?').get(id);
  return row?.imagePath ?? null;
}

export function findEssaysByTeacher(teacherId, { cursor, limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(1, Number(limit)), 200);
  const fetch = safeLimit + 1;

  const rows = cursor
    ? db.prepare(`
        SELECT * FROM essays
        WHERE teacherId = ? AND COALESCE(syncedAt, createdAt) < ?
        ORDER BY COALESCE(syncedAt, createdAt) DESC
        LIMIT ?
      `).all(teacherId, cursor, fetch)
    : db.prepare(`
        SELECT * FROM essays
        WHERE teacherId = ?
        ORDER BY COALESCE(syncedAt, createdAt) DESC
        LIMIT ?
      `).all(teacherId, fetch);

  const hasMore = rows.length > safeLimit;
  const data = rows.slice(0, safeLimit).map(parseRow);
  const nextCursor = hasMore ? data[data.length - 1].syncedAt : null;

  return { data, hasMore, nextCursor };
}

export function updateEssayTeacherEval(id, teacherScore, teacherNote) {
  db.prepare('UPDATE essays SET teacherScore = ?, teacherNote = ? WHERE id = ?')
    .run(teacherScore ?? null, teacherNote ?? null, id);
}

export function findImagePathsByTeacher(teacherId) {
  return db.prepare('SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL')
    .all(teacherId)
    .map((r) => r.imagePath);
}

export function deleteEssaysByTeacher(teacherId) {
  db.prepare('DELETE FROM essays WHERE teacherId = ?').run(teacherId);
}

function parseRow(row) {
  return {
    ...row,
    correctionJson: row.correctionJson ? JSON.parse(row.correctionJson) : null,
    imagePath: undefined,
  };
}
