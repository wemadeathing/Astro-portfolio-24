// openai SDK pointed at OpenRouter's base URL — accumulating tool_calls
// across streamed deltas by hand is fiddly and error-prone; the SDK handles
// it, along with retries and typed streaming. See plan §Models.
import OpenAI from 'openai';
import { env } from '../env';

export const openrouter = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://nasifsalaam.com',
    'X-Title': 'Nasif Salaam Portfolio Chat',
  },
});

export interface ModelSpec {
  primary: string;
  fallback?: string;
  /**
   * OpenRouter provider to pin the PRIMARY model to, with fallbacks off.
   *
   * Not premature tuning — measured. glm-5.3-flash is served by both Z.AI
   * and Together, and OpenRouter load-balances across them: 8 identical
   * tool-calling calls ran p50 4592ms / max 4913ms on Z.AI versus p50 859ms
   * / max 1343ms on Together, and leaving it unpinned produced 18.6s and
   * 35.2s outliers — the latter past TURN_BUDGET_MS on a single call, in a
   * loop that makes up to four.
   *
   * allow_fallbacks stays OFF deliberately: if the pinned provider is down
   * we want a fast, clean error so the runner drops to `fallback` (a
   * different model on a different provider), rather than silently
   * re-routing onto the slow path we pinned away from.
   *
   * Applies to the primary only — the fallback model is usually served by
   * someone else entirely, and pinning it to the primary's provider would
   * guarantee the fallback fails exactly when it is needed.
   */
  primaryProvider?: string;
  /**
   * Every model this project now uses is a REASONING model, and on
   * glm-5.3-flash OpenRouter rejects `reasoning: {enabled: false}` outright
   * ("Reasoning is mandatory for this endpoint and cannot be disabled").
   * Two consequences the loop has to respect:
   *   1. Thinking tokens are billed as completion tokens AND count against
   *      max_tokens — leave max_tokens at 1024 and a long think can starve
   *      the actual answer, or eat a whole tool-call block.
   *   2. They cost latency on every one of the up-to-4 sequential calls a
   *      turn makes, against a 25s TURN_BUDGET_MS.
   * 'minimal' keeps it to a sentence or two of thinking.
   */
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  /** Completion budget per call. Raise above the 1024 default for reasoning models. */
  maxTokens?: number;
}

/**
 * Per-call params that vary by model. Takes the model name explicitly
 * because provider pinning must apply to the primary ONLY — see
 * ModelSpec.primaryProvider.
 */
export function modelTuning(spec: ModelSpec, model: string): Record<string, unknown> {
  return {
    max_tokens: spec.maxTokens ?? 1024,
    ...(spec.reasoningEffort ? { reasoning_effort: spec.reasoningEffort } : {}),
    ...(spec.primaryProvider && model === spec.primary
      ? { provider: { order: [spec.primaryProvider], allow_fallbacks: false } }
      : {}),
  };
}

/** Rough per-request cost estimate for the daily spend cap — good enough for a guard, not billing. */
export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  // Conservative flat estimate across the small set of models this project
  // uses; refine with OpenRouter's `usage.cost` field on the response when
  // available instead of this table, which is what recordUsage prefers.
  const perMillion: Record<string, { prompt: number; completion: number }> = {
    'z-ai/glm-5.3-flash': { prompt: 0.075, completion: 0.25 },
    'deepseek/deepseek-v4-flash-0731': { prompt: 0.065, completion: 0.18 },
    'deepseek/deepseek-v4-flash': { prompt: 0.086, completion: 0.171 },
    'google/gemini-2.5-flash-lite': { prompt: 0.1, completion: 0.4 },
    // Not currently wired in — kept costed so swapping one in is a one-line
    // change in modes.ts with the spend cap still accurate. Measured on the
    // same tool-calling turn as the models above: gemini-3.7-flash cost
    // $0.001895/call (9x deepseek-v4-flash-0731's $0.000191) at a worse p50,
    // which is why it is an option here rather than the default.
    'google/gemini-3.7-flash': { prompt: 0.75, completion: 3.75 },
    'google/gemini-3.1-flash-lite': { prompt: 0.25, completion: 1.5 },
  };
  const rates = perMillion[model] ?? { prompt: 0.5, completion: 2.0 };
  return (promptTokens * rates.prompt + completionTokens * rates.completion) / 1_000_000;
}
