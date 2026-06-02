#!/usr/bin/env node
/**
 * One-shot migration: exports all data from the SQLite database and imports
 * it into PostgreSQL. Run ONCE against an empty PostgreSQL database that has
 * already been initialized with 001_initial.pg.sql.
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host:5432/db \
 *   DATA_DIR=/path/to/data \
 *   node backend/migrations/migrate-sqlite-to-pg.js
 *
 * The script is idempotent: it uses ON CONFLICT DO NOTHING so re-running it
 * after a partial failure is safe. Stop the app before running to avoid
 * concurrent writes.
 */

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import postgres from 'postgres';

const DATA_DIR = process.env.DATA_DIR
  ?? join(fileURLToPath(import.meta.url), '../../../data');
const SQLITE_PATH = join(DATA_DIR, 'essays.db');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL env var is required.');
  process.exit(1);
}

if (!existsSync(SQLITE_PATH)) {
  console.error(`ERROR: SQLite database not found at ${SQLITE_PATH}`);
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const sql = postgres(DATABASE_URL, { max: 1 });

async function migrate() {
  console.log(`Migrating from SQLite (${SQLITE_PATH}) → PostgreSQL (${DATABASE_URL.replace(/\/\/.*@/, '//<redacted>@')})`);

  // ── teachers ───────────────────────────────────────────────────────────────
  const teachers = sqlite.prepare('SELECT * FROM teachers').all();
  console.log(`  teachers: ${teachers.length} rows`);

  if (teachers.length > 0) {
    for (const t of teachers) {
      await sql`
        INSERT INTO teachers
          ("teacherId", "teacherEmail", "teacherName", "token", "passwordHash",
           "expiresAt", "revokedAt", "pushToken", "resetToken", "resetTokenExpiresAt", "createdAt")
        VALUES (
          ${t.teacherId}, ${t.teacherEmail ?? ''}, ${t.teacherName ?? ''}, ${t.token},
          ${t.passwordHash ?? null},
          ${t.expiresAt ? new Date(t.expiresAt) : null},
          ${t.revokedAt ? new Date(t.revokedAt) : null},
          ${t.pushToken ?? null},
          ${t.resetToken ?? null},
          ${t.resetTokenExpiresAt ? new Date(t.resetTokenExpiresAt) : null},
          ${t.createdAt ? new Date(t.createdAt) : new Date()}
        )
        ON CONFLICT ("teacherId") DO NOTHING
      `;
    }
    console.log('  ✓ teachers done');
  }

  // ── turmas ─────────────────────────────────────────────────────────────────
  const turmas = sqlite.prepare('SELECT * FROM turmas').all();
  console.log(`  turmas: ${turmas.length} rows`);

  if (turmas.length > 0) {
    for (const t of turmas) {
      await sql`
        INSERT INTO turmas
          ("joinCode", "teacherId", "teacherName", "teacherEmail", "turmaId", "turmaName", "createdAt")
        VALUES (
          ${t.joinCode}, ${t.teacherId}, ${t.teacherName ?? ''}, ${t.teacherEmail ?? ''},
          ${t.turmaId}, ${t.turmaName ?? ''},
          ${t.createdAt ? new Date(t.createdAt) : new Date()}
        )
        ON CONFLICT ("joinCode") DO NOTHING
      `;
    }
    console.log('  ✓ turmas done');
  }

  // ── essays ─────────────────────────────────────────────────────────────────
  const essays = sqlite.prepare('SELECT * FROM essays').all();
  console.log(`  essays: ${essays.length} rows`);

  const BATCH = 100;
  for (let i = 0; i < essays.length; i += BATCH) {
    const batch = essays.slice(i, i + BATCH);
    for (const e of batch) {
      await sql`
        INSERT INTO essays
          ("id", "teacherId", "studentId", "studentName", "turmaId", "turmaName",
           "themeTitle", "inputMode", "essayText", "status",
           "totalScore", "teacherScore", "teacherNote", "correctionJson",
           "imagePath", "submittedByStudent",
           "createdAt", "correctedAt", "updatedAt", "syncedAt")
        VALUES (
          ${e.id}, ${e.teacherId}, ${e.studentId}, ${e.studentName ?? null},
          ${e.turmaId ?? null}, ${e.turmaName ?? null},
          ${e.themeTitle ?? null}, ${e.inputMode ?? 'manuscrita'}, ${e.essayText ?? null},
          ${e.status ?? 'corrigida'},
          ${e.totalScore ?? null}, ${e.teacherScore ?? null}, ${e.teacherNote ?? null},
          ${e.correctionJson ?? null},
          ${e.imagePath ?? null}, ${e.submittedByStudent ?? 0},
          ${e.createdAt ? new Date(e.createdAt) : null},
          ${e.correctedAt ? new Date(e.correctedAt) : null},
          ${e.updatedAt ? new Date(e.updatedAt) : null},
          ${e.syncedAt ? new Date(e.syncedAt) : new Date()}
        )
        ON CONFLICT ("id") DO NOTHING
      `;
    }
    console.log(`  essays: ${Math.min(i + BATCH, essays.length)}/${essays.length}`);
  }
  console.log('  ✓ essays done');

  console.log('\nMigration complete. Verify row counts:');
  const pgTeachers = await sql`SELECT COUNT(*) FROM teachers`;
  const pgTurmas   = await sql`SELECT COUNT(*) FROM turmas`;
  const pgEssays   = await sql`SELECT COUNT(*) FROM essays`;
  console.log(`  PostgreSQL — teachers: ${pgTeachers[0].count}, turmas: ${pgTurmas[0].count}, essays: ${pgEssays[0].count}`);
  console.log(`  SQLite     — teachers: ${teachers.length}, turmas: ${turmas.length}, essays: ${essays.length}`);
}

migrate()
  .then(() => { sqlite.close(); sql.end(); process.exit(0); })
  .catch((err) => { console.error('Migration failed:', err); sqlite.close(); sql.end(); process.exit(1); });
