import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { db } from '../db/client';
import { conversations, messages as messagesTable } from '../db/schema';
import { sanitizeUserInput } from '../safety/sanitize';
import { isReadyToSubmit } from '../../../shared/intake';

export const sessionRoute = new Hono();

// Rehydrates the active (not-yet-submitted) conversation for a session on
// page load — replaces the old localStorage-only persistence with a real
// server-side history that also restores cards and tool traces, not just
// intake fields. See plan §Frontend.
sessionRoute.get('/session/:sessionId/conversation', async (c) => {
  const sessionId = c.req.param('sessionId');
  const headerSessionId = c.req.header('x-session-id');
  if (!headerSessionId || headerSessionId !== sessionId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // "Active" means not yet submitted/reset (submittedAt IS NULL) — NOT
  // readyToSubmit=false, which means something entirely different (whether
  // the intake has enough fields to allow submission). Those two happened
  // to move together on a real submit (both flip at once — see intake.ts),
  // masking that this filter was checking the wrong column until the
  // "New chat" reset path set submittedAt alone and this query kept
  // returning the reset conversation anyway.
  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.sessionId, sessionId), isNull(conversations.submittedAt)))
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  if (!conv) return c.json({ conversation: null, messages: [] });

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id))
    .orderBy(messagesTable.createdAt);

  return c.json({
    conversation: {
      id: conv.id,
      mode: conv.mode,
      flow: conv.flow,
      quoteFields: conv.quoteFields,
      contentFields: conv.contentFields,
      readyToSubmit: conv.readyToSubmit,
    },
    messages: history.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      uiPayload: m.uiPayload,
    })),
  });
});

const FieldEditSchema = z.object({ field: z.string().min(1).max(64), value: z.string().max(2000) });

// Direct, non-LLM field correction — for the inline edit affordance in
// IntakeCard. Bypasses the model entirely (an administrative correction,
// not a conversational turn) but still goes through the DB, which is what
// /intake/submit actually reads from — a local-only edit that never
// reached here would be silently discarded at submit time.
sessionRoute.patch('/conversation/:id/fields', async (c) => {
  const id = c.req.param('id');
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) return c.json({ ok: false, error: 'Missing session.' }, 400);

  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const parsed = FieldEditSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: 'Invalid request.' }, 400);

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv || conv.sessionId !== sessionId) return c.json({ ok: false, error: 'Not found' }, 404);

  const value = sanitizeUserInput(parsed.data.value);
  const key = parsed.data.field;

  // A direct edit is the user's deliberate, final word on this field — lock
  // it so a later chat turn's save_intake_fields can't silently clobber it
  // by re-sending a stale remembered value the model was never told changed
  // (see shared/intake.ts's isReadyToSubmit comment and tools/intake.ts).
  const manualEditFields = conv.manualEditFields?.includes(key)
    ? conv.manualEditFields
    : [...(conv.manualEditFields ?? []), key];

  // Mirror propose_submission's bar here too — a direct field edit (e.g.
  // filling name/email straight into the card) must be able to unlock
  // Submit on its own, without waiting for the model to independently call
  // propose_submission on some later turn. isReadyToSubmit is the single
  // shared definition of that bar (see shared/intake.ts) — kept in sync
  // with the tool and the client's own optimistic update.
  if (conv.flow === 'content') {
    const contentFields = { ...conv.contentFields, [key]: value };
    await db
      .update(conversations)
      .set({
        contentFields,
        manualEditFields,
        readyToSubmit: isReadyToSubmit(conv.flow, contentFields),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id));
  } else {
    const quoteFields = { ...conv.quoteFields, [key]: value };
    await db
      .update(conversations)
      .set({
        quoteFields,
        manualEditFields,
        readyToSubmit: isReadyToSubmit(conv.flow, quoteFields),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id));
  }

  return c.json({ ok: true });
});

sessionRoute.post('/conversation/:id/reset', async (c) => {
  const id = c.req.param('id');
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) return c.json({ error: 'Missing session.' }, 400);

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv || conv.sessionId !== sessionId) return c.json({ error: 'Not found' }, 404);

  // "Reset" marks the conversation as submitted so it drops out of the
  // active-conversation lookup, rather than deleting history — cheap audit
  // trail, and the next /chat call with no conversationId just creates a
  // fresh row.
  await db.update(conversations).set({ submittedAt: new Date() }).where(eq(conversations.id, id));
  return c.json({ ok: true });
});
