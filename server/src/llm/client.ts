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
}

/** Rough per-request cost estimate for the daily spend cap — good enough for a guard, not billing. */
export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  // Conservative flat estimate across the small set of models this project
  // uses; refine with OpenRouter's `usage.cost` field on the response when
  // available instead of this table, which is what recordUsage prefers.
  const perMillion: Record<string, { prompt: number; completion: number }> = {
    'google/gemini-2.5-flash-lite': { prompt: 0.1, completion: 0.4 },
    'google/gemini-2.5-flash': { prompt: 0.3, completion: 2.5 },
    'openai/gpt-4.1-mini': { prompt: 0.4, completion: 1.6 },
  };
  const rates = perMillion[model] ?? { prompt: 0.5, completion: 2.0 };
  return (promptTokens * rates.prompt + completionTokens * rates.completion) / 1_000_000;
}
