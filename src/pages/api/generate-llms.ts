import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { z } from 'zod';

export const prerender = false;

// Helpers (reused from audit.ts, good candidate for shared lib)
const getOpenAiKey = () => {
  const vite = import.meta.env.OPENAI_API_KEY;
  if (typeof vite === 'string' && vite.trim()) return vite.trim();
  const nodeVal = (globalThis as any)?.process?.env?.OPENAI_API_KEY;
  if (typeof nodeVal === 'string' && nodeVal.trim()) return nodeVal.trim();
  return '';
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const fetchText = async (url: string) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000); // 8s timeout
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NasifLLMsBot/1.0)',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Limit to 15KB to save tokens
    return text.slice(0, 15000);
  } finally {
    clearTimeout(t);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const url = body.url;
    if (!url) return json({ error: 'URL required' }, 400);

    const apiKey = getOpenAiKey();
    if (!apiKey) return json({ error: 'AI not configured' }, 503);

    // 1. Fetch page content (server-side to avoid CORS)
    let html = '';
    try {
      html = await fetchText(url);
    } catch (e) {
      return json({ error: 'Could not fetch URL' }, 400);
    }

    // 2. Ask OpenAI to extract details (Cheap model: gpt-4o-mini)
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert web crawler. Extract these details from the HTML provided:
1. Site Title
2. A concise summary for an AI agent (what this site is about).
3. A list of key pages found in the nav (Title + URL).

Return JSON only:
{
  "title": string,
  "summary": string,
  "urls": Array<{ "title": string, "url": string }>
}`
        },
        { role: 'user', content: html }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500, // Strict limit to save costs
    });

    const data = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return json({ success: true, data });

  } catch (error) {
    console.error('LLMs Generator API error:', error);
    return json({ success: false, error: 'Generation failed' }, 500);
  }
};
