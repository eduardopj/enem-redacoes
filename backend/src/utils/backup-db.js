#!/usr/bin/env node
/**
 * backup-db.js — Backup do banco SQLite.
 *
 * Uso manual (CLI):
 *   node src/utils/backup-db.js
 *
 * Uso programático (agendador interno):
 *   import { runBackup } from './backup-db.js';
 *   await runBackup();
 *
 * Mantém os últimos MAX_BACKUPS backups (padrão: 14).
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

function pruneOldBackups() {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('essays-') && f.endsWith('.db'))
    .map((f) => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  const toDelete = files.slice(MAX_BACKUPS);
  for (const f of toDelete) {
    rmSync(join(BACKUP_DIR, f.name));
    log('info', 'backup_pruned', { file: f.name });
  }
}

/**
 * Executa um backup online do SQLite (seguro mesmo com writes simultâneos em WAL mode).
 * Retorna o caminho do arquivo de backup criado.
 */
export async function runBackup() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const destPath = join(BACKUP_DIR, `essays-${ts}.db`);

  const db = new Database(DB_PATH, { readonly: true });
  try {
    await db.backup(destPath);
    const sizeBytes = statSync(destPath).size;
    log('info', 'backup_success', { destPath, sizeBytes });
    pruneOldBackups();
    return destPath;
  } finally {
    db.close();
  }
}

// Execução direta via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup().catch((err) => {
    log('error', 'backup_failed', { error: err.message });
    process.exit(1);
  });
}
