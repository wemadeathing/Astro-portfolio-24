// Card resolution — ported from src/pages/api/chat.ts's makeCardProjects/
// makeCardResources/makeCardBlogs (exact match, then bigramDice fuzzy
// fallback at the same confidence thresholds already proven in production).
//
// The key change from the original: resolution results are returned to the
// CALLING TOOL as {shown, notFound} instead of being silently dropped. The
// tool feeds `notFound` back to the model as the tool result, so a model
// that names a project that doesn't exist finds out in the same turn and
// can self-correct, rather than the prose promising a card that never
// renders. See plan §Architecture ("Tools replace hallucination-prone ID
// emission").
import { bigramDice } from './lexical';
import type { ProjectDoc, BlogDoc, ResourceDoc } from '../content/load';
import type { ProjectCardData, ResourceCardData, BlogCardData } from '../../../shared/chat-protocol';

export interface ResolveResult<T> {
  shown: T[];
  notFound: string[];
}

const MAX_REQUESTED = 6;
const PROJECT_BLOG_FUZZY_THRESHOLD = 0.6;
const RESOURCE_FUZZY_THRESHOLD = 0.55;

export function resolveProjects(slugs: string[], projects: ProjectDoc[]): ResolveResult<ProjectCardData> {
  const wanted = slugs.map((s) => String(s || '').trim()).filter(Boolean).slice(0, MAX_REQUESTED);
  const notFound: string[] = [];
  const matched = new Set<string>();

  for (const s of wanted) {
    const low = s.toLowerCase();
    const hit = projects.find((p) => low === p.slug.toLowerCase() || low === p.title.toLowerCase());
    if (hit) matched.add(hit.slug);
    else notFound.push(s);
  }

  if (matched.size < wanted.length) {
    for (const s of wanted) {
      if (matched.size >= MAX_REQUESTED) break;
      const low = s.toLowerCase();
      if (Array.from(matched).some((x) => x.toLowerCase() === low)) continue;
      let best: { slug: string; score: number } | null = null;
      for (const p of projects) {
        const score = Math.max(bigramDice(s, p.slug), bigramDice(s, p.title));
        if (!best || score > best.score) best = { slug: p.slug, score };
      }
      if (best && best.score >= PROJECT_BLOG_FUZZY_THRESHOLD) {
        matched.add(best.slug);
        const idx = notFound.indexOf(s);
        if (idx >= 0) notFound.splice(idx, 1);
      }
    }
  }

  const shown: ProjectCardData[] = projects
    .filter((p) => matched.has(p.slug))
    .map((p) => ({ title: p.title, description: p.description, image: p.image, tags: p.tags, slug: p.slug }));

  return { shown, notFound };
}

export function resolveResources(titles: string[], resources: ResourceDoc[]): ResolveResult<ResourceCardData> {
  const wanted = titles.map((s) => String(s || '').trim()).filter(Boolean).slice(0, MAX_REQUESTED);
  const notFound: string[] = [];
  const hits: ResourceDoc[] = [];

  for (const t of wanted) {
    const low = t.toLowerCase();
    let hit = resources.find((r) => low === r.title.toLowerCase() || low === r.url.toLowerCase());

    if (!hit) {
      let best: { r: ResourceDoc; score: number } | null = null;
      for (const r of resources) {
        const score = Math.max(bigramDice(t, r.title), bigramDice(t, r.url));
        if (!best || score > best.score) best = { r, score };
      }
      if (best && best.score >= RESOURCE_FUZZY_THRESHOLD) {
        hit = best.r;
      } else {
        notFound.push(t);
      }
    }

    if (hit && !hits.some((h) => h.url === hit!.url)) hits.push(hit);
    if (hits.length >= MAX_REQUESTED) break;
  }

  const shown: ResourceCardData[] = hits.map((r) => ({
    title: r.title,
    description: r.description,
    url: r.url,
    type: r.type,
    tags: r.tags,
  }));

  return { shown, notFound };
}

export function resolveBlogs(slugs: string[], blog: BlogDoc[]): ResolveResult<BlogCardData> {
  const wanted = slugs.map((s) => String(s || '').trim()).filter(Boolean).slice(0, MAX_REQUESTED);
  const notFound: string[] = [];
  const matched = new Set<string>();

  for (const s of wanted) {
    const low = s.toLowerCase();
    const hit = blog.find((b) => low === b.slug.toLowerCase() || low === b.title.toLowerCase());
    if (hit) matched.add(hit.slug);
    else notFound.push(s);
  }

  if (matched.size < wanted.length) {
    for (const s of wanted) {
      if (matched.size >= MAX_REQUESTED) break;
      const low = s.toLowerCase();
      if (Array.from(matched).some((x) => x.toLowerCase() === low)) continue;
      let best: { slug: string; score: number } | null = null;
      for (const b of blog) {
        const score = Math.max(bigramDice(s, b.slug), bigramDice(s, b.title));
        if (!best || score > best.score) best = { slug: b.slug, score };
      }
      if (best && best.score >= PROJECT_BLOG_FUZZY_THRESHOLD) {
        matched.add(best.slug);
        const idx = notFound.indexOf(s);
        if (idx >= 0) notFound.splice(idx, 1);
      }
    }
  }

  const shown: BlogCardData[] = blog
    .filter((b) => matched.has(b.slug))
    .map((b) => ({ title: b.title, description: b.description, slug: b.slug, pubDate: b.pubDate, tags: b.topics }));

  return { shown, notFound };
}
