import db from '../services/database.js';

interface EssayRow {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  turmaId: string | null;
  turmaName: string | null;
  themeTitle: string | null;
  inputMode: string;
  essayText: string | null;
  status: string;
  totalScore: number | null;
  teacherScore: number | null;
  teacherNote: string | null;
  correctionJson: string | null;
  createdAt: string | null;
  correctedAt: string | null;
  updatedAt: string | null;
  imagePath: string | null;
  submittedByStudent: number;
  syncedAt: string;
}

interface ParsedEssayRow extends Omit<EssayRow, 'correctionJson' | 'imagePath'> {
  correctionJson: Record<string, unknown> | null;
  imagePath: undefined;
}

interface UpsertEssayParams {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  turmaId: string | null;
  turmaName: string | null;
  themeTitle: string | null;
  inputMode: string;
  essayText: string | null;
  status: string;
  totalScore: number | null;
  teacherScore: number | null;
  teacherNote: string | null;
  correctionJson: string | null;
  createdAt: string | null;
  correctedAt: string | null;
  updatedAt: string | null;
  imagePath: string | null;
  submittedByStudent: number;
}

interface EssayConflict {
  updatedAt: string | null;
  status: string;
}

interface GetEssaysByTeacherOpts {
  cursor?: string;
  limit?: number;
}

interface EssayPage {
  data: ParsedEssayRow[];
  hasMore: boolean;
  nextCursor: string | null;
}

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

export function findEssayById(id: string): ParsedEssayRow | null {
  const row = db.prepare('SELECT * FROM essays WHERE id = ?').get(id) as EssayRow | undefined;
  return row ? parseRow(row) : null;
}

/** Returns `{ updatedAt, status }` for the stored essay, or undefined if not found. */
export function checkEssayConflict(id: string): EssayConflict | undefined {
  return checkConflictStmt.get(id) as EssayConflict | undefined;
}

/**
 * Raw upsert — caller is responsible for resolving imagePath before calling.
 */
export function upsertEssayRow(data: UpsertEssayParams): void {
  db.transaction(() => upsertStmt.run(data))();
}

export function findEssayImagePath(id: string): string | null {
  const row = db.prepare('SELECT imagePath FROM essays WHERE id = ?').get(id) as { imagePath: string | null } | undefined;
  return row?.imagePath ?? null;
}

export function findEssaysByTeacher(teacherId: string, { cursor, limit = 50 }: GetEssaysByTeacherOpts = {}): EssayPage {
  const safeLimit = Math.min(Math.max(1, Number(limit)), 200);
  const fetch = safeLimit + 1;

  const rows = cursor
    ? (db.prepare(`
        SELECT * FROM essays
        WHERE teacherId = ? AND COALESCE(syncedAt, createdAt) < ?
        ORDER BY COALESCE(syncedAt, createdAt) DESC
        LIMIT ?
      `).all(teacherId, cursor, fetch) as EssayRow[])
    : (db.prepare(`
        SELECT * FROM essays
        WHERE teacherId = ?
        ORDER BY COALESCE(syncedAt, createdAt) DESC
        LIMIT ?
      `).all(teacherId, fetch) as EssayRow[]);

  const hasMore = rows.length > safeLimit;
  const data = rows.slice(0, safeLimit).map(parseRow);
  const nextCursor = hasMore ? (data[data.length - 1].syncedAt ?? null) : null;

  return { data, hasMore, nextCursor };
}

export function updateEssayTeacherEval(id: string, teacherScore: number | null, teacherNote: string | null): void {
  db.prepare('UPDATE essays SET teacherScore = ?, teacherNote = ? WHERE id = ?')
    .run(teacherScore ?? null, teacherNote ?? null, id);
}

export function findImagePathsByTeacher(teacherId: string): string[] {
  return (db.prepare('SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL')
    .all(teacherId) as { imagePath: string }[])
    .map((r) => r.imagePath);
}

export function deleteEssaysByTeacher(teacherId: string): void {
  db.prepare('DELETE FROM essays WHERE teacherId = ?').run(teacherId);
}

function parseRow(row: EssayRow): ParsedEssayRow {
  return {
    ...row,
    correctionJson: row.correctionJson ? JSON.parse(row.correctionJson) as Record<string, unknown> : null,
    imagePath: undefined,
  };
}
