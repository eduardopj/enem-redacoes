/**
 * Redis cache utility — lazy-loaded, graceful fallback when Redis is unavailable.
 *
 * Usage:
 *   await cache.set('key', value, 30);  // TTL in seconds
 *   const hit = await cache.get<Type>('key');
 *   await cache.del('key');
 *   await cache.delPattern('essays:teacher-123:*');
 */

import { env } from '../config/env.js';
import { writeLog } from './logger.js';

type RedisClient = import('ioredis').default;

let client: RedisClient | null = null;

async function getClient(): Promise<RedisClient | null> {
  if (!env.redisUrl) return null;
  if (client) return client;
  try {
    const { default: Redis } = await import('ioredis');
    client = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    await client.connect();
    client.on('error', (err: Error) => {
      writeLog('warn', 'cache_redis_error', { error: err.message });
    });
    writeLog('info', 'cache_redis_connected', {});
    return client;
  } catch (err) {
    writeLog('warn', 'cache_redis_unavailable', { error: (err as Error).message });
    return null;
  }
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const c = await getClient();
    if (!c) return null;
    try {
      const raw = await c.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const c = await getClient();
    if (!c) return;
    try {
      await c.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // non-fatal
    }
  },

  async del(...keys: string[]): Promise<void> {
    const c = await getClient();
    if (!c) return;
    try {
      if (keys.length > 0) await c.del(...keys);
    } catch {
      // non-fatal
    }
  },

  async delPattern(pattern: string): Promise<void> {
    const c = await getClient();
    if (!c) return;
    try {
      const keys = await c.keys(pattern);
      if (keys.length > 0) await c.del(...keys);
    } catch {
      // non-fatal
    }
  },
};
