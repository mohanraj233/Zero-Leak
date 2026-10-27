import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as path from 'path';

export async function runMigrations() {
  const connectionString = env.DIRECT_DATABASE_URL || env.DATABASE_URL;
  console.log('[ZeroLeak Migrations] Connecting to Neon database for migrations...');

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
    max: 1,
  });

  try {
    const db = drizzle(pool);
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle/migrations');
    console.log(`[ZeroLeak Migrations] Applying Drizzle migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('[ZeroLeak Migrations] Successfully applied all migrations.');
  } catch (err) {
    console.error('[ZeroLeak Migrations] Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
