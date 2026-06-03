import { execute, query, queryOne, transaction } from '../services/db-client.js';

interface Teacher {
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
  token: string;
  expiresAt: string | null;
  passwordHash: string | null;
  revokedAt: string | null;
  pushToken: string | null;
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
  createdAt: string;
}

interface TeacherTokenInfo {
  token: string;
  expiresAt: string | null;
  passwordHash: string | null;
}

interface TeacherByToken {
  teacherId: string;
  teacherEmail: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

interface TeacherByEmail {
  teacherId: string;
  token: string;
  expiresAt: string | null;
  passwordHash: string | null;
  revokedAt: string | null;
}

interface TeacherResetInfo {
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
}

interface CreateTeacherParams {
  teacherId: string;
  teacherEmail: string | null;
  teacherName: string | null;
  token: string;
  expiresAt: string;
  passwordHash: string | null;
}

export async function findTeacherById(teacherId: string): Promise<Teacher | null> {
  return queryOne<Teacher>('SELECT * FROM teachers WHERE teacherId = ?', [teacherId]);
}

export async function findTeacherByEmail(teacherEmail: string): Promise<TeacherByEmail | null> {
  return queryOne<TeacherByEmail>(
    'SELECT teacherId, token, expiresAt, passwordHash, revokedAt FROM teachers WHERE LOWER(teacherEmail) = LOWER(?)',
    [teacherEmail.trim()],
  );
}

export async function findTeacherByToken(token: string): Promise<TeacherByToken | null> {
  return queryOne<TeacherByToken>(
    'SELECT teacherId, teacherEmail, expiresAt, revokedAt FROM teachers WHERE token = ?',
    [token],
  );
}

export async function findTeacherTokenInfo(teacherId: string): Promise<TeacherTokenInfo | null> {
  return queryOne<TeacherTokenInfo>(
    'SELECT token, expiresAt, passwordHash FROM teachers WHERE teacherId = ?',
    [teacherId],
  );
}

export async function findTeacherResetInfo(teacherId: string): Promise<TeacherResetInfo | null> {
  return queryOne<TeacherResetInfo>(
    'SELECT resetToken, resetTokenExpiresAt FROM teachers WHERE teacherId = ?',
    [teacherId],
  );
}

export async function createTeacher({
  teacherId,
  teacherEmail,
  teacherName,
  token,
  expiresAt,
  passwordHash,
}: CreateTeacherParams): Promise<void> {
  await execute(
    'INSERT INTO teachers (teacherId, teacherEmail, teacherName, token, expiresAt, passwordHash) VALUES (?, ?, ?, ?, ?, ?)',
    [teacherId, teacherEmail ?? '', teacherName ?? '', token, expiresAt, passwordHash ?? null],
  );
}

export async function updateTeacherToken(teacherId: string, token: string, expiresAt: string): Promise<void> {
  await execute(
    'UPDATE teachers SET token = ?, expiresAt = ?, revokedAt = NULL WHERE teacherId = ?',
    [token, expiresAt, teacherId],
  );
}

export async function updateTeacherPasswordHash(teacherId: string, passwordHash: string): Promise<void> {
  await execute(
    'UPDATE teachers SET passwordHash = ? WHERE teacherId = ?',
    [passwordHash, teacherId],
  );
}

export async function updateTeacherResetToken(
  teacherId: string,
  codeHash: string,
  expiresAt: string,
): Promise<void> {
  await execute(
    'UPDATE teachers SET resetToken = ?, resetTokenExpiresAt = ? WHERE teacherId = ?',
    [codeHash, expiresAt, teacherId],
  );
}

export async function clearTeacherResetToken(teacherId: string, passwordHash: string): Promise<void> {
  await execute(
    'UPDATE teachers SET passwordHash = ?, resetToken = NULL, resetTokenExpiresAt = NULL WHERE teacherId = ?',
    [passwordHash, teacherId],
  );
}

export async function revokeTeacherToken(token: string): Promise<void> {
  await execute(
    'UPDATE teachers SET revokedAt = ? WHERE token = ?',
    [new Date().toISOString(), token],
  );
}

export async function saveTeacherPushToken(teacherId: string, pushToken: string | null): Promise<void> {
  await execute(
    'UPDATE teachers SET pushToken = ? WHERE teacherId = ?',
    [pushToken ?? null, teacherId],
  );
}

export async function getTeacherPushTokenById(teacherId: string): Promise<string | null> {
  const row = await queryOne<{ pushToken: string | null }>(
    'SELECT pushToken FROM teachers WHERE teacherId = ?',
    [teacherId],
  );
  return row?.pushToken ?? null;
}

/**
 * Atomically deletes teacher + essays + turmas in a single transaction.
 * Returns the imagePaths that were in essays (so the caller can clean up files).
 */
export async function deleteTeacherCascade(teacherId: string): Promise<string[]> {
  const rows = await query<{ imagePath: string }>(
    'SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL',
    [teacherId],
  );
  const imagePaths = rows.map((r) => r.imagePath);

  await transaction([
    ['DELETE FROM essays WHERE teacherId = ?', [teacherId]],
    ['DELETE FROM turmas WHERE teacherId = ?', [teacherId]],
    ['DELETE FROM teachers WHERE teacherId = ?', [teacherId]],
  ]);

  return imagePaths;
}
