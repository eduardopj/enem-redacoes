#!/usr/bin/env node
/**
 * backup-db.js — Backup diário do banco SQLite.
 *
 * Uso:
 *   node backup-db.js
 *
 * Cron (no droplet): 0 3 * * * cd /opt/enem-redacoes/backend && node src/utils/backup-db.js >> /var/log/enem-backup.log 2>&1
 *
 * Mantém os últimos 14 backups locais (2 semanas).
 * Se a env var BACKUP_DIR não estiver definida, usa ./data/backups.
 */

import Database from 'better-sqlite3';
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '../../data');
const BACKUP_DIR = process.env.BACKUP_DIR ?? join(DATA_DIR, 'backups');
const DB_PATH = join(DATA_DIR, 'essays.db');
const MAX_BACKUPS = Number(process.env.MAX_BACKUPS ?? 14);

function log(level, message, meta = {}) {
  console.log(JSON.stringify({ level, message, service: 'backup-db', timestamp: new Date().toISOString(), ...meta }));
}

function run() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const destPath = join(BACKUP_DIR, `essays-${ts}.db`);

  // Use SQLite's online backup API — safe even with concurrent writes (WAL mode)
  const db = new Database(DB_PATH, { readonly: true });
  db.backup(destPath)
    .then(() => {
      db.close();
      log('info', 'backup_success', { destPath, sizeBytes: statSync(destPath).size });
      pruneOldBackups();
    })
    .catch((err) => {
      db.close();
      log('error', 'backup_failed', { error: err.message });
      process.exit(1);
    });
}

function pruneOldBackups() {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('essays-') && f.endsWith('.db'))
    .map((f) => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime); // newest first

  const toDelete = files.slice(MAX_BACKUPS);
  for (const f of toDelete) {
    rmSync(join(BACKUP_DIR, f.name));
    log('info', 'backup_pruned', { file: f.name });
  }
}

run();
