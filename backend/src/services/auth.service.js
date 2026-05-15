import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { rmSync } from 'node:fs';
import db from './database.js';

const TOKEN_TTL_MS    = 365 * 24 * 60 * 60 * 1000; // 1 year
const RENEW_WITHIN_MS =   7 * 24 * 60 * 60 * 1000; // renew if expiring within 7 days

// ─── PBKDF2-SHA512 password hashing ──────────────────────────────────────────
// Input: passwordHash is the SHA-256+pepper hash produced by the client.
// We run PBKDF2 on top of that so the stored value is never recoverable to
// the original password even if the database is fully compromised.

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN     = 64;
const PBKDF2_DIGEST     = 'sha512';

function pbkdf2Hash(input, salt) {
  return pbkdf2Sync(input, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
}

/** Returns "salt:hash" ready for DB storage. */
export function hashPasswordForStorage(clientHash) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${pbkdf2Hash(clientHash, salt)}`;
}

/** Constant-time comparison — returns true if clientHash matches stored value. */
export function verifyStoredPasswordHash(clientHash, stored) {
  if (!stored || !clientHash) return false;
  const colonIdx = stored.indexOf(':');
  if (colonIdx === -1) return false;
  const salt     = stored.slice(0, colonIdx);
  const expected = stored.slice(colonIdx + 1);
  const candidate = pbkdf2Hash(clientHash, salt);
  const expBuf = Buffer.from(expected, 'hex');
  const canBuf = Buffer.from(candidate, 'hex');
  if (expBuf.length !== canBuf.length) return false;
  return timingSafeEqual(expBuf, canBuf);
}

// ─── Token helpers ────────────────────────────────────────────────────────────

function generateToken() {
  return randomBytes(32).toString('hex');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * First-time registration: creates a teacher record and returns a token.
 * If the teacher already exists:
 *   - With correct passwordHash (or no passwordHash yet stored): renews token if needed and returns it.
 *   - With wrong passwordHash: returns null (caller should return 401).
 * If passwordHash is omitted entirely (legacy / offline app): returns token without password check
 * only when the teacher has NO stored hash (backward-compat path, legacy rows).
 */
export function registerTeacher(teacherId, teacherEmail, teacherName, clientPasswordHash) {
  const existing = db
    .prepare('SELECT token, expiresAt, passwordHash FROM teachers WHERE teacherId = ?')
    .get(teacherId);

  if (existing) {
    // Password verification when both sides have a hash
    if (existing.passwordHash && clientPasswordHash) {
      if (!verifyStoredPasswordHash(clientPasswordHash, existing.passwordHash)) return null;
    }
    // Legacy row: no stored hash yet — store it now if provided
    if (!existing.passwordHash && clientPasswordHash) {
      db.prepare('UPDATE teachers SET passwordHash = ? WHERE teacherId = ?')
        .run(hashPasswordForStorage(clientPasswordHash), teacherId);
    }

    // Check token expiry
    if (!existing.expiresAt) return existing.token; // legacy indefinite token

    const expiresAt   = new Date(existing.expiresAt);
    const renewBefore = new Date(Date.now() + RENEW_WITHIN_MS);
    if (expiresAt > renewBefore) return existing.token;

    // Renew expiring token
    const token      = generateToken();
    const newExpires = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    db.prepare('UPDATE teachers SET token = ?, expiresAt = ?, revokedAt = NULL WHERE teacherId = ?')
      .run(token, newExpires, teacherId);
    return token;
  }

  // New teacher
  const token      = generateToken();
  const expiresAt  = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const storedHash = clientPasswordHash ? hashPasswordForStorage(clientPasswordHash) : null;
  db.prepare(
    'INSERT INTO teachers (teacherId, teacherEmail, teacherName, token, expiresAt, passwordHash) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(teacherId, teacherEmail ?? '', teacherName ?? '', token, expiresAt, storedHash);
  return token;
}

/**
 * Login by email + clientPasswordHash (the SHA-256 hash produced by the client).
 * Returns { token, teacherId } on success, or null on failure.
 */
export function loginTeacher(teacherEmail, clientPasswordHash) {
  const teacher = db
    .prepare('SELECT teacherId, token, expiresAt, passwordHash, revokedAt FROM teachers WHERE LOWER(teacherEmail) = LOWER(?)')
    .get(teacherEmail.trim());

  if (!teacher) return null;
  if (!teacher.passwordHash) return null; // teacher registered before passwords — must re-register
  if (!verifyStoredPasswordHash(clientPasswordHash, teacher.passwordHash)) return null;

  // Issue fresh token if current one is revoked or expiring
  const needsRenew = teacher.revokedAt ||
    (teacher.expiresAt && new Date(teacher.expiresAt) < new Date(Date.now() + RENEW_WITHIN_MS));

  if (needsRenew) {
    const token     = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    db.prepare('UPDATE teachers SET token = ?, expiresAt = ?, revokedAt = NULL WHERE teacherId = ?')
      .run(token, expiresAt, teacher.teacherId);
    return { token, teacherId: teacher.teacherId };
  }

  return { token: teacher.token, teacherId: teacher.teacherId };
}

/**
 * Revokes a token immediately (server-side logout).
 */
export function revokeToken(token) {
  db.prepare('UPDATE teachers SET revokedAt = ? WHERE token = ?')
    .run(new Date().toISOString(), token);
}

/**
 * Validates the bearer token. Returns { teacherId, teacherEmail } or null.
 */
export function validateToken(token) {
  if (!token || token.length !== 64) return null;
  const teacher = db
    .prepare('SELECT teacherId, teacherEmail, expiresAt, revokedAt FROM teachers WHERE token = ?')
    .get(token);
  if (!teacher) return null;
  if (teacher.revokedAt) return null; // explicitly revoked (server-side logout)
  if (teacher.expiresAt && new Date(teacher.expiresAt) < new Date()) return null;
  return { teacherId: teacher.teacherId, teacherEmail: teacher.teacherEmail };
}

// ─── Password reset ───────────────────────────────────────────────────────────

const RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generates and stores a 6-digit reset code for the given e-mail.
 * Returns { teacherEmail, code } so the caller can send the email,
 * or null if the e-mail is not registered (never reveals this to callers).
 * Always returns true-ish to prevent e-mail enumeration — handle null silently.
 */
export function forgotPassword(teacherEmail) {
  const teacher = db
    .prepare('SELECT teacherId FROM teachers WHERE LOWER(teacherEmail) = LOWER(?)')
    .get(teacherEmail.trim());

  if (!teacher) return null; // email not registered — caller should NOT reveal this

  const code = String(Math.floor(100_000 + Math.random() * 900_000)); // 6-digit
  const codeHash = createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

  db.prepare('UPDATE teachers SET resetToken = ?, resetTokenExpiresAt = ? WHERE teacherId = ?')
    .run(codeHash, expiresAt, teacher.teacherId);

  return { teacherEmail: teacherEmail.trim().toLowerCase(), code };
}

/**
 * Validates code + sets new password.
 * Returns true on success, false on invalid/expired code.
 */
export function resetPassword(teacherEmail, code, newClientHash) {
  const teacher = db
    .prepare('SELECT teacherId, resetToken, resetTokenExpiresAt FROM teachers WHERE LOWER(teacherEmail) = LOWER(?)')
    .get(teacherEmail.trim());

  if (!teacher?.resetToken || !teacher?.resetTokenExpiresAt) return false;
  if (new Date(teacher.resetTokenExpiresAt) < new Date()) return false;

  const codeHash   = createHash('sha256').update(code).digest('hex');
  const storedBuf  = Buffer.from(teacher.resetToken, 'hex');
  const incomingBuf = Buffer.from(codeHash, 'hex');
  if (storedBuf.length !== incomingBuf.length) return false;
  if (!timingSafeEqual(storedBuf, incomingBuf)) return false;

  db.prepare(
    'UPDATE teachers SET passwordHash = ?, resetToken = NULL, resetTokenExpiresAt = NULL WHERE teacherId = ?'
  ).run(hashPasswordForStorage(newClientHash), teacher.teacherId);

  return true;
}

/**
 * Permanently deletes a teacher account and all associated data (essays + images).
 * Runs DB deletes in a transaction; image file removal is best-effort after commit.
 */
export function deleteTeacherAccount(teacherId) {
  // Collect image paths before deletion so we can clean up files after the DB commit
  const imagePaths = db
    .prepare('SELECT imagePath FROM essays WHERE teacherId = ? AND imagePath IS NOT NULL')
    .all(teacherId)
    .map((r) => r.imagePath);

  db.transaction(() => {
    db.prepare('DELETE FROM essays WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM turmas WHERE teacherId = ?').run(teacherId);
    db.prepare('DELETE FROM teachers WHERE teacherId = ?').run(teacherId);
  })();

  // Best-effort file cleanup — DB is already committed so we don't throw on failure
  for (const p of imagePaths) {
    try { rmSync(p, { force: true }); } catch (_) { /* ignore */ }
  }
}

/**
 * Salva ou atualiza o push token Expo de um professor.
 */
export function savePushToken(teacherId, pushToken) {
  db.prepare('UPDATE teachers SET pushToken = ? WHERE teacherId = ?')
    .run(pushToken ?? null, teacherId);
}

/**
 * Retorna o push token Expo do professor, ou null se não registrado.
 */
export function getTeacherPushToken(teacherId) {
  const row = db.prepare('SELECT pushToken FROM teachers WHERE teacherId = ?').get(teacherId);
  return row?.pushToken ?? null;
}
