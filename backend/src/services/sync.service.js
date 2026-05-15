import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './database.js';
import { getTeacherPushToken } from './auth.service.js';
import { validateAndOptimizeImage } from '../utils/image.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(pushToken, title, body, data = {}) {
  if (!pushToken?.startsWith('ExponentPushToken')) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default', priority: 'high' }),
    });
  } catch (_) {
    // push is best-effort — never throw
  }
}

const DATA_DIR = process.env.DATA_DIR ?? join(fileURLToPath(import.meta.url), '../../../../data');
const IMAGES_DIR = join(DATA_DIR, 'images');
mkdirSync(IMAGES_DIR, { recursive: true });

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Pre-compile the INSERT/UPDATE statement once at module load for efficiency
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

const existingStmt = db.prepare('SELECT updatedAt, status FROM essays WHERE id = ?');

export async function upsertEssay(essay) {
  // ── Quick conflict check (read, outside transaction) ──────────────────────
  const existing = existingStmt.get(essay.id);
  if (existing?.updatedAt && essay.updatedAt && existing.updatedAt >= essay.updatedAt) {
    return { ok: true, skipped: true };
  }

  const isNew = !existing;

  // ── P1: Validate magic bytes + optimize image BEFORE touching the DB ──────
  // Async work must happen outside the synchronous better-sqlite3 transaction.
  let imageBuffer = null;
  let imagePath = null;
  if (essay.imageBase64 && essay.imageMimeType && ALLOWED_IMAGE_MIME.has(essay.imageMimeType)) {
    const optimized = await validateAndOptimizeImage(essay.imageBase64);
    imageBuffer = Buffer.from(optimized.base64, 'base64');
    // All images are normalized to WebP regardless of original format
    imagePath = join(IMAGES_DIR, `${essay.id}.webp`);
  }

  // ── P2: Atomic DB write ───────────────────────────────────────────────────
  // better-sqlite3 transactions are synchronous and throw on any failure,
  // automatically rolling back — ensuring the essay row is never half-written.
  const doInsert = db.transaction(() => {
    upsertStmt.run({
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
      updatedAt: essay.updatedAt ?? null,
      imagePath,
      // submittedByStudent is server-enforced: only allow true on NEW essays (INSERT path).
      // This prevents a teacher device from retroactively re-flagging an existing essay.
      submittedByStudent: isNew && essay.submittedByStudent ? 1 : 0,
    });
  });
  doInsert();

  // ── Write image file AFTER successful DB commit ───────────────────────────
  // If the file write fails here, the DB has an imagePath that doesn't exist yet.
  // The next sync of the same essay will retry the write — acceptable trade-off.
  if (imageBuffer && imagePath) {
    writeFileSync(imagePath, imageBuffer);
  }

  // Push notification: new student essay that was AI-corrected
  const correctedStatuses = ['corrigida', 'precisa_revisao', 'baixa_confiabilidade'];
  if (isNew && essay.submittedByStudent && correctedStatuses.includes(essay.status)) {
    const pushToken = getTeacherPushToken(essay.teacherId);
    if (pushToken) {
      const studentName = essay.studentName ?? 'Aluno';
      const theme = essay.themeTitle ?? 'Redação';
      const score = essay.totalScore != null ? ` • ${essay.totalScore}/1000` : '';
      sendExpoPush(
        pushToken,
        `Redação corrigida pela IA${score}`,
        `${studentName}: ${theme}`,
        { essayId: essay.id, screen: 'resultado' }
      );
    }
  }

  return { ok: true, skipped: false };
}

/**
 * Returns a paginated page of essays for the given teacher.
 * cursor: ISO datetime of the syncedAt of the last seen row (exclusive)
 * limit: max rows to return (default 50)
 */
export function getEssaysByTeacher(teacherId, { cursor, limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(1, Number(limit)), 200);
  const fetch = safeLimit + 1; // fetch one extra to detect hasMore

  let rows;
  if (cursor) {
    rows = db
      .prepare(`
        SELECT * FROM essays
        WHERE teacherId = ? AND COALESCE(syncedAt, createdAt) < ?
        ORDER BY COALESCE(syncedAt, createdAt) DESC
        LIMIT ?
      `)
      .all(teacherId, cursor, fetch);
  } else {
    rows = db
      .prepare(`
        SELECT * FROM essays
        WHERE teacherId = ?
        ORDER BY COALESCE(syncedAt, createdAt) DESC
        LIMIT ?
      `)
      .all(teacherId, fetch);
  }

  const hasMore = rows.length > safeLimit;
  const data = rows.slice(0, safeLimit).map(parseRow);
  const nextCursor = hasMore ? data[data.length - 1].syncedAt : null;

  return { data, hasMore, nextCursor };
}

export function getEssayById(id) {
  const row = db.prepare(`SELECT * FROM essays WHERE id = ?`).get(id);
  return row ? parseRow(row) : null;
}

export function getEssayImagePath(id) {
  const row = db.prepare(`SELECT imagePath FROM essays WHERE id = ?`).get(id);
  return row?.imagePath ?? null;
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
    imagePath: undefined, // don't expose internal filesystem path
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

export { IMAGES_DIR };
