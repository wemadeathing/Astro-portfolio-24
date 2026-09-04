// The ONLY place that sends a lead email — see plan §Architecture ("No tool
// sends email"). Triggered by a human clicking Submit; fields are read from
// the DB row, not the request body, so the model cannot cause an email and
// the client cannot forge its contents.
import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../db/client';
import { conversations, leads } from '../db/schema';
import { submitRateLimit } from '../middleware/rateLimit';
import { sendLeadEmail } from '../email/resend';

export const intakeRoute = new Hono();

const SubmitBodySchema = z.object({
  conversationId: z.string().min(1),
  honeypot: z.string().optional(),
});

intakeRoute.post('/intake/submit', submitRateLimit, async (c) => {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) return c.json({ success: false, error: 'Missing session.' }, 400);

  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const parsed = SubmitBodySchema.safeParse(body);
  if (!parsed.success) return c.json({ success: false, error: 'Invalid request.' }, 400);

  // Honeypot: silently succeed without sending anything.
  if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
    return c.json({ success: true });
  }

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, parsed.data.conversationId)).limit(1);
  if (!conv || conv.sessionId !== sessionId) return c.json({ success: false, error: 'Not found.' }, 403);
  if (!conv.readyToSubmit) return c.json({ success: false, error: 'Not ready to submit yet.' }, 409);
  if (conv.submittedAt) return c.json({ success: true, alreadySubmitted: true }); // idempotent — double-click safe

  const flow = conv.flow ?? 'quote';
  const fields = (flow === 'content' ? conv.contentFields : conv.quoteFields) as Record<string, string>;

  if (!fields.name || !fields.email) {
    return c.json({ success: false, error: 'Name and email are required.' }, 400);
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email);
  if (!emailOk) return c.json({ success: false, error: 'Please provide a valid email.' }, 400);

  const result = await sendLeadEmail(flow, fields);

  await db.insert(leads).values({
    id: randomUUID(),
    conversationId: conv.id,
    flow,
    fields,
    email: fields.email,
    emailStatus: result.ok ? 'sent' : 'failed',
    resendId: result.resendId,
  });

  if (!result.ok) {
    return c.json({ success: false, error: result.error || 'Failed to send' }, 400);
  }

  await db.update(conversations).set({ submittedAt: new Date() }).where(eq(conversations.id, conv.id));

  return c.json({ success: true });
});
