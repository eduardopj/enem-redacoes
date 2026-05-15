import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { after, before, describe, it } from 'node:test';

// Set DATA_DIR before any module that imports database.js is loaded
const tmpDir = join(tmpdir(), `test-auth-svc-${process.pid}`);
mkdirSync(tmpDir, { recursive: true });
process.env.DATA_DIR = tmpDir;

const {
  hashPasswordForStorage,
  verifyStoredPasswordHash,
  registerTeacher,
  loginTeacher,
  revokeToken,
  validateToken,
} = await import('./auth.service.js');

after(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ok */ }
});

// ─── PBKDF2 hashing ──────────────────────────────────────────────────────────

describe('hashPasswordForStorage / verifyStoredPasswordHash', () => {
  const clientHash = 'a'.repeat(64); // simulate any 64-char client hash

  it('produces a "salt:hash" string', () => {
    const stored = hashPasswordForStorage(clientHash);
    assert.ok(stored.includes(':'), 'stored value must contain colon separator');
    const [salt, hash] = stored.split(':');
    assert.equal(salt.length, 32); // randomBytes(16).toString('hex')
    assert.equal(hash.length, 128); // pbkdf2 64 bytes → 128 hex chars
  });

  it('verifies correctly', () => {
    const stored = hashPasswordForStorage(clientHash);
    assert.equal(verifyStoredPasswordHash(clientHash, stored), true);
  });

  it('rejects wrong clientHash', () => {
    const stored = hashPasswordForStorage(clientHash);
    assert.equal(verifyStoredPasswordHash('b'.repeat(64), stored), false);
  });

  it('uses different salt each call — different stored value', () => {
    const a = hashPasswordForStorage(clientHash);
    const b = hashPasswordForStorage(clientHash);
    assert.notEqual(a, b);
  });

  it('returns false for missing inputs', () => {
    const stored = hashPasswordForStorage(clientHash);
    assert.equal(verifyStoredPasswordHash('', stored), false);
    assert.equal(verifyStoredPasswordHash(clientHash, ''), false);
    assert.equal(verifyStoredPasswordHash(clientHash, 'no-colon'), false);
  });
});

// ─── registerTeacher ─────────────────────────────────────────────────────────

describe('registerTeacher', () => {
  const hash = 'c'.repeat(64);

  it('creates a new teacher and returns a 64-char token', () => {
    const token = registerTeacher('reg-1', 'reg1@test.com', 'Reg One', hash);
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 64);
    assert.ok(/^[0-9a-f]+$/.test(token));
  });

  it('is idempotent with correct password — returns existing token', () => {
    const t1 = registerTeacher('reg-2', 'reg2@test.com', 'Reg Two', hash);
    const t2 = registerTeacher('reg-2', 'reg2@test.com', 'Reg Two', hash);
    assert.equal(t1, t2);
  });

  it('returns null when existing teacher provides wrong password', () => {
    registerTeacher('reg-3', 'reg3@test.com', 'Reg Three', hash);
    const result = registerTeacher('reg-3', 'reg3@test.com', 'Reg Three', 'd'.repeat(64));
    assert.equal(result, null);
  });

  it('upgrades legacy row — stores hash when teacher had none', () => {
    // Register without password (legacy)
    const t1 = registerTeacher('reg-legacy', 'legacy@test.com', 'Legacy');
    assert.ok(t1);
    // Re-register with a password — should upgrade and return same token
    const t2 = registerTeacher('reg-legacy', 'legacy@test.com', 'Legacy', hash);
    assert.equal(t1, t2);
    // Now verify that the password is stored — wrong password returns null
    const t3 = registerTeacher('reg-legacy', 'legacy@test.com', 'Legacy', 'e'.repeat(64));
    assert.equal(t3, null);
  });
});

// ─── loginTeacher ─────────────────────────────────────────────────────────────

describe('loginTeacher', () => {
  const email = 'login@test.com';
  const hash  = 'f'.repeat(64);

  before(() => {
    registerTeacher('login-teacher', email, 'Login Test', hash);
  });

  it('returns token + teacherId on success', () => {
    const result = loginTeacher(email, hash);
    assert.ok(result !== null);
    assert.equal(typeof result.token, 'string');
    assert.equal(result.token.length, 64);
    assert.equal(result.teacherId, 'login-teacher');
  });

  it('returns null for wrong password', () => {
    assert.equal(loginTeacher(email, '0'.repeat(64)), null);
  });

  it('returns null for unknown email', () => {
    assert.equal(loginTeacher('nobody@test.com', hash), null);
  });

  it('is case-insensitive on email', () => {
    const result = loginTeacher('LOGIN@TEST.COM', hash);
    assert.ok(result !== null);
  });

  it('returns null for teacher with no stored hash (legacy)', () => {
    registerTeacher('login-no-hash', 'nohash@test.com', 'No Hash');
    assert.equal(loginTeacher('nohash@test.com', hash), null);
  });
});

// ─── revokeToken + validateToken ─────────────────────────────────────────────

describe('validateToken + revokeToken', () => {
  const email = 'revoke@test.com';
  const hash  = '1'.repeat(64);
  let token;

  before(() => {
    registerTeacher('revoke-teacher', email, 'Revoke Test', hash);
    const result = loginTeacher(email, hash);
    token = result.token;
  });

  it('validates an active token', () => {
    const info = validateToken(token);
    assert.ok(info !== null);
    assert.equal(info.teacherId, 'revoke-teacher');
    assert.equal(info.teacherEmail, email);
  });

  it('returns null for unknown token', () => {
    assert.equal(validateToken('a'.repeat(64)), null);
  });

  it('returns null for short token', () => {
    assert.equal(validateToken('abc'), null);
  });

  it('returns null after revocation', () => {
    revokeToken(token);
    assert.equal(validateToken(token), null);
  });
});
