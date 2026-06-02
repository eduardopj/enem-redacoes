import db from '../services/database.js';

export function findTeacherById(teacherId) {
  return db.prepare('SELECT * FROM teachers WHERE teacherId = ?').get(teacherId) ?? null;
}

export function findTeacherByEmail(teacherEmail) {
  return db.prepare(
    'SELECT teacherId, token, expiresAt, passwordHash, revokedAt FROM teachers WHERE LOWER(teacherEmail) = LOWER(?)'
  ).get(teacherEmail.trim()) ?? null;
}

export function findTeacherByToken(token) {
  return db.prepare(
    'SELECT teacherId, teacherEmail, expiresAt, revokedAt FROM teachers WHERE token = ?'
  ).get(token) ?? null;
}

export function findTeacherTokenInfo(teacherId) {
  return db.prepare('SELECT token, expiresAt, passwordHash FROM teachers WHERE teacherId = ?')
    .get(teacherId) ?? null;
}

export function findTeacherResetInfo(teacherId) {
  return db.prepare('SELECT resetToken, resetTokenExpiresAt FROM teachers WHERE teacherId = ?')
    .get(teacherId) ?? null;
}

export function createTeacher({ teacherId, teacherEmail, teacherName, token, expiresAt, passwordHash }) {
  db.prepare(
    'INSERT INTO teachers (teacherId, teacherEmail, teacherName, token, expiresAt, passwordHash) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(teacherId, teacherEmail ?? '', teacherName ?? '', token, expiresAt, passwordHash ?? null);
}

export function updateTeacherToken(teacherId, token, expiresAt) {
  db.prepare('UPDATE teachers SET token = ?, expiresAt = ?, revokedAt = NULL WHERE teacherId = ?')
    .run(token, expiresAt, teacherId);
}

export function updateTeacherPasswordHash(teacherId, passwordHash) {
  db.prepare('UPDATE teachers SET passwordHash = ? WHERE teacherId = ?')
    .run(passwordHash, teacherId);
}

export function updateTeacherResetToken(teacherId, codeHash, expiresAt) {
  db.prepare('UPDATE teachers SET resetToken = ?, resetTokenExpiresAt = ? WHERE teacherId = ?')
    .run(codeHash, expiresAt, teacherId);
}

export function clearTeacherResetToken(teacherId, passwordHash) {
  db.prepare(
    'UPDATE teachers SET passwordHash = ?, resetToken = NULL, resetTokenExpiresAt = NULL WHERE teacherId = ?'
  ).run(passwordHash, teacherId);
}

export function revokeTeacherToken(token) {
  db.prepare('UPDATE teachers SET revokedAt = ? WHERE token = ?')
    .run(new Date().toISOString(), token);
}

export function saveTeacherPushToken(teacherId, pushToken) {
  db.prepare('UPDATE teachers SET pushToken = ? WHERE teacherId = ?')
    .run(pushToken ?? null, teacherId);
}

export function getTeacherPushTokenById(teacherId) {
  const row = db.prepare('SELECT pushToken FROM teachers WHERE teacherId = ?').get(teacherId);
  return row?.pushToken ?? null;
}

/**
 * Atomically deletes teacher + essays + turmas in a single transaction.
 * Returns the imagePaths that were in essays (so the caller can clean up files).
 */
export function deleteTeacherCascade(teacherId) {
  const imagePaths = db.prepare(
    'SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL'
  ).all(teacherId).map((r) => r.imagePath);

  db.transaction(() => {
    db.prepare('DELETE FROM essays WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM turmas WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM teachers WHERE teacherId = ?').run(teacherId);
  })();

  return imagePaths;
}
