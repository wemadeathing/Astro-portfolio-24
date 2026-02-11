import type { APIRoute } from 'astro';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { z } from 'zod';
import aboutPageSource from '../about.astro?raw';

const ModelJsonSchema = z.object({
  answer: z.string().min(1),
  chips: z
    .array(
      z.object({
        label: z.string().min(1),
        href: z.string().min(1),
        kind: z.string().optional(),
      })
    )
    .optional(),
  project_cards: z.array(z.string().min(1)).optional(),
  resource_cards: z.array(z.string().min(1)).optional(),
  blog_cards: z.array(z.string().min(1)).optional(),
  follow_ups: z.array(z.string().min(1).max(80)).max(3).optional(),
});

type Chip = { label: string; href: string; kind?: string };

type ProjectCard = {
  title: string;
  description: string;
  image: string;
  tags: string[];
  slug: string;
};

type ResourceCard = {
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
  image?: string;
  siteName?: string;
};

type BlogCard = {
  title: string;
  description: string;
  slug: string;
  pubDate: string; // ISO string
  tags: string[];
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Avoid caching user-specific responses.
      'Cache-Control': 'no-store',
    },
  });

const sse = (stream: ReadableStream<Uint8Array>, status = 200) =>
  new Response(stream, {
    status,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    },
  });

const MAX_MESSAGE_CHARS = 2000;

// Best-effort in-memory rate limiting (works on warm serverless instances too).
const rl = (() => {
  const byIp = new Map<string, number[]>();
  const WINDOW_MS = 60_000;
  const MAX_PER_WINDOW = 10; // Reduced from 25 to 10 to avoid API rate limits

  const allow = (ip: string) => {
    const now = Date.now();
    const arr = byIp.get(ip) ?? [];
    const recent = arr.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    byIp.set(ip, recent);
    return recent.length <= MAX_PER_WINDOW;
  };

  return { allow };
})();


const getClientIp = (request: Request) => {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = request.headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s\-_/]/g, '');

