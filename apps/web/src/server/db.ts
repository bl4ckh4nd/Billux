import path from 'node:path';
import process from 'node:process';

import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';

import { postgresSchema, sqliteSchema } from '../../drizzle/schema';

export type SqliteClient = {
  dialect: 'sqlite';
  db: BetterSQLite3Database<typeof sqliteSchema>;
  connection: Database;
};

export type PostgresClient = {
  dialect: 'postgres';
  db: NodePgDatabase<typeof postgresSchema>;
  pool: Pool;
};

export type DatabaseClient = SqliteClient | PostgresClient;

let cachedClient: DatabaseClient | undefined;

function shouldUsePostgres(): boolean {
  const client = process.env.DATABASE_CLIENT?.toLowerCase();
  if (client === 'pg' || client === 'postgres') {
    return true;
  }

  const url = process.env.DATABASE_URL;
  return typeof url === 'string' && url.startsWith('postgres');
}

function resolveSqlitePath(): string {
  if (process.env.SQLITE_DB_PATH) {
    return process.env.SQLITE_DB_PATH;
  }

  const baseDir = process.env.PORTABLE_EXECUTABLE_DIR ?? process.cwd();
  return path.resolve(baseDir, 'apps/web/drizzle/billux.db');
}

export function createDbClient(): DatabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  if (shouldUsePostgres()) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL must be provided when using the Postgres client');
    }

    const config: PoolConfig = { connectionString };
    if (process.env.DATABASE_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
    }

    const pool = new Pool(config);
    const db = drizzlePostgres(pool, { schema: postgresSchema });
    cachedClient = { dialect: 'postgres', db, pool };
    return cachedClient;
  }

  const sqlitePath = resolveSqlitePath();
  const connection = new Database(sqlitePath);
  const db = drizzleSqlite(connection, { schema: sqliteSchema });
  cachedClient = { dialect: 'sqlite', db, connection };
  return cachedClient;
}

export async function closeDbClient(): Promise<void> {
  if (!cachedClient) {
    return;
  }

  if (cachedClient.dialect === 'sqlite') {
    cachedClient.connection.close();
  } else {
    await cachedClient.pool.end();
  }

  cachedClient = undefined;
}
