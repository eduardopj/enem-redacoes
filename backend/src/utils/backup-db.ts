#!/usr/bin/env node
/**
 * backup-db.ts — Backup do banco SQLite.
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
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '../../data');
const BACKUP_DIR = process.env.BACKUP_DIR ?? join(DATA_DIR, 'backups');
const DB_PATH = join(DATA_DIR, 'essays.db');
const MAX_BACKUPS = Number(process.env.MAX_BACKUPS ?? 14);

function log(level: string, message: string, meta: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level, message, service: 'backup-db', timestamp: new Date().toISOString(), ...meta }));
}

function pruneOldBackups(): void {
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

// ── S3 offsite upload ─────────────────────────────────────────────────────────
// Set BACKUP_S3_BUCKET (and optionally BACKUP_S3_REGION / BACKUP_S3_PREFIX)
// to have each backup automatically copied to S3 after the local write.
// Offsite failure is non-fatal: local backup is kept and a warning is logged.

async function uploadBackupToS3(localPath: string, ts: string): Promise<{ key: string; bucket: string }> {
  const bucket = process.env.BACKUP_S3_BUCKET!;
  const region = process.env.BACKUP_S3_REGION || 'us-east-1';
  const prefix = process.env.BACKUP_S3_PREFIX || 'db-backups/';
  const key = `${prefix}essays-${ts}.db`;

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const body = readFileSync(localPath);
  const client = new S3Client({ region });

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/x-sqlite3',
    ServerSideEncryption: 'AES256',
  }));

  log('info', 'backup_s3_uploaded', { key, bucket, region, sizeBytes: body.length });
  return { key, bucket };
}

/**
 * Executa um backup online do SQLite (seguro mesmo com writes simultâneos em WAL mode).
 * Se BACKUP_S3_BUCKET estiver definido, copia o arquivo para S3 após o backup local.
 * Retorna o caminho do arquivo de backup criado.
 */
export async function runBackup(): Promise<string> {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const destPath = join(BACKUP_DIR, `essays-${ts}.db`);

  const db = new Database(DB_PATH, { readonly: true });
  try {
    await db.backup(destPath);
    const sizeBytes = statSync(destPath).size;
    log('info', 'backup_success', { destPath, sizeBytes });
    pruneOldBackups();

    if (process.env.BACKUP_S3_BUCKET) {
      try {
        await uploadBackupToS3(destPath, ts);
      } catch (err) {
        log('warn', 'backup_s3_failed', { error: (err as Error).message });
      }
    }

    return destPath;
  } finally {
    db.close();
  }
}

// Execução direta via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup().catch((err: Error) => {
    log('error', 'backup_failed', { error: err.message });
    process.exit(1);
  });
}