const stripMarkdownLite = (s: string) => {
  let out = String(s || '');
  // remove code fences
  out = out.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  // inline code
  out = out.replace(/`([^`]+)`/g, '$1');
  // bold/italic
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');
  out = out.replace(/\*([^*]+)\*/g, '$1');
  out = out.replace(/_([^_]+)_/g, '$1');
  // markdown bullets like "- **Thing**:" -> "- Thing:"
  out = out.replace(/^\s*[-*+]\s+/gm, '• ');
  // collapse extra whitespace
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
};

const sanitizeHistoryContent = (content: string): string => {
  if (typeof content !== 'string') return '';

  let sanitized = String(content).trim();

  // Remove potential prompt injection patterns
  // Remove phrases that could be interpreted as system instructions
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
    /new\s+(instructions|system\s+prompt|rules):/gi,
    /system\s*:/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /assistant\s*:/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  // Limit excessive repetition (potential token exhaustion attack)
  // Replace 4+ repeated characters with 3
  sanitized = sanitized.replace(/(.)\1{3,}/g, '$1$1$1');

  // Ensure reasonable length (backup check)
  if (sanitized.length > MAX_MESSAGE_CHARS) {
    sanitized = sanitized.slice(0, MAX_MESSAGE_CHARS);
  }

  return sanitized;
};

const tokenSet = (s: string) =>
  new Set(
    normalize(s)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3)
  );

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
};

const bigramDice = (a: string, b: string) => {
  const grams = (s: string) => {
    const x = normalize(s).replace(/\s+/g, '');
    const out: string[] = [];
    for (let i = 0; i < Math.max(0, x.length - 1); i++) out.push(x.slice(i, i + 2));
    return out;
  };
  const ag = grams(a);
  const bg = grams(b);
  if (!ag.length || !bg.length) return 0;
  const bag = new Map<string, number>();
  for (const g of ag) bag.set(g, (bag.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of bg) {
    const n = bag.get(g) ?? 0;
    if (n > 0) {
      inter += 1;
      bag.set(g, n - 1);
    }
  }
  return (2 * inter) / (ag.length + bg.length);
};

const allowedChipHref = (href: string, projectSlugs: Set<string>, blogSlugs: Set<string>) => {
  // Allow core nav
  if (href === '/about' || href === '/projects' || href === '/blog' || href === '/contact' || href === '/resources') return true;
  // Allow deep links to known slugs
  const proj = href.match(/^\/projects\/([^/?#]+)$/);
  if (proj && projectSlugs.has(proj[1])) return true;
  const blog = href.match(/^\/blog\/([^/?#]+)$/);
  if (blog && blogSlugs.has(blog[1])) return true;
  return false;
};

const sanitizeChips = (chips: unknown, projectSlugs: Set<string>, blogSlugs: Set<string>) => {
  if (!Array.isArray(chips)) return [] as Chip[];
  const out: Chip[] = [];
  const rejected: string[] = [];

  for (const c of chips) {
    if (!c || typeof c !== 'object') continue;
    const label = (c as any).label;
    const href = (c as any).href;
    const kind = (c as any).kind;
    if (typeof label !== 'string' || typeof href !== 'string') continue;
    const cleanHref = href.trim();

    // Reject non-relative URLs
    if (!cleanHref.startsWith('/')) {
      rejected.push(cleanHref);
      continue;
    }

    // Reject hrefs not in allowlist
    if (!allowedChipHref(cleanHref, projectSlugs, blogSlugs)) {
      rejected.push(cleanHref);
      continue;
    }

    out.push({
      label: label.trim().slice(0, 32),
      href: cleanHref,
      kind: typeof kind === 'string' ? kind.slice(0, 24) : undefined
    });

    if (out.length >= 6) break;
  }

  // Log rejected chips for monitoring
  if (rejected.length > 0) {
    console.warn('LLM provided invalid chip hrefs:', rejected.join(', '));
  }

  return out;
};

let _collectionsCache: {
  projects: CollectionEntry<'projects'>[];
  blogPosts: CollectionEntry<'blog'>[];
  resources: CollectionEntry<'resources'>[];
  knowledge: string;
  ts: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    if (!rl.allow(ip)) {
      return json({ reply: 'Too many requests. Please wait a moment and try again.' }, 429);
    }

    // Netlify free-tier: 10s hard limit. Paid: 26s.
    // Using 9s to stay safely under free-tier limit.
    const FUNCTION_DEADLINE_MS = 9_000;
    const requestStart = Date.now();
    const remainingMs = () => Math.max(0, FUNCTION_DEADLINE_MS - (Date.now() - requestStart));

    const body = await request.json();
    const userMessageRaw = body?.message;
    const userMessage = typeof userMessageRaw === 'string' ? sanitizeHistoryContent(userMessageRaw) : '';
    const historyRaw = Array.isArray(body?.history) ? body.history : [];

    const history = historyRaw
      .slice(-20)
      .map((msg: any) => ({
        role: msg?.role,
        content: typeof msg?.content === 'string' ? sanitizeHistoryContent(msg.content) : ''
      }))
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && m.content.length > 0);

    const wantsStream =
      request.headers.get('accept')?.includes('text/event-stream') ||
      request.headers.get('x-chat-stream') === '1' ||
      new URL(request.url).searchParams.get('stream') === '1';

    if (!userMessage.trim()) {
      return wantsStream
        ? sse(
            new ReadableStream({
              start(controller) {
                const enc = new TextEncoder();
                controller.enqueue(enc.encode(`event: final\ndata: ${JSON.stringify({ reply: 'Please enter a message.' })}\n\n`));
                controller.close();
              },
            }),
            400
          )
        : json({ reply: 'Please enter a message.' }, 400);
    }

    if (userMessage.length > MAX_MESSAGE_CHARS) {
      return json(
        {
          reply: `That message is a bit long. Please keep it under ${MAX_MESSAGE_CHARS} characters.`,
        },
        413
      );
    }

    // 1) Gather content (the "brain") – with module-level caching for warm invocations
    const now = Date.now();
    if (!_collectionsCache || now - _collectionsCache.ts > CACHE_TTL_MS) {
      const [projects, blogPosts, resources, knowledgeEntry] = await Promise.all([
        getCollection('projects', ({ data }) => data.published !== false),
        getCollection('blog'),
        getCollection('resources'),
        getEntry('assistant', 'knowledge'),
      ]);
      _collectionsCache = { projects, blogPosts, resources, knowledge: knowledgeEntry?.body ?? '', ts: now };
    }
    const { projects, blogPosts, resources, knowledge } = _collectionsCache;

    const projectSlugs = new Set(projects.map((p) => p.slug));
    const blogSlugs = new Set(blogPosts.map((b) => b.slug));

    // Auto-include the About page (extract readable text from its source)
    const stripAstroFrontmatter = (src: string) => src.replace(/^---[\s\S]*?---\s*/, '');
    const stripAstroExpressions = (src: string) => src.replace(/\{[\s\S]*?\}/g, ' ');
    const stripHtmlTags = (src: string) => src.replace(/<[^>]*>/g, ' ');
    const normalizeWhitespace = (src: string) => src.replace(/\s+/g, ' ').trim();

    const aboutText = normalizeWhitespace(
      stripHtmlTags(stripAstroExpressions(stripAstroFrontmatter(aboutPageSource)))
    ).slice(0, 6000);

    // 1a) Retrieval-lite: select only relevant projects/posts (top-k)
    const queryTokens = tokenSet(userMessage);

    const projectItems = projects.map((p) => {
      const useFor = (p.data as any).use_for_questions ?? [];
      const aiSummary = (p.data as any).ai_summary ?? '';
      const tags = (p.data as any).tags ?? [];
      const text = `${p.slug} ${p.data.title} ${p.data.description} ${Array.isArray(tags) ? tags.join(' ') : ''} ${Array.isArray(useFor) ? useFor.join(' ') : ''} ${aiSummary}`;
      const score =
        jaccard(queryTokens, tokenSet(text)) +
        (Boolean((p.data as any).featured) ? 0.05 : 0) +
        (Array.isArray(tags) && tags.some((t: string) => queryTokens.has(normalize(t))) ? 0.1 : 0);
      return { slug: p.slug, title: p.data.title, description: p.data.description, tags, useFor, aiSummary, featured: Boolean((p.data as any).featured), score };
    });

    const blogItems = blogPosts
      .map((b) => ({
        slug: b.slug,
        title: b.data.title,
        description: b.data.description,
        aiSummary: (b.data as any).ai_summary ?? '',
        topics: (b.data as any).topics ?? [],
        pubDate: b.data.pubDate,
      }))
      .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())
      .map((b, idx) => {
        const text = `${b.slug} ${b.title} ${b.description} ${(Array.isArray(b.topics) ? b.topics.join(' ') : '')} ${b.aiSummary}`;
        // small recency bias (newer posts earlier)
        const recencyBoost = Math.max(0, 0.03 - idx * 0.002);
        const score = jaccard(queryTokens, tokenSet(text)) + recencyBoost;
        return { ...b, score };
      });

    const resourceItems = resources.map((r) => {
      const tags = (r.data as any).tags ?? [];
      const text = `${r.data.title} ${r.data.description ?? ''} ${Array.isArray(tags) ? tags.join(' ') : ''} ${r.data.type ?? ''}`;
      const score = jaccard(queryTokens, tokenSet(text)) +
        (Array.isArray(tags) && tags.some((t: string) => queryTokens.has(normalize(t))) ? 0.1 : 0);
      return { 
        url: r.data.url, 
        title: r.data.title, 
        description: r.data.description ?? '', 
        type: r.data.type ?? 'other',
        tags, 
        score 
      };
    });

    const topProjects = projectItems
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const topBlogs = blogItems
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const topResources = resourceItems
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const projectContext = topProjects
      .map((p) => {
        const keywords = (p.useFor && p.useFor.length ? p.useFor : p.tags).join(', ');
        const summary = (p.aiSummary && String(p.aiSummary).trim().length ? String(p.aiSummary) : p.description).trim();
        return `- ${p.slug}: ${p.title} (${keywords}) - ${summary}${p.featured ? ' [featured]' : ''}`;
      })
      .join('\n');

    const blogContext = topBlogs
      .map((b) => {
        const topics = (b.topics && b.topics.length ? b.topics.join(', ') : '').trim();
        const summary = (b.aiSummary && String(b.aiSummary).trim().length ? String(b.aiSummary) : b.description).trim();
        return `- ${b.slug}: ${b.title}${topics ? ` (${topics})` : ''} - ${summary}`;
      })
      .join('\n');

    const resourceContext = topResources
      .map((r) => {
        const tagsStr = (r.tags && r.tags.length ? r.tags.join(', ') : '').trim();
        return `- ${r.title} (${r.type}${tagsStr ? `, ${tagsStr}` : ''}) - ${r.description} [${r.url}]`;
      })
      .join('\n');

    const makeCardProjects = (slugs: string[]) => {
      const wanted = slugs
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .slice(0, 6);

      // Track hallucinated slugs for logging
      const hallucinated: string[] = [];

      // Exact first
      const exact = new Set<string>();
      for (const s of wanted) {
        const low = s.toLowerCase();
        const hit = projects.find(
          (p) => low === p.slug.toLowerCase() || low === p.data.title.toLowerCase()
        );
        if (hit) {
          exact.add(hit.slug);
        } else {
          hallucinated.push(s);
        }
      }

      // Fuzzy fallback (only if no exact matches found)
      if (exact.size < wanted.length) {
        const candidates = projects.map((p) => ({ slug: p.slug, title: p.data.title }));
        for (const s of wanted) {
          if (exact.size >= 6) break;
          const low = s.toLowerCase();
          if (Array.from(exact).some((x) => x.toLowerCase() === low)) continue;
          let best: { slug: string; score: number } | null = null;
          for (const c of candidates) {
            const score = Math.max(bigramDice(s, c.slug), bigramDice(s, c.title));
            if (!best || score > best.score) best = { slug: c.slug, score };
          }
          // Only accept fuzzy matches with high confidence (>= 0.60)
          if (best && best.score >= 0.60) {
            exact.add(best.slug);
          }
        }
      }

      // Log hallucinations for monitoring
      if (hallucinated.length > 0) {
        console.warn('LLM hallucinated project slugs:', hallucinated.join(', '));
      }

      return projects
        .filter((p) => exact.has(p.slug))
        .map((p) => ({
          title: p.data.title,
          description: p.data.description,
          image: p.data.image,
          tags: p.data.tags,
          slug: p.slug,
        })) as ProjectCard[];
    };

    const makeCardResources = (titles: string[]): ResourceCard[] => {
      const wanted = titles
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .slice(0, 6);

      // Track hallucinated titles for logging
      const hallucinated: string[] = [];
      const hits: (typeof resources[0])[] = [];

      for (const t of wanted) {
        const low = t.toLowerCase();
        // Try exact match first
        let hit = resources.find(
          (r) => low === r.data.title.toLowerCase() || low === r.data.url.toLowerCase()
        );

        // Fuzzy fallback
        if (!hit) {
          let best: { r: typeof resources[0]; score: number } | null = null;
          for (const r of resources) {
            const score = Math.max(bigramDice(t, r.data.title), bigramDice(t, r.data.url));
            if (!best || score > best.score) best = { r, score };
          }
          // Stricter fuzzy threshold (>= 0.55 instead of 0.50)
          if (best && best.score >= 0.55) {
            hit = best.r;
          } else {
            hallucinated.push(t);
          }
        }

        if (hit && !hits.some(h => h.data.url === hit!.data.url)) {
          hits.push(hit);
        }
        if (hits.length >= 6) break;
      }

      // Log hallucinations for monitoring
      if (hallucinated.length > 0) {
        console.warn('LLM hallucinated resource titles:', hallucinated.join(', '));
      }

      // Return card data without external metadata fetches to avoid timeout on serverless
      return hits.map((hit) => ({
        title: hit.data.title,
        description: hit.data.description ?? '',
        url: hit.data.url,
        type: hit.data.type ?? 'other',
        tags: (hit.data as any).tags ?? [],
        image: (hit.data as any).image || undefined,
        siteName: undefined,
      }));
    };

    const makeCardBlogs = (slugs: string[]) => {
      const wanted = slugs
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .slice(0, 6);

      // Track hallucinated slugs for logging
      const hallucinated: string[] = [];
      const exact = new Set<string>();

      // Exact match first
      for (const s of wanted) {
        const low = s.toLowerCase();
        const hit = blogPosts.find(
          (b) => low === b.slug.toLowerCase() || low === b.data.title.toLowerCase()
        );
        if (hit) {
          exact.add(hit.slug);
        } else {
          hallucinated.push(s);
        }
      }

      // Fuzzy fallback if no exact matches
      if (exact.size < wanted.length) {
        const candidates = blogPosts.map((b) => ({ slug: b.slug, title: b.data.title }));
        for (const s of wanted) {
          if (exact.size >= 6) break;
          const low = s.toLowerCase();
          if (Array.from(exact).some((x) => x.toLowerCase() === low)) continue;
          let best: { slug: string; score: number } | null = null;
          for (const c of candidates) {
            const score = Math.max(bigramDice(s, c.slug), bigramDice(s, c.title));
            if (!best || score > best.score) best = { slug: c.slug, score };
          }
          // High confidence threshold for fuzzy matches
          if (best && best.score >= 0.60) {
            exact.add(best.slug);
          }
        }
      }

      // Log hallucinations for monitoring
      if (hallucinated.length > 0) {
        console.warn('LLM hallucinated blog slugs:', hallucinated.join(', '));
      }

      return blogPosts
        .filter((b) => exact.has(b.slug))
        .map((b) => ({
          title: b.data.title,
          description: b.data.description,
          slug: b.slug,
          pubDate: b.data.pubDate.toISOString(),
          tags: (b.data as any).topics ?? [],
        })) as BlogCard[];
    };

    // 2) Offline mode (no API keys available)
    if (!import.meta.env.OPENROUTER_API_KEY) {
      const lowerMsg = userMessage.toLowerCase();
      const wantsWork =
        lowerMsg.includes('project') ||
        lowerMsg.includes('projects') ||
        lowerMsg.includes('work') ||
        lowerMsg.includes('portfolio');

      const featured = projects.filter((p) => (p.data as any).featured).map((p) => p.slug);
      const candidates = featured.length > 0 ? featured : projects.map((p) => p.slug);
      const cardSlugs = wantsWork ? candidates.slice(0, 4) : [];

      const chips: Chip[] = wantsWork
        ? [
            { label: 'Work', href: '/projects', kind: 'work' },
            { label: 'About', href: '/about', kind: 'about' },
            { label: 'Contact', href: '/contact', kind: 'contact' },
          ]
        : [
            { label: 'About', href: '/about', kind: 'about' },
            { label: 'Work', href: '/projects', kind: 'work' },
            { label: 'Contact', href: '/contact', kind: 'contact' },
          ];

      const reply = wantsWork
        ? 'I’m running in offline mode right now, but here are a few featured projects to browse.'
        : 'I’m running in offline mode right now. You can explore my background, work, or get in touch using the links below.';

      const payload = {
        reply,
        chips,
        projects: makeCardProjects(cardSlugs),
        mode: 'offline',
      };

      if (!wantsStream) return json(payload, 200);

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode(`event: final\ndata: ${JSON.stringify(payload)}\n\n`));
          controller.close();
        },
      });

      return sse(stream, 200);
    }

    // 3. LLM call via OpenRouter (paid)
    const callOpenRouter = async (messages: { role: 'system' | 'user' | 'assistant'; content: string }[], timeoutMs: number, retryCount = 0): Promise<string> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://nasifsalaam.com',
            'X-Title': 'Nasif Salaam Portfolio Chat',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages,
            temperature: 0.7,
            max_tokens: 2048,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter API error:', { status: response.status, body: errorText });

          if (response.status === 401) throw new Error('OPENROUTER_AUTH_ERROR');
          if (response.status === 429) {
            // Retry once with delay
            if (retryCount === 0) {
              console.log('OpenRouter rate limit hit, retrying after 2s delay...');
              clearTimeout(timer);
              await new Promise(resolve => setTimeout(resolve, 2000));
              return callOpenRouter(messages, Math.max(timeoutMs - 2000, 3000), 1);
            }
            throw new Error('OPENROUTER_RATE_LIMIT');
          }
          throw new Error('OPENROUTER_API_ERROR');
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      } catch (error: any) {
        console.error('OpenRouter raw error:', { message: error?.message, name: error?.name });
        if (error?.name === 'AbortError' || error?.message?.includes('abort')) throw new Error('OPENROUTER_TIMEOUT');
        if (error?.message?.includes('OPENROUTER_')) throw error; // Re-throw our custom errors
        throw new Error('OPENROUTER_API_ERROR');
      } finally {
        clearTimeout(timer);
      }
    };

    const systemPrompt = `
