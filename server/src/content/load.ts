// Reads src/content/**/*.{md,mdx} directly from the Astro app's own content
// directory via gray-matter, rather than consuming a build-time JSON
// snapshot — one repo, one commit updates both content and the server's
// retrieval index, no cross-pipeline staleness. See plan §Layout.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { env } from '../env';

export interface ProjectDoc {
  slug: string;
  title: string;
  description: string;
  image: string;
  aiSummary: string;
  tags: string[];
  useForQuestions: string[];
  featured: boolean;
  published: boolean;
}

export interface BlogDoc {
  slug: string;
  title: string;
  description: string;
  aiSummary: string;
  topics: string[];
  pubDate: string;
}

export interface ResourceDoc {
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
}

export interface KnowledgeDoc {
  body: string;
}

export interface ContentCatalog {
  projects: ProjectDoc[];
  blog: BlogDoc[];
  resources: ResourceDoc[];
  knowledge: KnowledgeDoc;
}

function contentDir(sub: string): string {
  // process.cwd(), not import.meta.dirname: tsup bundles this file into a
  // single dist/index.js, so import.meta.dirname would resolve to dist/ in
  // production while pointing at the source file's real location in dev
  // (tsx doesn't bundle) — an inconsistency that would silently break only
  // in production. process.cwd() is stable in both, since both `tsx watch
  // src/index.ts` (dev) and `node dist/index.js` (Docker CMD) run with the
  // server/ directory as the working directory.
  return join(process.cwd(), env.CONTENT_DIR, sub);
}

function readDocs(dir: string, extensions: string[]): { slug: string; data: matter.GrayMatterFile<string> }[] {
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    console.warn(`Content directory not found: ${dir}`);
    return [];
  }

  return files
    .filter((f) => extensions.some((ext) => f.endsWith(ext)))
    .map((filename) => {
      const raw = readFileSync(join(dir, filename), 'utf-8');
      const slug = filename.replace(/\.(md|mdx)$/, '');
      return { slug, data: matter(raw) };
    });
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function loadContent(): ContentCatalog {
  const projectDocs = readDocs(contentDir('projects'), ['.mdx', '.md']);
  const projects: ProjectDoc[] = projectDocs
    .map(({ slug, data }) => ({
      slug,
      title: String(data.data.title ?? ''),
      description: String(data.data.description ?? ''),
      image: String(data.data.image ?? ''),
      aiSummary: String(data.data.ai_summary ?? ''),
      tags: asStringArray(data.data.tags),
      useForQuestions: asStringArray(data.data.use_for_questions),
      featured: Boolean(data.data.featured),
      published: data.data.published !== false,
    }))
    .filter((p) => p.published);

  const blogDocs = readDocs(contentDir('blog'), ['.mdx', '.md']);
  const blog: BlogDoc[] = blogDocs
    .map(({ slug, data }) => ({
      slug,
      title: String(data.data.title ?? ''),
      description: String(data.data.description ?? ''),
      aiSummary: String(data.data.ai_summary ?? ''),
      topics: asStringArray(data.data.topics),
      pubDate: data.data.pubDate ? new Date(data.data.pubDate).toISOString() : '',
    }))
    .sort((a, b) => (b.pubDate > a.pubDate ? 1 : -1));

  const resourceDocs = readDocs(contentDir('resources'), ['.md']);
  const resources: ResourceDoc[] = resourceDocs.map(({ data }) => ({
    title: String(data.data.title ?? ''),
    description: String(data.data.description ?? ''),
    url: String(data.data.url ?? ''),
    type: String(data.data.type ?? 'other'),
    tags: asStringArray(data.data.tags),
  }));

  const knowledgeDocs = readDocs(contentDir('assistant'), ['.md']);
  const knowledgeDoc = knowledgeDocs.find((d) => d.slug === 'knowledge');
  const knowledge: KnowledgeDoc = { body: knowledgeDoc?.data.content ?? '' };

  return { projects, blog, resources, knowledge };
}
