import { pgTable, text, integer, real, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import type { QuoteFields, ContentFields } from '../../../shared/intake';

export type Mode = 'hiring' | 'sop';
export type Flow = 'quote' | 'content';
export type RouteVia = 'sticky' | 'chip' | 'keyword' | 'llm';
export type MessageRole = 'user' | 'assistant' | 'tool';

export interface ToolCallRecord {
  id: string;
  name: string;
  args: unknown;
  result?: unknown;
  ok: boolean;
  latencyMs: number;
}

export interface Chip {
  label: string;
  href: string;
  kind?: string;
}

export interface UiPayload {
  chips?: Chip[];
  projects?: { title: string; description: string; image: string; tags: string[]; slug: string }[];
  resources?: { title: string; description: string; url: string; type: string; tags: string[]; image?: string }[];
  blogs?: { title: string; description: string; slug: string; pubDate: string; tags: string[] }[];
  followUps?: string[];
  intake?: {
    flow: Flow;
    fields: Record<string, string>;
    missingFields: string[];
    readyToSubmit: boolean;
  };
  booking?: { url: string; reason?: string };
}

export const conversations = pgTable(
  'conversations',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    mode: text('mode').$type<Mode>(),
    routeVia: text('route_via').$type<RouteVia>(),
    flow: text('flow').$type<Flow>(),
    quoteFields: jsonb('quote_fields').$type<QuoteFields>().default({}),
    contentFields: jsonb('content_fields').$type<ContentFields>().default({}),
    // Field keys the user has directly edited in the summary card (via
    // PATCH /conversation/:id/fields). save_intake_fields will not
    // overwrite these — cheap tool-calling models routinely re-send a
    // field's last-known value out of habit even when the user didn't
    // just restate it, which would otherwise silently clobber a
    // deliberate correction the model was never told about. Once locked,
    // further changes to that field go through the card, not the model.
    manualEditFields: jsonb('manual_edit_fields').$type<string[]>().default([]),
    readyToSubmit: boolean('ready_to_submit').notNull().default(false),
    submittedAt: timestamp('submitted_at', { mode: 'date' }),
    messageCount: integer('message_count').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    bySession: index('conv_session_idx').on(t.sessionId, t.updatedAt),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    turnId: text('turn_id').notNull(),
    role: text('role').$type<MessageRole>().notNull(),
    content: text('content').notNull(),
    mode: text('mode').$type<Mode>(),
    toolCalls: jsonb('tool_calls').$type<ToolCallRecord[]>(),
    uiPayload: jsonb('ui_payload').$type<UiPayload>(),
    model: text('model'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    costUsd: real('cost_usd'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    byConv: index('msg_conv_idx').on(t.conversationId, t.createdAt),
  })
);

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  flow: text('flow').$type<Flow>().notNull(),
  fields: jsonb('fields').notNull(),
  email: text('email').notNull(),
  emailStatus: text('email_status').$type<'sent' | 'failed'>().notNull(),
  resendId: text('resend_id'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type ChunkKind = 'knowledge' | 'about' | 'project' | 'blog' | 'resource';

export const embeddings = pgTable(
  'embeddings',
  {
    id: text('id').primaryKey(), // e.g. 'knowledge:working-style#how-nasif-works'
    kind: text('kind').$type<ChunkKind>().notNull(),
    refId: text('ref_id').notNull(), // slug/title, for card resolution
    heading: text('heading'),
    content: text('content').notNull(),
    contentHash: text('content_hash').notNull(),
    model: text('model').notNull(),
    dim: integer('dim').notNull(),
    vector: jsonb('vector').$type<number[]>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    byKind: index('emb_kind_idx').on(t.kind),
  })
);

export const usageDaily = pgTable('usage_daily', {
  day: text('day').primaryKey(), // 'YYYY-MM-DD' UTC
  requests: integer('requests').notNull().default(0),
  costUsd: real('cost_usd').notNull().default(0),
});
