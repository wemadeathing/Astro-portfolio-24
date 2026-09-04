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
