import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { env } from '../env';
import { retrievalIndex } from '../retrieval';
import { db } from '../db/client';
import { messages as messagesTable } from '../db/schema';

export const debugRoute = new Hono();

debugRoute.use('*', async (c, next) => {
  if (!env.DEBUG_TOKEN) return c.json({ error: 'Debug routes disabled (DEBUG_TOKEN not set).' }, 404);
  const token = c.req.header('x-debug-token') || c.req.query('token');
  if (token !== env.DEBUG_TOKEN) return c.json({ error: 'Unauthorized' }, 401);
  await next();
});

// Retrieval inspection — see plan §Verification (Phase 2): "run ~15 real
// questions through /debug/search and eyeball chunk quality."
debugRoute.get('/debug/search', async (c) => {
  const query = c.req.query('q');
  if (!query) return c.json({ error: 'Missing ?q=' }, 400);
  const k = Number(c.req.query('k') ?? '6');
  const hits = await retrievalIndex.search(query, { k });
  return c.json({
    query,
    status: retrievalIndex.status,
    hits: hits.map((h) => ({ id: h.id, kind: h.kind, refId: h.refId, heading: h.heading, score: h.score, content: h.content })),
  });
});

// Full turn trace — messages seen, tools fired, args, results, tokens,
// cost, latency. See plan §Tracing: "debugging an agent loop without this
// is guesswork."
debugRoute.get('/debug/trace/:turnId', async (c) => {
  const turnId = c.req.param('turnId');
  const rows = await db.select().from(messagesTable).where(eq(messagesTable.turnId, turnId));
  return c.json({ turnId, messages: rows });
});
