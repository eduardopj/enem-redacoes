import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRequestId } from './request-context.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '../../../data');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const LOG_LEVEL = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;
const LOG_DIR = join(DATA_DIR, 'logs');
const LOG_FILE = join(LOG_DIR, 'app.log');
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // If we can't create the log directory, file logging will be silently skipped
}

function rotateIfNeeded() {
  try {
    if (!existsSync(LOG_FILE)) return;
    if (statSync(LOG_FILE).size < MAX_BYTES) return;
    renameSync(LOG_FILE, `${LOG_FILE}.1`);
  } catch {
    // Rotation failure is non-fatal
  }
}

function writeToFile(line) {
  try {
    rotateIfNeeded();
    appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {
    // File write failure is non-fatal — console output still works
  }
}

export function writeLog(level, message, meta = {}) {
  if ((LEVELS[level] ?? LEVELS.info) > LOG_LEVEL) return;
  const entry = {
    level,
    message,
    service: 'enem-redacoes-backend',
    timestamp: new Date().toISOString(),
    // Auto-injected from AsyncLocalStorage — '-' when outside request context (startup, cron, etc.)
    requestId: getRequestId(),
    ...meta,
  };
  const line = JSON.stringify(entry);

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  writeToFile(line);
}
