import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { env } from './env';
import { corsMiddleware } from './middleware/cors';
import { healthRoute } from './routes/health';
import { chatRoute, refreshCatalog } from './routes/chat';
import { intakeRoute } from './routes/intake';
import { sessionRoute } from './routes/session';
import { debugRoute } from './routes/debug';
import { runMigrations } from './db/migrate';
import { assertDbWritable } from './db/client';
import { retrievalIndex } from './retrieval';

const app = new Hono();

app.use('*', logger());
app.use('*', corsMiddleware);

app.route('/', healthRoute);
app.route('/', chatRoute);
app.route('/', intakeRoute);
app.route('/', sessionRoute);
app.route('/', debugRoute);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

async function main() {
  console.log(`Starting chat backend (${env.NODE_ENV})...`);

  await assertDbWritable().catch((err) => {
    console.error('Database is not reachable at boot:', err);
    process.exit(1);
  });

  await runMigrations();
  console.log('Migrations applied.');

  // Serve /health immediately, build the retrieval index in the background
  // — must not block the healthcheck, and search() degrades to lexical
  // while warming. See plan §Retrieval.
  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  });

  retrievalIndex
    .build()
    .then(() => refreshCatalog())
    .catch((err) => console.error('Retrieval index build failed (search will stay lexical-only):', err));
}

main().catch((err) => {
  console.error('Fatal boot error:', err);
  process.exit(1);
});
