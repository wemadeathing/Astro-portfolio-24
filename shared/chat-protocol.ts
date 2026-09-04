// Shared wire-protocol types for the chat feature — imported by both the
// Astro site (src/components/Chat/ChatInterface.tsx, src/pages/api/chat.ts)
// and, from Phase 1 onward, the standalone backend service (server/).
//
// This file is typed against the CURRENT (v1, single-request-per-turn)
// payload shape as a Phase 0 pure refactor — it introduces no behaviour
// change. It will grow new fields (mode, tools[], conversationId, etc.) as
// later phases land, but existing fields/shapes below must stay backward
// compatible until the v1 Netlify endpoint is deleted (Phase 6).
//
// Note: the canonical compile-time types below are plain TypeScript
// interfaces, NOT derived via z.infer<>. This project runs tsconfig
// `strict: false` (no strictNullChecks), and zod's own docs are explicit
// that `z.infer` requires strictNullChecks to correctly distinguish
// required from optional fields — without it every field infers as
// optional, which breaks assignability against plain interfaces expecting
// required fields. src/pages/api/chat.ts already works around this the
// same way (hand-declared `type Chip = {...}` etc., separate from any zod
// schema); this file follows that established convention. The zod schemas
// below exist purely for runtime validation (parsing untrusted JSON) and
// intentionally aren't used to derive the exported types.
import { z } from 'zod';

export interface Chip {
  label: string;
  href: string;
  kind?: string;
}

export interface ProjectCardData {
  title: string;
  description: string;
  image: string;
  tags: string[];
  slug: string;
}

export interface ResourceCardData {
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
  image?: string;
  siteName?: string;
}

export interface BlogCardData {
  title: string;
  description: string;
  slug: string;
  pubDate: string; // ISO string
  tags: string[];
}

export interface IntakeState {
  intent: 'quote_intake' | 'content_intake';
  flow: 'quote' | 'content';
  fields: Record<string, string>;
  missingFields: string[];
  readyToSubmit: boolean;
  submitted?: boolean;
  submitError?: string;
}

/** The `POST /api/chat` non-streaming JSON response, and the SSE `final` event payload. */
export interface ChatResponsePayload {
  reply: string;
  chips?: Chip[];
  projects?: ProjectCardData[];
  resources?: ResourceCardData[];
  blogs?: BlogCardData[];
  followUps?: string[];
  mode: 'online' | 'offline';
  intake?: IntakeState;
}

/** SSE `delta` event payload — a chunk of the already-fully-generated reply text. */
export interface ChatDeltaEvent {
  text: string;
}

/** Named SSE event types the client's parser switches on. */
export type ChatSseEventType = 'start' | 'delta' | 'final';

// ---------------------------------------------------------------------------
// Runtime validation schemas (for parsing untrusted JSON — not used for
// compile-time typing, see note above). All fields optional/lenient by
// design: this mirrors how src/pages/api/chat.ts's own ModelJsonSchema is
// used defensively (safeParse + manual fallback extraction), not as a
// strict contract.
// ---------------------------------------------------------------------------

export const ChipRuntimeSchema = z.object({
  label: z.string().optional(),
  href: z.string().optional(),
  kind: z.string().optional(),
});

export const ChatResponsePayloadRuntimeSchema = z.object({
  reply: z.string().optional(),
  chips: z.array(ChipRuntimeSchema).optional(),
  followUps: z.array(z.string()).optional(),
  mode: z.enum(['online', 'offline']).optional(),
});
