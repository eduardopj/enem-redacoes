import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { after, before, describe, it } from 'node:test';

const tmpDir = join(tmpdir(), `test-sync-routes-${process.pid}`);
mkdirSync(tmpDir, { recursive: true });
process.env.DATA_DIR = tmpDir;

const { app } = await import('../app.js');

let server;
let baseUrl;
let teacherToken;
let otherToken;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Register two teachers
  const r1 = await post('/v1/auth/register', {
    teacherId: 'sync-teacher-1', teacherEmail: 'sync1@test.com', teacherName: 'Sync One',
    passwordHash: 'a'.repeat(64),
  });
  teacherToken = r1.body.data.token;

  const r2 = await post('/v1/auth/register', {
    teacherId: 'sync-teacher-2', teacherEmail: 'sync2@test.com', teacherName: 'Sync Two',
    passwordHash: 'b'.repeat(64),
  });
  otherToken = r2.body.data.token;

  // Register a turma for teacher 1
  await post('/v1/sync/turmas', {
    joinCode: 'TSTCOD', teacherId: 'sync-teacher-1', teacherName: 'Sync One',
    teacherEmail: 'sync1@test.com', turmaId: 'turma-1', turmaName: 'Turma Teste',
  }, teacherToken);
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
    method: 'POST', headers, body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { headers });
  return { status: res.status, body: await res.json() };
}

function makeEssay(id, teacherId = 'sync-teacher-1') {
  return {
    id, teacherId, studentId: 'student-1', studentName: 'Aluno Teste',
    turmaId: 'turma-1', turmaName: 'Turma Teste', themeTitle: 'Tema X',
    inputMode: 'manuscrita', essayText: 'Texto da redação.', status: 'corrigida',
    totalScore: 720, correctionJson: { totalScore: 720 },
    createdAt: new Date().toISOString(),
  };
}

// ─── POST /sync/essays ───────────────────────────────────────────────────────

describe('POST /v1/sync/essays', () => {
  it('upserts an essay successfully', async () => {
    const essay = makeEssay('essay-1');
    const { status, body } = await post('/v1/sync/essays', essay, teacherToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.ok, true);
  });

  it('rejects when body teacherId does not match token (IDOR)', async () => {
    const essay = makeEssay('essay-idor', 'sync-teacher-2'); // wrong teacherId for this token
    const { status, body } = await post('/v1/sync/essays', essay, teacherToken);
    assert.equal(status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  });

  it('returns 401 without a token', async () => {
    const { status } = await post('/v1/sync/essays', makeEssay('essay-noauth'));
    assert.equal(status, 401);
  });
});

// ─── GET /sync/essays ────────────────────────────────────────────────────────

describe('GET /v1/sync/essays', () => {
  before(async () => {
    // Insert several essays for teacher 1 and one for teacher 2
    for (let i = 2; i <= 5; i++) {
      await post('/v1/sync/essays', makeEssay(`essay-${i}`), teacherToken);
    }
    await post('/v1/sync/essays', makeEssay('essay-other', 'sync-teacher-2'), otherToken);
  });

  it('returns only essays owned by the authenticated teacher', async () => {
    const { status, body } = await get('/v1/sync/essays', teacherToken);
    assert.equal(status, 200);
    assert.equal(body.success, true);
    const ids = body.data.map((e) => e.id);
    assert.ok(!ids.includes('essay-other'), 'must not return essays of other teacher');
    assert.ok(ids.includes('essay-1'));
  });

  it('returns 401 without a token', async () => {
    const { status } = await get('/v1/sync/essays');
    assert.equal(status, 401);
  });
});

// ─── GET /sync/essays/:id ────────────────────────────────────────────────────

describe('GET /v1/sync/essays/:id', () => {
  it('returns the essay to its owner', async () => {
    const { status, body } = await get('/v1/sync/essays/essay-1', teacherToken);
    assert.equal(status, 200);
    assert.equal(body.data.id, 'essay-1');
  });

  it('returns 403 when accessed by another teacher (IDOR)', async () => {
    const { status } = await get('/v1/sync/essays/essay-1', otherToken);
    assert.equal(status, 403);
  });

  it('returns 404 for unknown id', async () => {
    const { status } = await get('/v1/sync/essays/does-not-exist', teacherToken);
    assert.equal(status, 404);
  });
});

// ─── GET /sync/turmas/by-code (public) ───────────────────────────────────────

describe('GET /v1/sync/turmas/by-code/:code', () => {
  it('returns turma data for a valid code', async () => {
    const { status, body } = await get('/v1/sync/turmas/by-code/TSTCOD');
    assert.equal(status, 200);
    assert.equal(body.data.turmaId, 'turma-1');
    assert.equal(body.data.teacherId, 'sync-teacher-1');
  });

  it('returns 404 for unknown code', async () => {
    const { status } = await get('/v1/sync/turmas/by-code/XXXXXX');
    assert.equal(status, 404);
  });

  it('is accessible without authentication', async () => {
    // No token — should still work
    const { status } = await get('/v1/sync/turmas/by-code/TSTCOD');
    assert.equal(status, 200);
  });
});
