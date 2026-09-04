import { Hono } from 'hono';
import { retrievalIndex } from '../retrieval';
import { db } from '../db/client';
import { conversations } from '../db/schema';
import { sql } from 'drizzle-orm';

export const healthRoute = new Hono();

const startedAt = Date.now();

healthRoute.get('/health', async (c) => {
  let dbOk = true;
  try {
    await db.select({ count: sql<number>`count(*)` }).from(conversations);
  } catch {
    dbOk = false;
  }

  const embeddingStatus = retrievalIndex.status;

  return c.json({
    ok: dbOk,
    db: dbOk ? 'connected' : 'unreachable',
    embeddings: embeddingStatus,
    uptimeMs: Date.now() - startedAt,
  });
});
