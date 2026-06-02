import { env } from '../config/env.js';
import { writeLog } from './logger.js';

/**
 * Returns a rate-limit store for express-rate-limit.
 * Uses Redis (via ioredis) when REDIS_URL is set, in-memory otherwise.
 * The Redis path is lazy-loaded so the server starts fine without Redis.
 */
export async function createRateLimitStore() {
  if (!env.redisUrl) return undefined; // undefined → express-rate-limit uses its built-in MemoryStore

  try {
    const [{ default: Redis }, { RedisStore }] = await Promise.all([
      import('ioredis'),
      import('rate-limit-redis'),
    ]);

    const client = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    await client.connect();

    client.on('error', (err) => {
      writeLog('warn', 'redis_rate_limit_error', { error: err.message });
    });

    writeLog('info', 'redis_rate_limit_connected', { url: env.redisUrl.replace(/\/\/.*@/, '//<redacted>@') });

    return new RedisStore({ sendCommand: (...args) => client.call(...args) });
  } catch (err) {
    writeLog('warn', 'redis_rate_limit_unavailable', {
      error: err.message,
      fallback: 'in-memory store',
    });
    return undefined; // fall back gracefully to in-memory
  }
}
