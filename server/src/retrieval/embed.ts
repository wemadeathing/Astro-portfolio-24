// Salvages the cosine/findTopMatches shape from the currently-dead
// src/lib/embeddings.ts, but ported to OpenAI's text-embedding-3-small —
// called THROUGH OpenRouter (same base URL + OPENROUTER_API_KEY already
// used for chat completions everywhere else in this service), not OpenAI
// directly. Confirmed live: OpenRouter's /v1/embeddings proxies this exact
// model (routed to Azure OpenAI under the hood) and returns identical
// 1536-dim vectors — no separate OpenAI account/key needed, one provider
// for everything.
import OpenAI from 'openai';
import { env } from '../env';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIM = 1536;

const client = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://nasifsalaam.com',
    'X-Title': 'Nasif Salaam Portfolio Chat',
  },
});

function normalizeVector(v: number[]): number[] {
  let mag = 0;
  for (const x of v) mag += x * x;
  mag = Math.sqrt(mag);
  if (mag === 0) return v;
  return v.map((x) => x / mag);
}

/** Pre-normalises to unit vectors so query-time cosine is a bare dot product. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/** OpenAI batches up to ~2048 inputs per request; we chunk conservatively at 96. */
const BATCH_SIZE = 96;

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await client.embeddings.create({ model: EMBEDDING_MODEL, input: batch });
    for (const item of res.data) {
      results.push(normalizeVector(item.embedding));
    }
  }
  return results;
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedBatch([text]);
  return v;
}
