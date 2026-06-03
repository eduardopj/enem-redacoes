/**
 * Unified async DB client — SQLite in dev, PostgreSQL in production.
 *
 * Usage:
 *   import { query, queryOne, execute, transaction } from './db-client.js'
 *
 * Driver selection:
 *   DATABASE_URL set  → uses `postgres` (pg) package (async)
 *   DATABASE_URL unset → uses `better-sqlite3` (sync, wrapped in Promise.resolve)
 */

import { env } from '../config/env.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

// ─── Driver interface ─────────────────────────────────────────────────────────

interface DbDriver {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  transaction(ops: Array<[string, unknown[]]>): Promise<void>;
}

// ─── PostgreSQL driver (postgres package) ─────────────────────────────────────

interface PgSql {
  unsafe<T>(query: string, params?: unknown[]): Promise<T[]>;
  begin<T>(fn: (sql: PgSql) => Promise<T>): Promise<T>;
}

async function makePgDriver(databaseUrl: string): Promise<DbDriver> {
  const postgresModule = await import('postgres');
  // The `postgres` package exports the factory as default in ESM
  const postgres = (postgresModule.default ?? postgresModule) as unknown as (url: string, opts?: object) => PgSql;

  const sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });

  return {
    async query<T>(rawSql: string, params?: unknown[]): Promise<T[]> {
      const rows = await sql.unsafe<T>(rawSql, params ?? []);
      return rows as T[];
    },

    async queryOne<T>(rawSql: string, params?: unknown[]): Promise<T | null> {
      const rows = await sql.unsafe<T>(rawSql, params ?? []);
      return (rows as T[])[0] ?? null;
    },

    async execute(rawSql: string, params?: unknown[]): Promise<void> {
      await sql.unsafe(rawSql, params ?? []);
    },

    async transaction(ops: Array<[string, unknown[]]>): Promise<void> {
      await sql.begin(async (tx) => {
        for (const [rawSql, params] of ops) {
          await tx.unsafe(rawSql, params);
        }
      });
    },
  };
}

// ─── SQLite driver (better-sqlite3, sync → wrapped in Promise.resolve) ────────

async function makeSqliteDriver(): Promise<DbDriver> {
  // Import the already-initialized singleton db from database.ts (ESM dynamic import)
  const { default: db } = await import('./database.js') as { default: import('better-sqlite3').Database };

  const run = (sql: string, params: unknown[]) =>
    db.prepare(sql).run(...params);

  const all = <T>(sql: string, params: unknown[]): T[] =>
    db.prepare(sql).all(...params) as T[];

  const get = <T>(sql: string, params: unknown[]): T | undefined =>
    db.prepare(sql).get(...params) as T | undefined;

  return {
    async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
      return Promise.resolve(all<T>(sql, params ?? []));
    },

    async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
      const row = get<T>(sql, params ?? []);
      return Promise.resolve(row ?? null);
    },

    async execute(sql: string, params?: unknown[]): Promise<void> {
      run(sql, params ?? []);
      return Promise.resolve();
    },

    async transaction(ops: Array<[string, unknown[]]>): Promise<void> {
      db.transaction(() => {
        for (const [sql, params] of ops) {
          run(sql, params);
        }
      })();
      return Promise.resolve();
    },
  };
}

// ─── Driver selection — lazy singleton, initialized on first use ──────────────
//
// We cannot await at the module top level in all execution contexts, so we
// use a lazy-init pattern: the first call to any exported function resolves
// the driver promise and caches it for all subsequent calls.

let driverPromise: Promise<DbDriver> | null = null;

function getDriver(): Promise<DbDriver> {
  if (!driverPromise) {
    driverPromise = env.databaseUrl
      ? makePgDriver(env.databaseUrl)
      : makeSqliteDriver();
  }
  return driverPromise;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Run a SQL query and return all matching rows. */
export async function query<T = Row>(sql: string, params?: unknown[]): Promise<T[]> {
  return (await getDriver()).query<T>(sql, params);
}

/** Run a SQL query and return the first matching row, or null if no rows found. */
export async function queryOne<T = Row>(sql: string, params?: unknown[]): Promise<T | null> {
  return (await getDriver()).queryOne<T>(sql, params);
}

/** Run an INSERT / UPDATE / DELETE statement; returns void. */
export async function execute(sql: string, params?: unknown[]): Promise<void> {
  return (await getDriver()).execute(sql, params);
}

/**
 * Run multiple SQL statements atomically.
 * Each element is a [sql, params] tuple.
 */
export async function transaction(ops: Array<[string, unknown[]]>): Promise<void> {
  return (await getDriver()).transaction(ops);
}
