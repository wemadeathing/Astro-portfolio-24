// Ported from src/pages/api/chat.ts's OUTPUT_DENYLIST/sanitizeOutput. Same
// discipline: the assistant must never confirm/deny provider, model, or
// internal implementation details, even when asked directly or when a tool
// result happens to mention them.
// Note: this intentionally does NOT include general AI product names like
// "Claude" or "ChatGPT" — those are legitimate content when the knowledge
// base describes tools Nasif actually uses in his own work (e.g. "Claude
// Code" as part of his AI-accelerated workflow), not a confidentiality
// leak. The line being drawn is narrower: never reveal what actually
// powers THIS chatbot's own backend (OpenRouter, and whichever specific
// model is currently routing responses).
const OUTPUT_DENYLIST: RegExp[] = [
  /openrouter/i,
  /\bgemini\b/i,
  /\bdeepseek\b/i,
  /\bgroq\b/i,
  /retrieval[\s-]augmented[\s-]generation/i,
  /\brag\b(?=\s+(implementation|system|pipeline|based|retrieval|architecture))/i,
  /system\s*prompt/i,
  /hidden\s*(instructions|context|prompt)/i,
  /developer\s*(message|instructions|prompt)/i,
  /server[\s-]sent[\s-]events?\b/i,
  /\bjaccard\b/i,
  /fuzzy\s*match/i,
  /prompt\s*injection/i,
  /\bflash[\s-]lite\b/i,
  /\btool[\s-]call(ing|s)?\b/i,
  /\bhono\b/i,
  /\bpostgres(ql)?\b/i,
  /\brailway\b/i,
];

export function containsForbiddenOutput(text: string): boolean {
  return OUTPUT_DENYLIST.some((r) => r.test(text));
}

export function scrubForbiddenOutput(text: string): string {
  if (!containsForbiddenOutput(text)) return text;
  return text
    .replace(/openrouter/gi, 'AI')
    .replace(/gemini\s*[\d.]*\s*(flash\s*lite|pro|flash)?/gi, 'AI')
    .replace(/deepseek[\s\S]*?(flash|v\d)?/gi, 'AI')
    .replace(/groq/gi, 'AI')
    .replace(/retrieval[\s-]augmented[\s-]generation/gi, 'AI-powered search')
    .replace(/\bRAG\b/g, 'AI')
    .replace(/system\s*prompt/gi, 'instructions')
    .replace(/server[\s-]sent[\s-]events?/gi, 'streaming')
    .replace(/jaccard/gi, 'similarity')
    .replace(/fuzzy\s*match(ing)?/gi, 'smart matching')
    .replace(/prompt\s*injection/gi, 'security')
    .replace(/flash[\s-]lite/gi, 'AI')
    .replace(/tool[\s-]call(ing|s)?/gi, 'lookup')
    .replace(/\bhono\b/gi, 'the server')
    .replace(/postgres(ql)?/gi, 'the database')
    .replace(/railway/gi, 'the hosting platform');
}

// Structured tool-call syntax leaking into user-visible TEXT. Observed live
// on 2026-09-05 with glm-5.3-flash on the forced-prose final round
// (tool_choice: 'none'): the model still wanted propose_submission, could
// not emit a real tool_calls block, and wrote the harness markup into the
// answer instead —
//   <tool_call>propose_submission<arg_key>summary</arg_key><arg_value>…
// which the visitor would have read as the reply. Different model families
// use different markers (glm/Qwen <tool_call>, DeepSeek's ▁-delimited
// forms, generic <function_call>), so this covers the shapes rather than
// one vendor's.
//
// Note this MUST run before scrubForbiddenOutput: that denylist rewrites
// /tool[\s-]call(ing|s)?/ to "lookup", which would turn the leak into
// "<lookup>propose_submission<arg_key>…" — still garbage, now unsearchable.
const TOOL_BLOCK_RE =
  /<\|?(?:tool_call|tool_calls|function_call|tool▁call[s]?)[^>|]*\|?>[\s\S]*?<\/?\|?(?:tool_call|tool_calls|function_call|tool▁call[s]?)[^>|]*\|?>/gi;
const TOOL_TAG_RE =
  /<\/?\|?(?:tool_call|tool_calls|function_call|tool_response|arg_key|arg_value|tool▁call[s]?|tool▁calls▁(?:begin|end)|tool▁sep)[^>|]*\|?>/gi;
/** An opening marker with no close — a truncated stream; everything after it is markup. */
const TOOL_OPEN_RE = /<\|?(?:tool_call|tool_calls|function_call|tool▁call[s]?)[^>|]*\|?>/i;

export function containsToolCallMarkup(text: string): boolean {
  return TOOL_OPEN_RE.test(text) || /<arg_key>|<arg_value>/i.test(text);
}

/**
 * Removes leaked tool-call markup from model output. Complete blocks go
 * first, then any stray tags, then an unterminated opener takes the rest of
 * the string with it. Returns '' if nothing survives — callers substitute
 * their own fallback rather than showing an empty bubble.
 */
export function stripToolCallMarkup(text: string): string {
  // Order matters. Complete blocks go first; then an unterminated opener
  // takes the rest of the string with it — that check has to happen BEFORE
  // stray tags are removed, or stripping the opener destroys the very
  // marker that says "everything past here is machine syntax", and the
  // half-written call gets flattened into the answer as loose words.
  let out = text.replace(TOOL_BLOCK_RE, ' ');
  const open = out.match(TOOL_OPEN_RE);
  if (open && open.index !== undefined) out = out.slice(0, open.index);
  out = out.replace(TOOL_TAG_RE, ' ');
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/** Strip leaked tool syntax, then apply the provider/architecture denylist. */
export function sanitizeModelText(text: string): string {
  return scrubForbiddenOutput(stripToolCallMarkup(text));
}
