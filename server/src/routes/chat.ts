import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../db/client';
import { conversations, messages as messagesTable } from '../db/schema';
import { chatRateLimit } from '../middleware/rateLimit';
import { isUnderDailyCostCap, recordUsage } from '../middleware/budget';
import { sanitizeUserInput } from '../safety/sanitize';
import { route } from '../agent/router';
import { modes } from '../agent/modes';
import { runAgent } from '../agent/runner';
import { retrievalIndex } from '../retrieval';
import { loadContent, type ContentCatalog } from '../content/load';
import { estimateCostUsd } from '../llm/client';
import type { ConversationState } from '../agent/types';
import type { Mode, UiPayload } from '../db/schema';

export const chatRoute = new Hono();

const TURN_BUDGET_MS = 25_000;
const MAX_CONVERSATION_MESSAGES = 40;
const HISTORY_TURNS = 20;

// Loaded once at boot, refreshed whenever the retrieval index rebuilds
// (content changes rarely enough that per-request reloading would be pure
// waste — see plan §Retrieval "on boot, content-hash gated").
let catalogCache: ContentCatalog | null = null;
export function getCatalog(): ContentCatalog {
  if (!catalogCache) catalogCache = loadContent();
  return catalogCache;
}
export function refreshCatalog(): void {
  catalogCache = loadContent();
}

