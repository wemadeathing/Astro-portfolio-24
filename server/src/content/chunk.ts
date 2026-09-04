// Splits the content catalog into ~180 small, embeddable chunks. See plan
// §Retrieval — the corpus is small enough that a simple heading-based split
// plus brute-force cosine similarity beats any more "sophisticated" scheme.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { ContentCatalog } from './load';
import { env } from '../env';
import type { ChunkKind } from '../db/schema';

export interface Chunk {
  id: string; // e.g. 'knowledge:working-style#how-nasif-works'
  kind: ChunkKind;
  refId: string; // slug/title/'about' — what card resolution keys off
  heading?: string;
  content: string;
  contentHash: string;
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function makeChunk(kind: ChunkKind, refId: string, heading: string | undefined, content: string, embeddingModel: string): Chunk {
  const id = heading ? `${kind}:${refId}#${slugify(heading)}` : `${kind}:${refId}`;
  const trimmed = content.trim();
  return {
    id,
    kind,
    refId,
    heading,
    content: trimmed,
    contentHash: hash(`${embeddingModel}:${trimmed}`),
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

const MIN_CHUNK_CHARS = 200;
const MAX_CHUNK_CHARS = 1200;

/** Splits markdown on ## or ### headings, prepending the parent heading for context. */
function chunkMarkdownByHeading(markdown: string): { heading: string; content: string }[] {
  const lines = markdown.split('\n');
  const sections: { level: number; heading: string; lines: string[] }[] = [];
  let current: { level: number; heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h2 || h3) {
      if (current) sections.push(current);
      current = { level: h2 ? 2 : 3, heading: (h2 ?? h3)![1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
    // Lines before the first heading are dropped (title/intro noise).
  }
  if (current) sections.push(current);

  // Prepend the nearest preceding H2 to each H3 section for context.
  let lastH2 = '';
  const withContext: { heading: string; content: string }[] = [];
  for (const s of sections) {
    if (s.level === 2) lastH2 = s.heading;
    const heading = s.level === 3 && lastH2 ? `${lastH2} › ${s.heading}` : s.heading;
    withContext.push({ heading, content: s.lines.join('\n').trim() });
  }

  // Merge short chunks into the next one, split long ones on paragraph breaks.
  const merged: { heading: string; content: string }[] = [];
  let pending: { heading: string; content: string } | null = null;
  for (const chunk of withContext) {
    const combined: { heading: string; content: string } = pending
      ? { heading: pending.heading, content: `${pending.content}\n\n${chunk.content}` }
      : chunk;
    if (combined.content.length < MIN_CHUNK_CHARS) {
      pending = combined;
      continue;
    }
    pending = null;
    if (combined.content.length <= MAX_CHUNK_CHARS) {
      merged.push(combined);
      continue;
    }
    // Split oversized chunks on paragraph boundaries.
    const paragraphs = combined.content.split(/\n\n+/);
    let buf = '';
    for (const p of paragraphs) {
      if ((buf + '\n\n' + p).length > MAX_CHUNK_CHARS && buf) {
        merged.push({ heading: combined.heading, content: buf.trim() });
        buf = p;
      } else {
        buf = buf ? `${buf}\n\n${p}` : p;
      }
    }
    if (buf.trim()) merged.push({ heading: combined.heading, content: buf.trim() });
  }
  if (pending && pending.content.trim()) merged.push(pending);

  return merged;
}

function stripAstroFrontmatter(src: string): string {
  return src.replace(/^---[\s\S]*?---\s*/, '');
}
function stripAstroExpressions(src: string): string {
  return src.replace(/\{[\s\S]*?\}/g, ' ');
}
function stripHtmlTags(src: string): string {
  return src.replace(/<[^>]*>/g, ' ');
}
function normalizeWhitespace(src: string): string {
  return src.replace(/\s+/g, ' ').trim();
}

function loadAboutText(): string {
  try {
    // process.cwd(), not import.meta.dirname — see the identical note in
    // content/load.ts's contentDir().
    const aboutPath = join(process.cwd(), '..', 'src', 'pages', 'about.astro');
    const raw = readFileSync(aboutPath, 'utf-8');
    return normalizeWhitespace(stripHtmlTags(stripAstroExpressions(stripAstroFrontmatter(raw)))).slice(0, 6000);
  } catch (err) {
    console.warn('Could not load about.astro for chunking:', err);
    return '';
  }
}

export function chunkAll(catalog: ContentCatalog, embeddingModel: string): Chunk[] {
  const chunks: Chunk[] = [];

  // Knowledge base — the main win: was injected wholesale (368 lines) into
  // every single prompt; now split into ~55-70 targeted chunks.
  for (const { heading, content } of chunkMarkdownByHeading(catalog.knowledge.body)) {
    chunks.push(makeChunk('knowledge', 'knowledge', heading, content, embeddingModel));
  }

  // About page, same treatment.
  const aboutText = loadAboutText();
  if (aboutText) {
    for (const { heading, content } of chunkMarkdownByHeading(`## About\n${aboutText}`)) {
      chunks.push(makeChunk('about', 'about', heading || 'About', content, embeddingModel));
    }
    // Fallback: if the About page has no ## headings (likely, it's prose),
    // just embed it as one chunk instead of losing it to the merge pass.
    if (chunks.filter((c) => c.kind === 'about').length === 0) {
      chunks.push(makeChunk('about', 'about', 'About', aboutText, embeddingModel));
    }
  }

  // Projects — one chunk each, whole-document (short, and card resolution
  // is per-project anyway so splitting would hurt more than help).
  for (const p of catalog.projects) {
    const keywords = (p.useForQuestions.length ? p.useForQuestions : p.tags).join(', ');
    const summary = p.aiSummary || p.description;
    const content = `${p.title}\nKeywords: ${keywords}\n${summary}${p.featured ? '\n[featured]' : ''}`;
    chunks.push(makeChunk('project', p.slug, p.title, content, embeddingModel));
  }

  // Blog — one chunk each.
  for (const b of catalog.blog) {
    const topics = b.topics.join(', ');
    const summary = b.aiSummary || b.description;
    const content = `${b.title}${topics ? `\nTopics: ${topics}` : ''}\n${summary}`;
    chunks.push(makeChunk('blog', b.slug, b.title, content, embeddingModel));
  }

  // Resources — one chunk each.
  for (const r of catalog.resources) {
    const tags = r.tags.join(', ');
    const content = `${r.title} (${r.type}${tags ? `, ${tags}` : ''})\n${r.description}`;
    chunks.push(makeChunk('resource', r.title, r.title, content, embeddingModel));
  }

  return chunks;
}
