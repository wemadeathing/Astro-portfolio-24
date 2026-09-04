// Applies committed Drizzle migrations on boot. Safe to run repeatedly —
// drizzle-orm tracks which migrations have already been applied. Env vars
// come from the platform in production, or via `tsx --env-file=.env` in
// local dev (see package.json) — no dotenv import here, since dotenv is a
// CJS package that tsup's ESM bundle can't `require()` at runtime.
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './client';

// No "run standalone via import.meta.url === process.argv[1]" check here —
// tsup bundles this file into dist/index.js, merging its module identity
// with the main entry point, so that check would fire a *second* time on
// every production boot (triggered by index.ts's own invocation) and call
// pool.end() out from under the server. See migrate-cli.ts for the
// `npm run db:migrate` standalone entry, which is never imported by
// index.ts and so never gets bundled together with it.
export async function runMigrations(): Promise<void> {
  // process.cwd(), not import.meta.url — tsup bundles this file into
  // dist/index.js, so import.meta.url would resolve relative to dist/ in
  // production instead of the source file's original location (same class
  // of bug as content/load.ts and content/chunk.ts). cwd is server/ in both
  // `tsx src/db/migrate.ts` (dev) and the Docker runtime image (prod).
  await migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });
}
