import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { z } from 'zod';
import { analyzeAiReadiness, type AuditResult } from '../../lib/audit/ai-readiness';

export const prerender = false;

const getRuntimeEnv = (key: string) => {
  // Runtime (Node)
  const nodeVal = (globalThis as any)?.process?.env?.[key];
  if (typeof nodeVal === 'string' && nodeVal.trim()) return nodeVal.trim();

  // Runtime (Edge / Deno)
  const denoGet = (globalThis as any)?.Deno?.env?.get;
  if (typeof denoGet === 'function') {
    const denoVal = denoGet.call((globalThis as any).Deno.env, key);
    if (typeof denoVal === 'string' && denoVal.trim()) return denoVal.trim();
  }

  return '';
};

const getOpenAiKey = () => {
  // Static access is supported by Astro's module runner.
  const vite = import.meta.env.OPENAI_API_KEY;
  if (typeof vite === 'string' && vite.trim()) return vite.trim();

  // Fallback for runtime/serverless environments.
  return getRuntimeEnv('OPENAI_API_KEY');
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const BodySchema = z.object({
  url: z.string().min(1).max(2048),
  includeAi: z.boolean().optional(),
});

const isUnsafeHost = (host: string) => {
  const h = host.toLowerCase().trim();
  if (!h) return true;

  // Block localhost + obvious local networks (best-effort SSRF guard).
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '0.0.0.0' || h === '127.0.0.1' || h === '::1') return true;
  if (h.endsWith('.local')) return true;

  // Private IPv4 ranges (string check only).
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  const m172 = h.match(/^172\.(\d+)\./);
  if (m172) {
    const n = Number(m172[1]);
    if (n >= 16 && n <= 31) return true;
  }

  return false;
};

const normalizeUrl = (raw: string) => {
  const t = String(raw || '').trim();
  // Allow users to type "example.com".
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  const u = new URL(withScheme);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Only http/https URLs are supported.');
  if (isUnsafeHost(u.hostname)) throw new Error('That URL host is not allowed.');
  return u;
};

const toHeaderMap = (headers: Headers) => {
  const out: Record<string, string> = {};
  for (const [k, v] of headers.entries()) out[k.toLowerCase()] = v;
  return out;
};

const fetchText = async (url: string, timeoutMs: number, maxBytes: number) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // Keep this simple; many sites block unknown UAs.
        'User-Agent': 'Mozilla/5.0 (compatible; NasifAuditBot/1.0; +https://www.nasifsalaam.com/audit)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    const buf = new Uint8Array(await res.arrayBuffer());
    const sliced = buf.byteLength > maxBytes ? buf.slice(0, maxBytes) : buf;
    const text = new TextDecoder('utf-8', { fatal: false }).decode(sliced);

    return {
      res,
      text,
      bytes: sliced.byteLength,
      truncated: buf.byteLength > maxBytes,
    };
  } finally {
    clearTimeout(t);
  }
};

const headStatus = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NasifAuditBot/1.0; +https://www.nasifsalaam.com/audit)',
        Accept: 'text/plain, text/*;q=0.9, */*;q=0.2',
      },
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(t);
  }
};

const aiExplain = async (audit: AuditResult, apiKey: string) => {
  const openai = new OpenAI({ apiKey });

  const prompt = `You are an expert technical SEO + AI-readiness auditor.

Given this audit JSON, write a concise explanation for a non-technical founder.

Rules:
- Output STRICT JSON with shape:
{
  "summary": string,
  "top_priorities": Array<{"title": string, "why": string, "how": string}>,
  "quick_wins": Array<string>
}
- Be specific to the findings.
- Avoid fluff.

Audit JSON:
${JSON.stringify(audit).slice(0, 12000)}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(raw);
};

export const POST: APIRoute = async ({ request }) => {
  const isDev = import.meta.env.DEV;

  try {
    const bodyRaw = await request.json().catch(() => ({}));
    const body = BodySchema.parse(bodyRaw);

    let u: URL;
    try {
      u = normalizeUrl(body.url);
    } catch (e) {
      const details = e instanceof Error ? e.message : String(e);
      return json(
        {
          success: false,
          error: 'Invalid URL. Please enter a public http(s) website URL.',
          ...(isDev ? { details } : {}),
        },
        400
      );
    }

    // Fetch primary document
    let main: Awaited<ReturnType<typeof fetchText>>;
    try {
      main = await fetchText(u.toString(), 12_000, 600_000);
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError';
      const details = e instanceof Error ? e.message : String(e);
      return json(
        {
          success: false,
          error: isAbort ? 'Timed out fetching that page. Try again, or test a different URL.' : 'Could not fetch that page. It may be blocking crawlers.',
          ...(isDev ? { details } : {}),
        },
        502
      );
    }

    const headerMap = toHeaderMap(main.res.headers);
    const finalUrl = main.res.url || u.toString();

    // Extra discovery checks (same origin)
    const origin = new URL(finalUrl).origin;
    const [robotsTxt, sitemap, llmsTxt] = await Promise.all([
      headStatus(`${origin}/robots.txt`, 5_000),
      headStatus(`${origin}/sitemap.xml`, 5_000),
      headStatus(`${origin}/llms.txt`, 5_000),
    ]);

    const audit = analyzeAiReadiness({
      url: u.toString(),
      finalUrl,
      status: main.res.status,
      ok: main.res.ok,
      headers: headerMap,
      html: main.text,
      bytes: main.bytes,
      checks: {
        robotsTxt,
        sitemap,
        llmsTxt,
      },
    });

    const includeAi = Boolean(body.includeAi);
    const apiKey = getOpenAiKey();

    if (includeAi && apiKey) {
      let ai: any = null;
      try {
        ai = await aiExplain(audit, apiKey);
      } catch (e) {
        // AI is optional — return deterministic audit even if AI fails.
        ai = { summary: 'AI explanation failed. Try again later.', top_priorities: [], quick_wins: [] };
      }

      return json({ success: true, audit, ai, ...(isDev ? { debug: { includeAi, hasOpenAiKey: Boolean(apiKey) } } : {}) }, 200);
    }

    return json(
      {
        success: true,
        audit,
        ai: includeAi
          ? {
              disabled: true,
              reason: apiKey ? 'AI is temporarily unavailable.' : 'OPENAI_API_KEY not configured at runtime.',
            }
          : null,
        ...(isDev ? { debug: { includeAi, hasOpenAiKey: Boolean(apiKey) } } : {}),
      },
      200
    );
  } catch (error) {
    console.error('Audit API error:', error);
    const message = error instanceof Error ? error.message : 'Invalid request.';

    return json(
      {
        success: false,
        error: 'Unable to run audit. Please try again.',
        ...(isDev ? { details: message } : {}),
      },
      400
    );
  }
};
