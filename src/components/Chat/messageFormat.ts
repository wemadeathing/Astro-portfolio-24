// Pure formatting helpers for the message list — no React, no state, so they
// are trivially testable in isolation and cheap to reason about.
import {
  QUOTE_FIELD_ORDER,
  QUOTE_FIELD_LABELS,
  CONTENT_FIELD_ORDER,
  CONTENT_FIELD_LABELS,
} from '../../../shared/intake';

/** Human-readable labels for the intake fields not yet captured. */
export function computeMissingFields(flow: 'quote' | 'content', fields: Record<string, string>): string[] {
  const order = flow === 'content' ? CONTENT_FIELD_ORDER : QUOTE_FIELD_ORDER;
  const labels = flow === 'content' ? CONTENT_FIELD_LABELS : QUOTE_FIELD_LABELS;
  return order.filter((k) => !fields[k]).map((k) => labels[k as keyof typeof labels]);
}

// Splits into "word + trailing whitespace" chunks so each one can mount as
// its own animated span. Index-as-key is safe here specifically because
// content only ever grows during streaming: earlier chunks never change
// once a word is followed by whitespace, so only the last (still-growing)
// chunk updates in place per render — the reveal animation fires once per
// completed word, not once per character.
export function splitIntoWordChunks(content: string): string[] {
  return content.match(/\S+\s*/g) ?? [];
}