You are an AI assistant for Nasif Salaam.

Goal:
- Help visitors understand Nasif's work and experience and navigate the site.

Voice & tone:
- Relaxed but professional. Accessible and friendly, not robotic or stiff.
- Concise but conversational for casual questions. More comprehensive for recruitment queries.
- Use simple, clear language. Avoid jargon unless necessary.

Answer quality rules:
- Be specific. Use the provided Context.
- SYNTHESIZE information from the context, don't just recite it.
- Answer the SPECIFIC question asked. Don't dump all related information. Be selective and relevant.
- If the user request is ambiguous or you're missing key details, ask 1 clarification question.
- If the question is off-topic, gently redirect and provide 2–3 navigation chips.

CRITICAL FORMATTING RULES:
- Default to plain text (no markdown) for conversational questions
- BUT use bullet lists when the user explicitly asks to "list" something or asks for skills/experience breakdown
- Use "• " for bullets (not "- " or "* ")
- When listing skills, use this format:
  • Product Design & UX: Complex workflows and systems
  • Design Systems: Scalable component libraries and governance
  • Rapid Prototyping: Functional apps with real databases/APIs
  (etc.)
- For recruitment questions (years of experience, management, salary, notice period), provide complete structured answers

Recruitment query detection:
If the question asks about years of experience, team management, last role, notice period, salary, why looking for work, or skills breakdown, treat it as a recruitment query and:
1. Be comprehensive (ignore the brevity rule)
2. Use structured formatting (bullets, clear sections) when helpful
3. Never say "I don't have that detail" if you can infer from context
4. Sell the experience confidently: "Led team of 3 designers" not "mentored a few people"

