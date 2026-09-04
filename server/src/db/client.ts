import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { env } from '../env';

// Modest pool size — Railway hobby-tier Postgres has a limited connection
// count, and this is a single-instance service (no horizontal scale needed
// at this traffic level).
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });

export async function assertDbWritable(): Promise<void> {
  await pool.query('SELECT 1');
}
