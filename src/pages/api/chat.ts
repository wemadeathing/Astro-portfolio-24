import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import aboutPageSource from '../about.astro?raw';
import { getResourceMeta } from '../../lib/resource-meta';

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
  const MAX_PER_WINDOW = 25;

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
  if (href === '/about' || href === '/projects' || href === '/blog' || href === '/contact') return true;
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
  for (const c of chips) {
    if (!c || typeof c !== 'object') continue;
    const label = (c as any).label;
    const href = (c as any).href;
    const kind = (c as any).kind;
    if (typeof label !== 'string' || typeof href !== 'string') continue;
    const cleanHref = href.trim();
    if (!cleanHref.startsWith('/')) continue;
    if (!allowedChipHref(cleanHref, projectSlugs, blogSlugs)) continue;
    out.push({ label: label.trim().slice(0, 32), href: cleanHref, kind: typeof kind === 'string' ? kind.slice(0, 24) : undefined });
    if (out.length >= 6) break;
  }
  return out;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    if (!rl.allow(ip)) {
      return json({ reply: 'Too many requests. Please wait a moment and try again.' }, 429);
    }

    const body = await request.json();
    const userMessageRaw = body?.message;
    const userMessage = typeof userMessageRaw === 'string' ? userMessageRaw : '';
    const historyRaw = Array.isArray(body?.history) ? body.history : [];

    const history = historyRaw
      .slice(-20)
      .map((msg: any) => ({ role: msg?.role, content: msg?.content }))
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');

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

    // 1) Gather content (the “brain”)
    const projects = await getCollection('projects');
    const blogPosts = await getCollection('blog');
    const resources = await getCollection('resources');
    const knowledgeEntry = await getEntry('assistant', 'knowledge');
    const knowledge = knowledgeEntry?.body ?? '';

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

      // Exact first
      const exact = new Set<string>();
      for (const s of wanted) {
        const low = s.toLowerCase();
        const hit = projects.find(
          (p) => low === p.slug.toLowerCase() || low === p.data.title.toLowerCase()
        );
        if (hit) exact.add(hit.slug);
      }

      // Fuzzy fallback
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
          if (best && best.score >= 0.55) exact.add(best.slug);
        }
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

    const makeCardResources = async (titles: string[]): Promise<ResourceCard[]> => {
      const wanted = titles
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .slice(0, 6);

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
          if (best && best.score >= 0.5) hit = best.r;
        }
        if (hit && !hits.some(h => h.data.url === hit!.data.url)) {
          hits.push(hit);
        }
        if (hits.length >= 6) break;
      }

      // Fetch metadata for images
      const matched = await Promise.all(
        hits.map(async (hit) => {
          const meta = await getResourceMeta(hit.data.url);
          return {
            title: hit.data.title,
            description: hit.data.description ?? '',
            url: hit.data.url,
            type: hit.data.type ?? 'other',
            tags: (hit.data as any).tags ?? [],
            image: (hit.data as any).image || meta.image,
            siteName: meta.siteName,
          };
        })
      );
      return matched;
    };

    // 2) Offline mode (no API key)
    if (!import.meta.env.GROQ_API_KEY && !import.meta.env.GEMINI_API_KEY) {
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

    // 3. LLM call with fallback (Groq primary, Gemini fallback)
    const callGroq = async (messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> => {
      const groq = new Groq({ apiKey: import.meta.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1024,
      });
      return completion.choices[0]?.message?.content || '';
    };

    const callGemini = async (systemPrompt: string, userMessage: string, history: { role: string; content: string }[]): Promise<string> => {
      const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const geminiHistory = history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will respond as Nasif\'s AI assistant following all the guidelines.' }] },
          ...geminiHistory,
        ],
      });
      const result = await chat.sendMessage(userMessage);
      return result.response.text() || '';
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

