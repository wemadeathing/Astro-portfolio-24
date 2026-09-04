// Standalone CLI entry for `npm run db:migrate`. Deliberately not imported
// by index.ts (or anything index.ts imports) — see migrate.ts for why that
// matters under tsup bundling.
import { runMigrations } from './migrate';
import { pool } from './client';

runMigrations()
  .then(() => {
    console.log('Migrations applied.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
