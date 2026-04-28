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
`);

export default db;
