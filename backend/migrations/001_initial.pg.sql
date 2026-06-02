-- PostgreSQL schema for ENEM IA backend
-- Equivalent to the SQLite schema in database.js + all idempotent migrations.
-- Run once against a fresh PostgreSQL database before starting the server.
--
-- Usage:
--   psql $DATABASE_URL -f backend/migrations/001_initial.pg.sql

-- ── teachers ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teachers (
  "teacherId"            TEXT        PRIMARY KEY,
  "teacherEmail"         TEXT        NOT NULL DEFAULT '',
  "teacherName"          TEXT        NOT NULL DEFAULT '',
  "token"                TEXT        NOT NULL UNIQUE,
  "passwordHash"         TEXT,
  "expiresAt"            TIMESTAMPTZ,
  "revokedAt"            TIMESTAMPTZ,
  "pushToken"            TEXT,
  "resetToken"           TEXT,
  "resetTokenExpiresAt"  TIMESTAMPTZ,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_token    ON teachers ("token");
CREATE INDEX IF NOT EXISTS idx_teachers_email    ON teachers (LOWER("teacherEmail"));

-- ── turmas ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS turmas (
  "joinCode"     TEXT PRIMARY KEY,
  "teacherId"    TEXT NOT NULL,
  "teacherName"  TEXT NOT NULL DEFAULT '',
  "teacherEmail" TEXT NOT NULL DEFAULT '',
  "turmaId"      TEXT NOT NULL,
  "turmaName"    TEXT NOT NULL DEFAULT '',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turmas_teacher ON turmas ("teacherId");

-- ── essays ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS essays (
  "id"                  TEXT        PRIMARY KEY,
  "teacherId"           TEXT        NOT NULL,
  "studentId"           TEXT        NOT NULL,
  "studentName"         TEXT,
  "turmaId"             TEXT,
  "turmaName"           TEXT,
  "themeTitle"          TEXT,
  "inputMode"           TEXT        NOT NULL DEFAULT 'manuscrita',
  "essayText"           TEXT,
  "status"              TEXT        NOT NULL DEFAULT 'corrigida',
  "totalScore"          INTEGER,
  "teacherScore"        INTEGER,
  "teacherNote"         TEXT,
  "correctionJson"      TEXT,
  "imagePath"           TEXT,
  "imageS3Key"          TEXT,           -- S3 object key (null when using local storage)
  "submittedByStudent"  INTEGER         NOT NULL DEFAULT 0,
  "createdAt"           TIMESTAMPTZ,
  "correctedAt"         TIMESTAMPTZ,
  "updatedAt"           TIMESTAMPTZ,
  "syncedAt"            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_essays_teacher        ON essays ("teacherId");
CREATE INDEX IF NOT EXISTS idx_essays_student        ON essays ("studentId");
CREATE INDEX IF NOT EXISTS idx_essays_turma          ON essays ("turmaId");
CREATE INDEX IF NOT EXISTS idx_essays_status         ON essays ("status");
CREATE INDEX IF NOT EXISTS idx_essays_teacher_synced ON essays ("teacherId", "syncedAt" DESC);
