import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { after, before, describe, it } from 'node:test';

// Must be set before database.js is loaded by any dynamic import chain
const tmpDir = join(tmpdir(), `test-auth-routes-${process.pid}`);
mkdirSync(tmpDir, { recursive: true });
process.env.DATA_DIR = tmpDir;

const { app } = await import('../app.js');

let server;
let baseUrl;
const HASH = 'a'.repeat(64); // mock SHA-256 hex

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ok */ }
});

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

// ─── /register ───────────────────────────────────────────────────────────────

describe('POST /v1/auth/register', () => {
  it('registers a new teacher and returns a 64-char token', async () => {
    const { status, body } = await post('/v1/auth/register', {
      teacherId: 'route-t1', teacherEmail: 'route1@test.com', teacherName: 'Route One', passwordHash: HASH,
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.token.length, 64);
  });

  it('is idempotent with correct password', async () => {
    const r1 = await post('/v1/auth/register', {
      teacherId: 'route-t2', teacherEmail: 'route2@test.com', teacherName: 'Route Two', passwordHash: HASH,
    });
    const r2 = await post('/v1/auth/register', {
      teacherId: 'route-t2', teacherEmail: 'route2@test.com', teacherName: 'Route Two', passwordHash: HASH,
    });
    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.equal(r1.body.data.token, r2.body.data.token);
  });

  it('returns 401 for wrong password on existing teacher', async () => {
    await post('/v1/auth/register', {
      teacherId: 'route-t3', teacherEmail: 'route3@test.com', teacherName: 'Route Three', passwordHash: HASH,
    });
    const { status, body } = await post('/v1/auth/register', {
      teacherId: 'route-t3', teacherEmail: 'route3@test.com', teacherName: 'Route Three', passwordHash: 'b'.repeat(64),
    });
    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
  });

  it('rejects invalid body (missing teacherName)', async () => {
    const { status, body } = await post('/v1/auth/register', {
      teacherId: 'route-bad', teacherEmail: 'bad@test.com',
    });
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });
});

// ─── /login ──────────────────────────────────────────────────────────────────

describe('POST /v1/auth/login', () => {
  before(async () => {
    await post('/v1/auth/register', {
      teacherId: 'login-t1', teacherEmail: 'loginroute@test.com', teacherName: 'Login Route', passwordHash: HASH,
    });
  });

  it('returns token + teacherId on correct credentials', async () => {
    const { status, body } = await post('/v1/auth/login', {
      email: 'loginroute@test.com', passwordHash: HASH,
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.teacherId, 'login-t1');
    assert.equal(body.data.token.length, 64);
  });

  it('returns 401 for wrong password', async () => {
    const { status, body } = await post('/v1/auth/login', {
      email: 'loginroute@test.com', passwordHash: 'c'.repeat(64),
    });
    assert.equal(status, 401);
    assert.equal(body.error.code, 'INVALID_CREDENTIALS');
  });

  it('returns 401 for unknown email', async () => {
    const { status } = await post('/v1/auth/login', {
      email: 'nobody@test.com', passwordHash: HASH,
    });
    assert.equal(status, 401);
  });

  it('rejects non-email input', async () => {
    const { status } = await post('/v1/auth/login', {
      email: 'not-an-email', passwordHash: HASH,
    });
    assert.equal(status, 400);
  });
});

// ─── /logout ─────────────────────────────────────────────────────────────────

describe('POST /v1/auth/logout', () => {
  it('revokes the token and makes it invalid', async () => {
    const reg = await post('/v1/auth/register', {
      teacherId: 'logout-t1', teacherEmail: 'logout@test.com', teacherName: 'Logout', passwordHash: HASH,
    });
    const token = reg.body.data.token;

    const logoutRes = await post('/v1/auth/logout', {}, token);
    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);

    // Subsequent protected request with same token should fail
    const afterLogout = await post('/v1/auth/push-token', { pushToken: 'ExponentPushToken[xxx]' }, token);
    assert.equal(afterLogout.status, 401);
  });

  it('returns 401 without a token', async () => {
    const { status } = await post('/v1/auth/logout', {});
    assert.equal(status, 401);
  });
});