Examples of when to use bullets:
- "list your skills" → use bullets
- "what are your top 5 skills" → use bullets
- "tell me about your experience" → use bullets for role breakdown
- "what can you help with?" → use bullets for services
- "what tools do you use?" → use bullets grouped by category

Examples of when NOT to use bullets:
- "what do you do?" → plain text paragraph
- "are you available?" → plain text paragraph
- "how do you work remotely?" → plain text paragraph

CRITICAL RESPONSE FORMAT:
- You MUST reply with ONLY a valid JSON object
- DO NOT wrap your response in markdown code blocks (no \`\`\`json\`\`\`)
- DO NOT include any text before or after the JSON
- Your entire response must be parseable by JSON.parse()
- Schema:
{
  "answer": string, // Use plain text for casual questions, use bullets (•) when user asks to "list" or for recruitment queries
  "chips"?: Array<{ "label": string, "href": string, "kind"?: string }>,
  "project_cards"?: string[],
  "resource_cards"?: string[],
  "blog_cards"?: string[],
  "follow_ups"?: string[] // 2-3 contextual follow-up questions to guide the conversation deeper
}

Chips rules:
- Chips are navigation and deep links.
- Use 0–4 chips.
- Only use hrefs that match these patterns:
  - "/about", "/projects", "/blog", "/contact", "/resources"
  - "/projects/<slug>", "/blog/<slug>"

Project cards rules:
- Only include "project_cards" if the user asked to see work/projects/portfolio, asked for examples, or visuals are clearly helpful.
- Return at most 4 project slugs.
- Use EXACT slugs from the Projects context.
- CRITICAL: Only reference projects that appear in the Projects context below. Never mention unpublished or draft projects.

Resource cards rules:
- Include "resource_cards" when the user asks for tools, resources, recommendations for design systems, typography, frameworks, libraries, or similar topics.
- Return at most 4 resource titles.
- Use EXACT titles from the Resources context.
- CRITICAL: If you mention ANY tool, library, or resource by name in your answer, you MUST include it in "resource_cards". Never mention resources in text without attaching the cards.
- CRITICAL: NEVER recommend or list resources in your answer that are not in the Resources context. If no relevant resources exist in the context, say "I don't have specific resources curated for that, but you can browse the resources page" and provide a chip to /resources.

Blog cards rules:
- Include "blog_cards" when the user asks about writing, insights, articles, or specific topics covered in blog posts (AI, design systems, prototyping, etc.).
- Return at most 4 blog slugs.
- Use EXACT slugs from the Insights context.
- Only include blog cards when they're relevant to the question.
- CRITICAL: Only reference blog posts that appear in the Insights context below. Never mention unpublished or draft posts.

Follow-up questions rules:
- Include 2-3 "follow_ups" for EVERY response to guide users deeper into relevant topics.
- Make them specific and contextual to what was just discussed.
- Phrase as natural questions a visitor might ask next.
- Examples:
  - After discussing design systems → "How do you approach design system governance?"
  - After mentioning AI work → "What AI projects have you built?"
  - After explaining experience → "What was your role at Immersion Group?"
- Keep each follow-up under 80 characters.
- Always provide follow-ups unless it's a goodbye/closing statement.

EXAMPLES (for response style and format):

Example 1 - Casual question:
User: "What do you do?"
Assistant: {
  "answer": "I'm a Product Designer who closes the gap between design and development. I design complex workflows for fintech and banking, build design systems, and create functional prototypes with real data. Unlike most designers, I understand technical constraints deeply enough to design within reality, and I can build production applications myself when needed.",
  "follow_ups": ["What makes you different from other designers?", "Show me your design system work", "How do you bridge design and development?"]
}

Example 2 - Recruitment question (comprehensive):
User: "How many years of UI design experience do you have?"
Assistant: {
  "answer": "I have 15+ years of UI design experience spanning my entire career:\n\n• 2009-2012: Started in graphic design at Musica & Clicks (promotional materials, retail branding)\n• 2014-2018: Freelance visual designer (web design, branding, WordPress development)\n• 2019-2021: Senior Digital Designer at Machete Creative (UI/UX for retail campaigns)\n• 2022-2024: Lead UI Designer at Immersion Group (design systems, fintech products)\n• 2024-present: Independent Product Designer (AI-accelerated development)\n\nMy work has evolved from print and digital design to execution-focused product design with technical implementation.",
  "chips": [{"label": "About", "href": "/about"}, {"label": "Contact", "href": "/contact"}]
}

Example 3 - Request with project cards:
User: "Show me your portfolio"
Assistant: {
  "answer": "Here are some featured projects showcasing design systems, AI products, and rapid prototyping work:",
  "project_cards": ["enterprise-design-system", "everprompt", "whatsapp-flow-builder", "ai-accelerated-coffee-directory"],
  "chips": [{"label": "Work", "href": "/projects"}],
  "follow_ups": ["Tell me about your design system process", "What AI projects have you built?", "How do you prototype so quickly?"]
}

Example 4 - Off-topic redirect:
User: "What's the weather like?"
Assistant: {
  "answer": "I'm here to help you learn about Nasif's work, experience, and services. I can answer questions about his projects, skills, background, or how to get in touch.",
  "chips": [{"label": "Work", "href": "/projects"}, {"label": "About", "href": "/about"}, {"label": "Contact", "href": "/contact"}]
}

Example 5 - Resources request (when relevant resources exist):
User: "What resources would you recommend for design systems?"
Assistant: {
  "answer": "For design systems, I recommend checking out the curated resources on the resources page. They cover design system tools, frameworks, and methodologies relevant to building scalable systems.",
  "resource_cards": ["Polaris Design System", "Material Design", "IBM Carbon"],
  "chips": [{"label": "Resources", "href": "/resources"}]
}

Example 6 - Resources request (when NO relevant resources exist):
User: "What tools do you recommend for video editing?"
Assistant: {
  "answer": "I don't have specific video editing resources curated on this site. The resources page focuses on design systems, AI tools, and development frameworks. You can browse the full collection there.",
  "chips": [{"label": "Resources", "href": "/resources"}]
}

Example 7 - Self-referential with resources (CORRECT - mentions tools AND includes cards):
User: "What do you use for Astro websites?"
Assistant: {
  "answer": "This portfolio you're looking at is actually built with Astro! I use Astro for static site generation, React for dynamic components, and UI libraries like Radix UI and shadcn/ui for accessible, customizable elements. Here are some of the key resources:",
  "resource_cards": ["Astro Docs", "React Docs", "Radix UI", "shadcn/ui"],
  "chips": [{"label": "Resources", "href": "/resources"}]
}

CRITICAL CONSTRAINT - Grounding in context:
- NEVER mention resource names, book titles, tool names, or specific recommendations that are not explicitly listed in the Resources context below.
- If asked for recommendations and nothing relevant exists in the Resources context, acknowledge this honestly rather than inventing resources.
- This applies to ALL content: projects, blog posts, and resources. Only reference what exists in the provided context.

SELF-REFERENTIAL EXAMPLES:
- When asked about Astro: "This portfolio you're looking at is actually built with Astro! It's a static site generator that combines great performance with developer experience."
- When asked about React/UI components: "I use React components throughout this site, including shadcn/ui and Radix UI for accessible UI elements."
- When asked about AI features: "The chat assistant you're using right now is an example of AI integration - it uses OpenRouter API with RAG (retrieval-augmented generation) to answer questions about my work."
- Always look for opportunities to reference the current portfolio as a practical example when relevant to the question.

Context - Nasif (single source of truth):
${knowledge}

Context - About page (auto-extracted):
${aboutText}

Context - Relevant Projects (top matches):
${projectContext}

Context - Relevant Insights (top matches):
${blogContext}

Context - Relevant Resources (top matches):
${resourceContext}
`;

    // Build chat history for Groq/OpenAI format
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Call OpenRouter (paid)
    const openrouterBudget = Math.min(remainingMs() - 1000, 8000);
    if (openrouterBudget < 3000) throw new Error('OPENROUTER_TIMEOUT');
    console.log(`OpenRouter time budget: ${openrouterBudget}ms (remaining: ${remainingMs()}ms)`);
    const raw = await callOpenRouter(messages, openrouterBudget);
    
    console.log('Chat response from: openrouter');
    console.log(`Raw response (first 200 chars): ${raw.slice(0, 200)}`);

    // Extract JSON from various formats
    let jsonStr = raw.trim();

    // Try to extract from markdown code blocks: ```json {...} ``` or ``` {...} ```
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      console.log('Extracted JSON from markdown code block');
      jsonStr = codeBlockMatch[1].trim();
    }

    // If still looks like it has extra text, try to find the JSON object
    if (!jsonStr.startsWith('{')) {
      const jsonObjectMatch = jsonStr.match(/(\{[\s\S]*\})/);
      if (jsonObjectMatch) {
        console.log('Extracted JSON object from mixed content');
        jsonStr = jsonObjectMatch[1].trim();
      }
    }

    let parsed: z.infer<typeof ModelJsonSchema> | null = null;
    try {
      const parsedJson = JSON.parse(jsonStr);
      // Try strict parse first, fall back to lenient parse
      const strict = ModelJsonSchema.safeParse(parsedJson);
      if (strict.success) {
        parsed = strict.data;
        console.log('Successfully parsed JSON response (strict)');
      } else {
        // Lenient: extract what we can even if some fields are wrong
        console.warn('Strict parse failed, using lenient extraction:', strict.error.issues.map(i => i.path.join('.')).join(', '));
        parsed = {
          answer: typeof parsedJson.answer === 'string' ? parsedJson.answer : (typeof parsedJson.reply === 'string' ? parsedJson.reply : ''),
          chips: Array.isArray(parsedJson.chips) ? parsedJson.chips : undefined,
          project_cards: Array.isArray(parsedJson.project_cards) ? parsedJson.project_cards : undefined,
          resource_cards: Array.isArray(parsedJson.resource_cards) ? parsedJson.resource_cards : undefined,
          blog_cards: Array.isArray(parsedJson.blog_cards) ? parsedJson.blog_cards : undefined,
          follow_ups: Array.isArray(parsedJson.follow_ups) ? parsedJson.follow_ups.filter((f: unknown) => typeof f === 'string').slice(0, 3) : undefined,
        };
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON');
      console.error('Raw response:', raw.slice(0, 500));
      console.error('Parse error:', parseError);
      // Last resort: use raw text as the answer
      const cleanRaw = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      if (cleanRaw.length > 10) {
        parsed = { answer: cleanRaw };
      }
    }

    const answer = parsed?.answer?.trim();
    const replyRaw = answer && answer.length ? answer : 'Could you share a bit more detail on what you’re looking for?';
    const reply = stripMarkdownLite(replyRaw);

    const chips = sanitizeChips(parsed?.chips ?? [], projectSlugs, blogSlugs);

    const requestedSlugs = Array.isArray(parsed?.project_cards) ? parsed!.project_cards!.slice(0, 6) : [];
    const attachedProjects = requestedSlugs.length ? makeCardProjects(requestedSlugs) : [];

    const requestedResources = Array.isArray(parsed?.resource_cards) ? parsed!.resource_cards!.slice(0, 6) : [];
    const attachedResources = requestedResources.length ? makeCardResources(requestedResources) : [];

    const requestedBlogSlugs = Array.isArray(parsed?.blog_cards) ? parsed!.blog_cards!.slice(0, 6) : [];
    const attachedBlogs = requestedBlogSlugs.length ? makeCardBlogs(requestedBlogSlugs) : [];

    const lowerMsg = userMessage.toLowerCase();
    const wantsWork =
      lowerMsg.includes('project') ||
      lowerMsg.includes('projects') ||
      lowerMsg.includes('work') ||
      lowerMsg.includes('portfolio') ||
      lowerMsg.includes('case study') ||
      lowerMsg.includes('case studies');

    const wantsResources =
      lowerMsg.includes('resource') ||
      lowerMsg.includes('tool') ||
      lowerMsg.includes('recommend') ||
      lowerMsg.includes('design system') ||
      lowerMsg.includes('typography') ||
      lowerMsg.includes('framework') ||
      lowerMsg.includes('library');

    const wantsBlogs =
      lowerMsg.includes('blog') ||
      lowerMsg.includes('article') ||
      lowerMsg.includes('writing') ||
      lowerMsg.includes('insight') ||
      lowerMsg.includes('post') ||
      lowerMsg.includes('read about');

    // If the model didn't return cards but the user clearly asked for portfolio/work, attach top matches.
    const inferredCards = wantsWork
      ? makeCardProjects(topProjects.map((p) => p.slug).slice(0, 4))
      : [];

    // If the model didn't return resources but user asked for recommendations, attach top matches.
    const inferredResources = wantsResources && attachedResources.length === 0
      ? makeCardResources(topResources.map((r) => r.title).slice(0, 4))
      : [];

    // If the model didn't return blog cards but user asked about writing/articles, attach top matches.
    const inferredBlogs = wantsBlogs && attachedBlogs.length === 0
      ? makeCardBlogs(topBlogs.map((b) => b.slug).slice(0, 4))
      : [];

    // If the model asked for cards but we couldn't resolve any, fall back to featured/top matches.
    const projectsForPayload =
      requestedSlugs.length && attachedProjects.length === 0
        ? makeCardProjects(projectItems.filter((p) => p.featured).map((p) => p.slug).slice(0, 4))
        : attachedProjects.length
          ? attachedProjects
          : inferredCards;

    const resourcesForPayload = attachedResources.length > 0 ? attachedResources : inferredResources;

    const blogsForPayload = attachedBlogs.length > 0 ? attachedBlogs : inferredBlogs;

    const followUps = Array.isArray(parsed?.follow_ups) ? parsed.follow_ups.slice(0, 3) : [];

    const payload = {
      reply,
      chips,
      projects: projectsForPayload,
      resources: resourcesForPayload,
      blogs: blogsForPayload,
      followUps,
      mode: 'online',
    };

    if (!wantsStream) return json(payload, 200);

    // SSE streaming: stream the *reply text* (not the JSON) for better UX.
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enc = new TextEncoder();
        const safe = String(reply);

        controller.enqueue(enc.encode('event: start\ndata: {}\n\n'));

        // Chunk typewriter-style
        const chunkSize = 28;
        for (let i = 0; i < safe.length; i += chunkSize) {
          const part = safe.slice(i, i + chunkSize);
          controller.enqueue(enc.encode(`event: delta\ndata: ${JSON.stringify({ text: part })}\n\n`));
          // small delay to reduce jitter
          await new Promise((r) => setTimeout(r, 12));
        }

        controller.enqueue(enc.encode(`event: final\ndata: ${JSON.stringify(payload)}\n\n`));
        controller.close();
      },
    });

    return sse(stream, 200);

  } catch (error: any) {
    console.error('API Error:', error);

    // Provide user-friendly error messages based on error type
    let errorReply = 'Sorry, something went wrong. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      const errorMsg = error.message;

      // Authentication errors
      if (errorMsg.includes('AUTH_ERROR')) {
        errorReply = 'The AI service is temporarily unavailable. Please try again later.';
        statusCode = 503;
      }
      // Rate limit errors
      else if (errorMsg.includes('RATE_LIMIT')) {
        console.warn('OpenRouter rate limit hit');
        errorReply = 'The AI assistant is experiencing high demand. Please wait a moment and try again.';
        statusCode = 429;
      }
      // Timeout errors
      else if (errorMsg.includes('TIMEOUT')) {
        errorReply = 'The request took too long to process. Please try again with a shorter message.';
        statusCode = 504;
      }
      // Generic API errors
      else if (errorMsg.includes('API_ERROR')) {
        console.warn('OpenRouter API error');
        errorReply = 'The AI assistant is temporarily unavailable. Please try again later.';
        statusCode = 503;
      }

      console.error('Error details:', { message: error.message, stack: error.stack });
    }

    return json({ reply: errorReply }, statusCode);
  }
};
