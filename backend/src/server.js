import { networkInterfaces } from 'os';
import { app } from './app.js';
import { env } from './config/env.js';
import { initSentry } from './utils/sentry.js';
import { writeLog } from './utils/logger.js';
import { correctionQueue } from './utils/correction-queue.js';

initSentry();

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = app.listen(env.port, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`Backend rodando em http://${ip}:${env.port}`);
  console.log(`Health check: http://localhost:${env.port}/health`);
  console.log(`\n→ .env do app: EXPO_PUBLIC_BACKEND_URL=http://${ip}:${env.port}\n`);
  // Signal PM2 that the process is ready (wait_ready: true in ecosystem.config.cjs)
  process.send?.('ready');
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
// PM2 sends SIGINT by default; SIGTERM is used by systemd and Docker.
// We wait for the correction queue to drain (max kill_timeout from ecosystem)
// so in-flight OpenAI calls are not abandoned mid-correction.
async function shutdown(signal) {
  writeLog('info', 'shutdown_start', { signal });
  server.close(() => writeLog('info', 'http_server_closed', {}));

  try {
    // Wait up to ~145s for queued corrections to finish before PM2 force-kills
    await correctionQueue.onIdle();
  } catch {
    // If drain times out PM2 will SIGKILL us — that's fine
  }

  writeLog('info', 'shutdown_complete', { signal });
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
