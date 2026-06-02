#!/usr/bin/env node
/**
 * image-retention.js — Limpeza periódica de imagens de redações.
 *
 * Duas operações:
 *   1. cleanOrphanedImages — apaga arquivos .webp sem linha correspondente no banco.
 *   2. enforceQuotas       — quando um professor supera MAX_IMAGES_PER_TEACHER,
 *                            apaga as imagens mais antigas (mantém o banco intacto;
 *                            apenas o arquivo físico é removido).
 *
 * Uso standalone (cron):
 *   node src/utils/image-retention.js
 *
 * Cron (no droplet):
 *   0 4 * * * root cd /opt/enem-ia/backend && node src/utils/image-retention.js >> /opt/enem-ia/data/logs/retention.log 2>&1
 *
 * Variáveis de ambiente:
 *   DATA_DIR                 — mesma que o backend usa (padrão: ./data)
 *   MAX_IMAGES_PER_TEACHER   — limite de imagens por professor (padrão: 200)
 */

import Database from 'better-sqlite3';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '../../../data');
const IMAGES_DIR = join(DATA_DIR, 'images');
const DB_PATH = join(DATA_DIR, 'essays.db');
const MAX_IMAGES_PER_TEACHER = Number(process.env.MAX_IMAGES_PER_TEACHER ?? 200);

function log(level, message, meta = {}) {
  console.log(JSON.stringify({ level, message, service: 'image-retention', timestamp: new Date().toISOString(), ...meta }));
}

function deleteFile(filePath, reason, meta = {}) {
  try {
    rmSync(filePath);
    log('info', reason, { filePath, ...meta });
  } catch (err) {
    log('warn', 'delete_failed', { filePath, error: err.message });
  }
}

/**
 * Removes .webp files in IMAGES_DIR that have no matching DB row.
 * Safe to run while the server is live — only touches orphaned files.
 */
function cleanOrphanedImages(db) {
  let files;
  try {
    files = readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.webp'));
  } catch {
    // IMAGES_DIR doesn't exist yet — nothing to clean
    log('info', 'images_dir_missing', { IMAGES_DIR });
    return { checked: 0, deleted: 0 };
  }

  if (!files.length) return { checked: 0, deleted: 0 };

  // Build the set of essay IDs that have a stored imagePath in the DB
  const knownIds = new Set(
    db.prepare(`SELECT id FROM essays WHERE imagePath IS NOT NULL`).all().map((r) => r.id)
  );

  let deleted = 0;
  for (const file of files) {
    const essayId = file.replace(/\.webp$/, '');
    if (!knownIds.has(essayId)) {
      deleteFile(join(IMAGES_DIR, file), 'orphan_deleted', { essayId });
      deleted++;
    }
  }

  return { checked: files.length, deleted };
}

/**
 * For each teacher over MAX_IMAGES_PER_TEACHER, deletes the oldest image files
 * (by essay createdAt) until they're within quota. The DB row is preserved —
 * only the file is removed and imagePath is set to NULL so the UI knows.
 */
function enforceQuotas(db) {
  const teachers = db
    .prepare(
      `SELECT teacherId, COUNT(*) AS cnt
       FROM essays
       WHERE imagePath IS NOT NULL
       GROUP BY teacherId
       HAVING cnt > ?`
    )
    .all(MAX_IMAGES_PER_TEACHER);

  let totalDeleted = 0;

  for (const { teacherId, cnt } of teachers) {
    const excess = cnt - MAX_IMAGES_PER_TEACHER;
    // Oldest first (earliest createdAt), tiebreak by id for determinism
    const candidates = db
      .prepare(
        `SELECT id, imagePath
         FROM essays
         WHERE teacherId = ? AND imagePath IS NOT NULL
         ORDER BY COALESCE(createdAt, syncedAt) ASC, id ASC
         LIMIT ?`
      )
      .all(teacherId, excess);

    const clearPath = db.prepare(`UPDATE essays SET imagePath = NULL WHERE id = ?`);
    const doDelete = db.transaction(() => {
      for (const row of candidates) {
        clearPath.run(row.id);
      }
    });
    doDelete();

    for (const row of candidates) {
      deleteFile(row.imagePath, 'quota_evicted', { teacherId, essayId: row.id });
      totalDeleted++;
    }

    log('info', 'quota_enforced', { teacherId, over: excess, evicted: candidates.length });
  }

  return { teachers: teachers.length, deleted: totalDeleted };
}

function run() {
  log('info', 'retention_start', { MAX_IMAGES_PER_TEACHER, IMAGES_DIR });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  try {
    const orphanStats = cleanOrphanedImages(db);
    log('info', 'orphan_sweep_done', orphanStats);

    const quotaStats = enforceQuotas(db);
    log('info', 'quota_sweep_done', quotaStats);

    log('info', 'retention_done', {
      orphansDeleted: orphanStats.deleted,
      quotaEvicted: quotaStats.deleted,
    });
  } finally {
    db.close();
  }
}

run();
