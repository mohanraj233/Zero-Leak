import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { env } from '../config/env.js';

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let isConnected = false;

export function getDatabasePool(): Pool {
  if (!pool) {
    const connectionString = env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[ZeroLeak DB Pool] Unexpected database client error:', err.message);
      isConnected = false;
    });
  }
  return pool;
}

export function getDb() {
  if (!dbInstance) {
    const p = getDatabasePool();
    dbInstance = drizzle(p, { schema });
  }
  return dbInstance;
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  provider: string;
  error?: string;
}> {
  try {
    const p = getDatabasePool();
    const client = await p.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      return { connected: true, provider: 'Neon PostgreSQL (Drizzle ORM)' };
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      provider: 'Neon PostgreSQL (Drizzle ORM)',
      error: msg,
    };
  }
}

export { schema };
export const db = getDb();
