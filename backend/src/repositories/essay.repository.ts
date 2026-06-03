import { execute, query, queryOne, transaction } from '../services/db-client.js';

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

export async function findEssayById(id: string): Promise<ParsedEssayRow | null> {
  const row = await queryOne<EssayRow>('SELECT * FROM essays WHERE id = ?', [id]);
  return row ? parseRow(row) : null;
}

/** Returns `{ updatedAt, status }` for the stored essay, or undefined if not found. */
export async function checkEssayConflict(id: string): Promise<EssayConflict | undefined> {
  const row = await queryOne<EssayConflict>('SELECT updatedAt, status FROM essays WHERE id = ?', [id]);
  return row ?? undefined;
}

/**
 * Raw upsert — caller is responsible for resolving imagePath before calling.
 */
export async function upsertEssayRow(data: UpsertEssayParams): Promise<void> {
  await transaction([[
    `INSERT INTO essays (
      id, teacherId, studentId, studentName, turmaId, turmaName,
      themeTitle, inputMode, essayText, status,
      totalScore, teacherScore, teacherNote, correctionJson,
      createdAt, correctedAt, updatedAt, imagePath, submittedByStudent, syncedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, datetime('now')
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
      syncedAt     = excluded.syncedAt`,
    [
      data.id, data.teacherId, data.studentId, data.studentName, data.turmaId, data.turmaName,
      data.themeTitle, data.inputMode, data.essayText, data.status,
      data.totalScore, data.teacherScore, data.teacherNote, data.correctionJson,
      data.createdAt, data.correctedAt, data.updatedAt, data.imagePath, data.submittedByStudent,
    ],
  ]]);
}

export async function findEssayImagePath(id: string): Promise<string | null> {
  const row = await queryOne<{ imagePath: string | null }>('SELECT imagePath FROM essays WHERE id = ?', [id]);
  return row?.imagePath ?? null;
}

export async function findEssaysByTeacher(
  teacherId: string,
  { cursor, limit = 50 }: GetEssaysByTeacherOpts = {},
): Promise<EssayPage> {
  const safeLimit = Math.min(Math.max(1, Number(limit)), 200);
  const fetch = safeLimit + 1;

  const rows = cursor
    ? await query<EssayRow>(
        `SELECT * FROM essays
         WHERE teacherId = ? AND COALESCE(syncedAt, createdAt) < ?
         ORDER BY COALESCE(syncedAt, createdAt) DESC
         LIMIT ?`,
        [teacherId, cursor, fetch],
      )
    : await query<EssayRow>(
        `SELECT * FROM essays
         WHERE teacherId = ?
         ORDER BY COALESCE(syncedAt, createdAt) DESC
         LIMIT ?`,
        [teacherId, fetch],
      );

  const hasMore = rows.length > safeLimit;
  const data = rows.slice(0, safeLimit).map(parseRow);
  const nextCursor = hasMore ? (data[data.length - 1].syncedAt ?? null) : null;

  return { data, hasMore, nextCursor };
}

export async function updateEssayTeacherEval(
  id: string,
  teacherScore: number | null,
  teacherNote: string | null,
): Promise<void> {
  await execute(
    'UPDATE essays SET teacherScore = ?, teacherNote = ? WHERE id = ?',
    [teacherScore ?? null, teacherNote ?? null, id],
  );
}

export async function findImagePathsByTeacher(teacherId: string): Promise<string[]> {
  const rows = await query<{ imagePath: string }>(
    'SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL',
    [teacherId],
  );
  return rows.map((r) => r.imagePath);
}

export async function deleteEssaysByTeacher(teacherId: string): Promise<void> {
  await execute('DELETE FROM essays WHERE teacherId = ?', [teacherId]);
}

function parseRow(row: EssayRow): ParsedEssayRow {
  return {
    ...row,
    correctionJson: row.correctionJson ? JSON.parse(row.correctionJson) as Record<string, unknown> : null,
    imagePath: undefined,
  };
}
