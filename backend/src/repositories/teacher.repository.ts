import db from '../services/database.js';

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

export function findTeacherById(teacherId: string): Teacher | null {
  return (db.prepare('SELECT * FROM teachers WHERE teacherId = ?').get(teacherId) as Teacher | undefined) ?? null;
}

export function findTeacherByEmail(teacherEmail: string): TeacherByEmail | null {
  return (db.prepare(
    'SELECT teacherId, token, expiresAt, passwordHash, revokedAt FROM teachers WHERE LOWER(teacherEmail) = LOWER(?)'
  ).get(teacherEmail.trim()) as TeacherByEmail | undefined) ?? null;
}

export function findTeacherByToken(token: string): TeacherByToken | null {
  return (db.prepare(
    'SELECT teacherId, teacherEmail, expiresAt, revokedAt FROM teachers WHERE token = ?'
  ).get(token) as TeacherByToken | undefined) ?? null;
}

export function findTeacherTokenInfo(teacherId: string): TeacherTokenInfo | null {
  return (db.prepare('SELECT token, expiresAt, passwordHash FROM teachers WHERE teacherId = ?')
    .get(teacherId) as TeacherTokenInfo | undefined) ?? null;
}

export function findTeacherResetInfo(teacherId: string): TeacherResetInfo | null {
  return (db.prepare('SELECT resetToken, resetTokenExpiresAt FROM teachers WHERE teacherId = ?')
    .get(teacherId) as TeacherResetInfo | undefined) ?? null;
}

export function createTeacher({ teacherId, teacherEmail, teacherName, token, expiresAt, passwordHash }: CreateTeacherParams): void {
  db.prepare(
    'INSERT INTO teachers (teacherId, teacherEmail, teacherName, token, expiresAt, passwordHash) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(teacherId, teacherEmail ?? '', teacherName ?? '', token, expiresAt, passwordHash ?? null);
}

export function updateTeacherToken(teacherId: string, token: string, expiresAt: string): void {
  db.prepare('UPDATE teachers SET token = ?, expiresAt = ?, revokedAt = NULL WHERE teacherId = ?')
    .run(token, expiresAt, teacherId);
}

export function updateTeacherPasswordHash(teacherId: string, passwordHash: string): void {
  db.prepare('UPDATE teachers SET passwordHash = ? WHERE teacherId = ?')
    .run(passwordHash, teacherId);
}

export function updateTeacherResetToken(teacherId: string, codeHash: string, expiresAt: string): void {
  db.prepare('UPDATE teachers SET resetToken = ?, resetTokenExpiresAt = ? WHERE teacherId = ?')
    .run(codeHash, expiresAt, teacherId);
}

export function clearTeacherResetToken(teacherId: string, passwordHash: string): void {
  db.prepare(
    'UPDATE teachers SET passwordHash = ?, resetToken = NULL, resetTokenExpiresAt = NULL WHERE teacherId = ?'
  ).run(passwordHash, teacherId);
}

export function revokeTeacherToken(token: string): void {
  db.prepare('UPDATE teachers SET revokedAt = ? WHERE token = ?')
    .run(new Date().toISOString(), token);
}

export function saveTeacherPushToken(teacherId: string, pushToken: string | null): void {
  db.prepare('UPDATE teachers SET pushToken = ? WHERE teacherId = ?')
    .run(pushToken ?? null, teacherId);
}

export function getTeacherPushTokenById(teacherId: string): string | null {
  const row = db.prepare('SELECT pushToken FROM teachers WHERE teacherId = ?').get(teacherId) as { pushToken: string | null } | undefined;
  return row?.pushToken ?? null;
}

/**
 * Atomically deletes teacher + essays + turmas in a single transaction.
 * Returns the imagePaths that were in essays (so the caller can clean up files).
 */
export function deleteTeacherCascade(teacherId: string): string[] {
  const imagePaths = (db.prepare(
    'SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL'
  ).all(teacherId) as { imagePath: string }[]).map((r) => r.imagePath);

  db.transaction(() => {
    db.prepare('DELETE FROM essays WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM turmas WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM teachers WHERE teacherId = ?').run(teacherId);
  })();

  return imagePaths;
}
