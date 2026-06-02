import { env } from '../config/env.js';
import { runBackup } from '../utils/backup-db.js';
import { writeLog } from '../utils/logger.js';

const BACKUP_HOUR = Number(process.env.BACKUP_HOUR ?? 3); // 3am por padrão
const ALERT_EMAIL = process.env.BACKUP_ALERT_EMAIL ?? env.smtpFrom ?? null;

function msUntilNextHour(hour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function sendAlertEmail(errorMessage) {
  if (!ALERT_EMAIL) return;
  try {
    // Import lazy para não criar dependência circular se email.service importar logger
    const { sendAlertEmailRaw } = await import('./email.service.js');
    if (typeof sendAlertEmailRaw === 'function') {
      await sendAlertEmailRaw(ALERT_EMAIL, 'Falha no backup do banco — ENEM IA', errorMessage);
    }
  } catch {
    // Alerta por email é melhor-esforço — não deixa o scheduler morrer
  }
}

async function executeBackup() {
  writeLog('info', 'backup_scheduled_start', { hour: BACKUP_HOUR });
  try {
    const destPath = await runBackup();
    writeLog('info', 'backup_scheduled_success', { destPath });
  } catch (err) {
    const errorMessage = err?.message ?? String(err);
    writeLog('error', 'backup_scheduled_failed', { error: errorMessage });
    await sendAlertEmail(errorMessage);
  }
}

/**
 * Inicia o agendador de backup.
 * Roda uma vez por dia à hora configurada (BACKUP_HOUR, padrão 3am).
 * Usa setTimeout recursivo para se auto-reagendar após cada execução.
 */
export function startBackupScheduler() {
  const delay = msUntilNextHour(BACKUP_HOUR);
  const nextRun = new Date(Date.now() + delay).toISOString();

  writeLog('info', 'backup_scheduler_started', {
    backupHour: BACKUP_HOUR,
    nextRunAt: nextRun,
    nextRunInMinutes: Math.round(delay / 1000 / 60),
  });

  function schedule() {
    const ms = msUntilNextHour(BACKUP_HOUR);
    setTimeout(async () => {
      await executeBackup();
      schedule(); // reagenda para amanhã na mesma hora
    }, ms);
  }

  schedule();
}
