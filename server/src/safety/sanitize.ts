// Ported from src/pages/api/chat.ts's sanitizeUserInput/sanitizeHistoryContent.
// Same prompt-injection defense discipline, applied to every user-provided
// string before it reaches a system prompt or gets persisted.
const MAX_MESSAGE_CHARS = 2000;

// Built via RegExp constructor (not a /.../  literal) to avoid embedding raw
// control-byte escape sequences directly in source.
const CONTROL_CHARS_RE = new RegExp('[\\x00-\\x1F\\x7F]', 'g');

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
  /new\s+(instructions|system\s+prompt|rules):/gi,
  /you\s+are\s+now\s+/gi,
  /pretend\s+(you\s+are|to\s+be)\s+/gi,
  /act\s+as\s+(if|a|an)\s+/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /override\s+(your\s+)?(instructions|rules|prompt)/gi,
  /reveal\s+(your\s+)?(system|hidden|secret)\s+(prompt|instructions|message)/gi,
  /what\s+(is|are)\s+your\s+(system|hidden|secret)\s+(prompt|instructions|message)/gi,
  /show\s+me\s+your\s+(system|hidden|secret)\s+(prompt|instructions)/gi,
  /repeat\s+(your\s+)?(system|hidden|initial)\s+(prompt|instructions|message)/gi,
  /output\s+(your\s+)?(system|hidden|initial)\s+(prompt|instructions|message)/gi,
  /system\s*:/gi,
  /\[SYSTEM\]/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\|endoftext\|>/gi,
  /assistant\s*:/gi,
];

export function sanitizeUserInput(content: string): string {
  if (typeof content !== 'string') return '';
  let sanitized = content.trim();

  // Control characters
  sanitized = sanitized.replace(CONTROL_CHARS_RE, ' ');

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  // Tame extreme repetition (token-exhaustion attempts)
  sanitized = sanitized.replace(/(.)\1{8,}/g, '$1$1$1');

  if (sanitized.length > MAX_MESSAGE_CHARS) {
    sanitized = sanitized.slice(0, MAX_MESSAGE_CHARS);
  }

  return sanitized;
}

/** Sanitizes an arbitrary record of string values (e.g. client-resent intake fields). */
export function sanitizeFields<T extends Record<string, unknown>>(raw: unknown): Partial<T> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) {
      out[k] = sanitizeUserInput(v);
    }
  }
  return out as Partial<T>;
}