chatRoute.post('/chat', chatRateLimit, async (c) => {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) {
    return c.json({ reply: 'Missing session.' }, 400);
  }

  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const rawMessage = typeof body.message === 'string' ? body.message : '';
  const message = sanitizeUserInput(rawMessage);
  const chipId = typeof body.chipId === 'string' ? body.chipId : undefined;
  const requestedConversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;

  if (!message.trim()) {
    return c.json({ reply: 'Please enter a message.' }, 400);
  }

  if (!(await isUnderDailyCostCap())) {
    return c.json({ reply: "I've hit today's usage limit — please try again tomorrow, or reach out via the contact page." }, 429);
  }

  // Load or create the conversation. Session id is untrusted correlation,
  // never auth — see plan §Session.
  let conv: typeof conversations.$inferSelect | undefined;
  if (requestedConversationId) {
    const [found] = await db.select().from(conversations).where(eq(conversations.id, requestedConversationId)).limit(1);
    if (found && found.sessionId === sessionId) conv = found;
  }
  if (!conv) {
    const [newest] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.sessionId, sessionId), eq(conversations.readyToSubmit, false)))
      .orderBy(desc(conversations.updatedAt))
      .limit(1);
    conv = newest;
  }
  if (!conv) {
    const id = randomUUID();
    const [created] = await db
      .insert(conversations)
      .values({ id, sessionId, quoteFields: {}, contentFields: {} })
      .returning();
    conv = created;
  }

  if (conv.messageCount >= MAX_CONVERSATION_MESSAGES) {
    return c.json({ reply: "This conversation has gotten quite long — let's start a fresh one. Refresh to begin again." }, 400);
  }

  const decision = await route(message, chipId, conv.mode ?? undefined);

  const state: ConversationState = {
    id: conv.id,
    sessionId: conv.sessionId,
    mode: decision.mode,
    flow: conv.flow ?? (decision.via === 'chip' ? 'quote' : undefined),
    quoteFields: { ...conv.quoteFields },
    contentFields: { ...conv.contentFields },
    manualEditFields: [...(conv.manualEditFields ?? [])],
    readyToSubmit: conv.readyToSubmit,
    messageCount: conv.messageCount,
  };
  if (decision.via === 'chip' && decision.chipSeed?.project_type) {
    state.quoteFields.project_type = decision.chipSeed.project_type;
  }

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(HISTORY_TURNS);
  const historyForModel = history
    .reverse()
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  return streamSSE(c, async (stream) => {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), TURN_BUDGET_MS);
    stream.onAbort(() => controller.abort());

    await stream.writeSSE({ event: 'start', data: JSON.stringify({ conversationId: conv!.id }) });
    await stream.writeSSE({ event: 'mode', data: JSON.stringify({ mode: state.mode }) });

    const turnId = randomUUID();
    const turnStart = Date.now();
    const modeDef = modes[state.mode as Mode];

    try {
      const generator = runAgent(modeDef, historyForModel, message, {
        conversationId: conv!.id,
        sessionId,
        turnId,
        signal: controller.signal,
        catalog: getCatalog(),
        retrieval: retrievalIndex,
        state,
        emit: () => {},
      });

      let finalText = '';
      let finalUi: UiPayload = {};
      let toolCalls: unknown[] = [];
      let promptTokens = 0;
      let completionTokens = 0;
      let modelUsed = modeDef.model.primary;

      for await (const ev of generator) {
        if (ev.type === 'tool_start') {
          await stream.writeSSE({ event: 'tool_start', data: JSON.stringify({ id: ev.id, label: ev.label }) });
        } else if (ev.type === 'tool_end') {
          await stream.writeSSE({ event: 'tool_end', data: JSON.stringify({ id: ev.id, ok: ev.ok }) });
        } else if (ev.type === 'delta') {
          await stream.writeSSE({ event: 'delta', data: JSON.stringify({ text: ev.text }) });
        } else if (ev.type === 'done') {
          finalText = ev.text;
          finalUi = ev.ui;
          toolCalls = ev.toolCalls;
          promptTokens = ev.promptTokens;
          completionTokens = ev.completionTokens;
          modelUsed = ev.model;
        }
      }

      // Persist user + assistant messages, and the updated conversation state.
      const now = new Date();
      await db.insert(messagesTable).values([
        { id: randomUUID(), conversationId: conv!.id, turnId, role: 'user', content: message, createdAt: now },
        {
          id: randomUUID(),
          conversationId: conv!.id,
          turnId,
          role: 'assistant',
          content: finalText,
          mode: state.mode,
          toolCalls: toolCalls as never,
          uiPayload: finalUi,
          model: modelUsed,
          promptTokens,
          completionTokens,
          latencyMs: Date.now() - turnStart,
          createdAt: new Date(now.getTime() + 1),
        },
      ]);

      await db
        .update(conversations)
        .set({
          mode: state.mode,
          routeVia: decision.via,
          flow: state.flow,
          quoteFields: state.quoteFields,
          contentFields: state.contentFields,
          readyToSubmit: state.readyToSubmit,
          messageCount: conv!.messageCount + 2,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conv!.id));

      const cost = estimateCostUsd(modelUsed, promptTokens, completionTokens);
      await recordUsage(cost).catch(() => {});

      const ui: Record<string, unknown> = { ...finalUi };
      // Only surface the intake card once the model has actually decided
      // (via propose_submission) that it has a coherent, submittable
      // picture — not on every turn once flow is set. A live-updating card
      // shown throughout a free-flowing conversation has no way to
      // reconcile a topic pivot (e.g. "actually, let's talk about a
      // website instead") — it just keeps accumulating fields and calling
      // them "ready" the moment two happen to be non-empty, even when
      // they're stale or contradicted by what the user just said. One
      // summary, shown once the model itself believes it's coherent, gives
      // it a deliberate reconciliation point instead of a raw accumulator.
      if (state.flow && state.mode === 'sop' && state.readyToSubmit) {
        const fields = state.flow === 'content' ? state.contentFields : state.quoteFields;
        ui.intake = {
          flow: state.flow,
          fields,
          readyToSubmit: state.readyToSubmit,
        };
      }

      await stream.writeSSE({
        event: 'final',
        data: JSON.stringify({ reply: finalText, mode: state.mode, ...ui }),
      });
    } catch (err) {
      console.error('Chat turn failed:', err);
      await stream.writeSSE({
        event: 'final',
        data: JSON.stringify({ reply: 'Sorry, something went wrong. Please try again.', mode: state.mode }),
      });
    } finally {
      clearTimeout(deadline);
    }
  });
});
