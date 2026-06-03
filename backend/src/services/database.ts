import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// DATA_DIR env var used in production (Railway volume mount). Falls back to backend/data/ locally.
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '../../data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'essays.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    teacherId    TEXT PRIMARY KEY,
    teacherEmail TEXT,
    teacherName  TEXT,
    token        TEXT NOT NULL UNIQUE,
    createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS turmas (
    joinCode    TEXT PRIMARY KEY,
    teacherId   TEXT NOT NULL,
    teacherName TEXT NOT NULL,
    teacherEmail TEXT NOT NULL,
    turmaId     TEXT NOT NULL,
    turmaName   TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS essays (
    id          TEXT PRIMARY KEY,
    teacherId   TEXT NOT NULL,
    studentId   TEXT NOT NULL,
    studentName TEXT,
    turmaId     TEXT,
    turmaName   TEXT,
    themeTitle  TEXT,
    inputMode   TEXT DEFAULT 'manuscrita',
    essayText   TEXT,
    status      TEXT DEFAULT 'corrigida',
    totalScore  INTEGER,
    teacherScore INTEGER,
    teacherNote TEXT,
    correctionJson TEXT,
    createdAt   TEXT,
    correctedAt TEXT,
    syncedAt    TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_teacher ON essays(teacherId);
  CREATE INDEX IF NOT EXISTS idx_student ON essays(studentId);
  CREATE INDEX IF NOT EXISTS idx_turma   ON essays(turmaId);

  -- Cursor-pagination index: covers WHERE teacherId = ? ORDER BY syncedAt
  CREATE INDEX IF NOT EXISTS idx_teacher_synced ON essays(teacherId, syncedAt);
  -- Status filter used by dashboard and queue resume
  CREATE INDEX IF NOT EXISTS idx_status ON essays(status);
  -- Token lookup on every authenticated request
  CREATE INDEX IF NOT EXISTS idx_token ON teachers(token);
`);

// Idempotent schema migrations — ADD COLUMN is safe to run on existing DBs
try { db.exec(`ALTER TABLE teachers ADD COLUMN expiresAt TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE teachers ADD COLUMN pushToken TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE teachers ADD COLUMN passwordHash TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE teachers ADD COLUMN revokedAt TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE essays ADD COLUMN updatedAt TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE essays ADD COLUMN imagePath TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE essays ADD COLUMN submittedByStudent INTEGER DEFAULT 0`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE teachers ADD COLUMN resetToken TEXT`); } catch (_) { /* already exists */ }
try { db.exec(`ALTER TABLE teachers ADD COLUMN resetTokenExpiresAt TEXT`); } catch (_) { /* already exists */ }

export default db;
