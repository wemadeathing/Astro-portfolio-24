// Transport layer for the chat feature, talking to the standalone backend
// service (server/) rather than the old /api/chat Netlify function. See
// /Users/nasifsalaam/.claude/plans/fizzy-brewing-eagle.md.
//
// Session model: a client-generated UUID in localStorage, sent as
// X-Session-Id — not a cookie (avoids SameSite/credentials/CORS-reflection
// complexity for no real benefit here; see plan §Session). Treated as
// untrusted correlation server-side, never as auth.

const SESSION_STORAGE_KEY = 'chat-session-id-v1';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage blocked — fall back to a per-page-load id.
    // Conversation continuity across reloads is lost, but the chat still
    // works for the current session.
    return crypto.randomUUID();
  }
}

export const CHAT_API_BASE: string =
  (import.meta.env.PUBLIC_CHAT_API_BASE as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';

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
}
export interface BlogCardData {
  title: string;
  description: string;
  slug: string;
  pubDate: string;
  tags: string[];
}
export interface IntakeUi {
  flow: 'quote' | 'content';
  fields: Record<string, string>;
  readyToSubmit: boolean;
}
export interface BookingUi {
  url: string;
  reason?: string;
}

export interface FinalPayload {
  reply: string;
  mode: 'hiring' | 'sop';
  chips?: Chip[];
  projects?: ProjectCardData[];
  resources?: ResourceCardData[];
  blogs?: BlogCardData[];
  followUps?: string[];
  intake?: IntakeUi;
  booking?: BookingUi;
}

export type ChatStreamEvent =
  | { type: 'start'; conversationId: string }
  | { type: 'mode'; mode: 'hiring' | 'sop' }
  | { type: 'tool_start'; id: string; label: string }
  | { type: 'tool_end'; id: string; ok: boolean }
  | { type: 'delta'; text: string }
  | { type: 'final'; payload: FinalPayload };

export interface ChatRequestBody {
  message: string;
  chipId?: string;
  conversationId?: string;
}

/** Posts a chat turn and yields typed SSE events as they arrive. */
export async function* streamChat(body: ChatRequestBody, signal: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(`${CHAT_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSessionId(),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming not supported by this browser.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const lines = chunk.split(/\n/).map((l) => l.trimEnd());
      let currentEvent: string | null = null;

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith('data:')) continue;

        const raw = line.slice(5).trim();
        const parsed = raw ? JSON.parse(raw) : {};

        switch (currentEvent) {
          case 'start':
            yield { type: 'start', conversationId: parsed.conversationId };
            break;
          case 'mode':
            yield { type: 'mode', mode: parsed.mode };
            break;
          case 'tool_start':
            yield { type: 'tool_start', id: parsed.id, label: parsed.label };
            break;
          case 'tool_end':
            yield { type: 'tool_end', id: parsed.id, ok: parsed.ok };
            break;
          case 'delta':
            if (typeof parsed.text === 'string') yield { type: 'delta', text: parsed.text };
            break;
          case 'final':
            yield { type: 'final', payload: parsed as FinalPayload };
            break;
        }
      }
    }
  }
}

export interface ConversationSnapshot {
  conversation: {
    id: string;
    mode: 'hiring' | 'sop' | null;
    flow: 'quote' | 'content' | null;
    quoteFields: Record<string, string>;
    contentFields: Record<string, string>;
    readyToSubmit: boolean;
  } | null;
  messages: {
    id: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
    mode?: 'hiring' | 'sop';
    uiPayload?: Partial<FinalPayload>;
  }[];
}

/** Rehydrates the active (unsubmitted) conversation for this session on page load. */
export async function fetchConversation(): Promise<ConversationSnapshot> {
  const sessionId = getSessionId();
  const response = await fetch(`${CHAT_API_BASE}/session/${sessionId}/conversation`, {
    headers: { 'X-Session-Id': sessionId },
  });
  if (!response.ok) return { conversation: null, messages: [] };
  return response.json();
}

export interface SubmitResult {
  success: boolean;
  error?: string;
  alreadySubmitted?: boolean;
}

/** Submits the ready-to-submit intake for a conversation — the ONLY path that sends a lead email. */
export async function submitIntake(conversationId: string, honeypot?: string): Promise<SubmitResult> {
  const sessionId = getSessionId();
  const response = await fetch(`${CHAT_API_BASE}/intake/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
    body: JSON.stringify({ conversationId, honeypot }),
  });
  return response.json().catch(() => ({ success: false, error: 'Unexpected response.' }));
}

/** Direct, non-LLM field correction for the inline-edit affordance in IntakeCard. */
export async function editIntakeField(conversationId: string, field: string, value: string): Promise<boolean> {
  const sessionId = getSessionId();
  try {
    const response = await fetch(`${CHAT_API_BASE}/conversation/${conversationId}/fields`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
      body: JSON.stringify({ field, value }),
    });
    const data = await response.json().catch(() => ({ ok: false }));
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function resetConversation(conversationId: string): Promise<void> {
  const sessionId = getSessionId();
  await fetch(`${CHAT_API_BASE}/conversation/${conversationId}/reset`, {
    method: 'POST',
    headers: { 'X-Session-Id': sessionId },
  }).catch(() => {});
}