IMPORTANT OUTPUT FORMAT:
- You MUST reply with a single JSON object (no markdown wrapper, no extra text).
- Schema:
{
  "answer": string, // Use plain text for casual questions, use bullets (•) when user asks to "list" or for recruitment queries
  "chips"?: Array<{ "label": string, "href": string, "kind"?: string }>,
  "project_cards"?: string[],
  "resource_cards"?: string[]
}

Chips rules:
- Chips are navigation and deep links.
- Use 0–4 chips.
- Only use hrefs that match these patterns:
  - "/about", "/projects", "/blog", "/contact"
  - "/projects/<slug>", "/blog/<slug>"

Project cards rules:
- Only include "project_cards" if the user asked to see work/projects/portfolio, asked for examples, or visuals are clearly helpful.
- Return at most 4 project slugs.
- Use EXACT slugs from the Projects context.

Resource cards rules:
- Include "resource_cards" when the user asks for tools, resources, recommendations for design systems, typography, frameworks, libraries, or similar topics.
- Return at most 4 resource titles.
- Use EXACT titles from the Resources context.
- Briefly explain WHY you're recommending each resource in your answer.

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

    // Try Groq first, fall back to Gemini
    let raw = '';
    let usedProvider = 'groq';
    
    if (import.meta.env.GROQ_API_KEY) {
      try {
        raw = await callGroq(messages);
      } catch (groqError) {
        console.error('Groq API failed, trying Gemini fallback:', groqError);
        if (import.meta.env.GEMINI_API_KEY) {
          try {
            raw = await callGemini(systemPrompt, userMessage, history);
            usedProvider = 'gemini';
          } catch (geminiError) {
            console.error('Gemini fallback also failed:', geminiError);
            throw geminiError;
          }
        } else {
          throw groqError;
        }
      }
    } else if (import.meta.env.GEMINI_API_KEY) {
      raw = await callGemini(systemPrompt, userMessage, history);
      usedProvider = 'gemini';
    }
    
    console.log(`Chat response from: ${usedProvider}`);
    let parsed: z.infer<typeof ModelJsonSchema> | null = null;
    try {
      parsed = ModelJsonSchema.parse(JSON.parse(raw));
    } catch {
      parsed = null;
    }

    const answer = parsed?.answer?.trim();
    const replyRaw = answer && answer.length ? answer : 'Could you share a bit more detail on what you’re looking for?';
    const reply = stripMarkdownLite(replyRaw);

    const chips = sanitizeChips(parsed?.chips ?? [], projectSlugs, blogSlugs);

    const requestedSlugs = Array.isArray(parsed?.project_cards) ? parsed!.project_cards!.slice(0, 6) : [];
    const attachedProjects = requestedSlugs.length ? makeCardProjects(requestedSlugs) : [];

    const requestedResources = Array.isArray(parsed?.resource_cards) ? parsed!.resource_cards!.slice(0, 6) : [];
    const attachedResources = requestedResources.length ? await makeCardResources(requestedResources) : [];

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

    // If the model didn't return cards but the user clearly asked for portfolio/work, attach top matches.
    const inferredCards = wantsWork
      ? makeCardProjects(topProjects.map((p) => p.slug).slice(0, 4))
      : [];

    // If the model didn't return resources but user asked for recommendations, attach top matches.
    const inferredResources = wantsResources && attachedResources.length === 0
      ? await makeCardResources(topResources.map((r) => r.title).slice(0, 4))
      : [];

    // If the model asked for cards but we couldn't resolve any, fall back to featured/top matches.
    const projectsForPayload =
      requestedSlugs.length && attachedProjects.length === 0
        ? makeCardProjects(projectItems.filter((p) => p.featured).map((p) => p.slug).slice(0, 4))
        : attachedProjects.length
          ? attachedProjects
          : inferredCards;

    const resourcesForPayload = attachedResources.length > 0 ? attachedResources : inferredResources;

    const payload = {
      reply,
      chips,
      projects: projectsForPayload,
      resources: resourcesForPayload,
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

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return json({ reply: 'Sorry, something went wrong. Please try again.' }, 500);
  }
};
