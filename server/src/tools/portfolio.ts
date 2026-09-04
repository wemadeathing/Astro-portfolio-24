// Hiring-mode-only tools: search + display. Search and display are split
// deliberately — search returns summaries the model reasons over, display
// resolves identifiers against real content and renders cards. See plan
// §Architecture ("Tools replace hallucination-prone ID emission").
import { z } from 'zod';
import type { ToolDef } from '../agent/types';
import { resolveProjects, resolveResources, resolveBlogs } from '../retrieval/resolve';

export const searchResources: ToolDef = {
  name: 'search_resources',
  description: 'Search curated tools/resources (design systems, frameworks, libraries, articles) by topic. Returns summaries only — call show_resources with the returned titles to display cards.',
  params: z.object({ query: z.string().min(2).max(200), k: z.number().int().min(1).max(8).default(6) }),
  progressLabel: (a) => `Searching resources for "${a.query}"…`,
  execute: async ({ query, k }, ctx) => {
    const hits = await ctx.retrieval.search(query, { kinds: ['resource'], k });
    return { forModel: hits.map((h) => ({ title: h.refId, summary: h.content, score: Number(h.score.toFixed(3)) })) };
  },
};

export const searchBlog: ToolDef = {
  name: 'search_blog',
  description: 'Search blog posts/insights by topic. Returns summaries only — call show_blog with the returned slugs to display cards.',
  params: z.object({ query: z.string().min(2).max(200), k: z.number().int().min(1).max(6).default(4) }),
  progressLabel: (a) => `Searching insights for "${a.query}"…`,
  execute: async ({ query, k }, ctx) => {
    const hits = await ctx.retrieval.search(query, { kinds: ['blog'], k });
    return { forModel: hits.map((h) => ({ slug: h.refId, summary: h.content, score: Number(h.score.toFixed(3)) })) };
  },
};

export const showProjects: ToolDef = {
  name: 'show_projects',
  description: 'Display project cards to the user. Only call with slugs returned by search_projects — never guess a slug. At most 4.',
  params: z.object({ slugs: z.array(z.string()).min(1).max(4) }),
  progressLabel: () => 'Preparing project cards…',
  execute: async ({ slugs }, ctx) => {
    const { shown, notFound } = resolveProjects(slugs, ctx.catalog.projects);
    return {
      forModel: { shown: shown.map((p) => p.slug), not_found: notFound },
      ui: { projects: shown },
    };
  },
};

export const showResources: ToolDef = {
  name: 'show_resources',
  description: 'Display resource cards to the user. Only call with titles returned by search_resources — never guess a title. At most 4.',
  params: z.object({ titles: z.array(z.string()).min(1).max(4) }),
  progressLabel: () => 'Preparing resource cards…',
  execute: async ({ titles }, ctx) => {
    const { shown, notFound } = resolveResources(titles, ctx.catalog.resources);
    return {
      forModel: { shown: shown.map((r) => r.title), not_found: notFound },
      ui: { resources: shown },
    };
  },
};

export const showBlog: ToolDef = {
  name: 'show_blog',
  description: 'Display blog/insight cards to the user. Only call with slugs returned by search_blog — never guess a slug. At most 4.',
  params: z.object({ slugs: z.array(z.string()).min(1).max(4) }),
  progressLabel: () => 'Preparing insight cards…',
  execute: async ({ slugs }, ctx) => {
    const { shown, notFound } = resolveBlogs(slugs, ctx.catalog.blog);
    return {
      forModel: { shown: shown.map((b) => b.slug), not_found: notFound },
      ui: { blogs: shown },
    };
  },
};

const ALLOWED_HREFS = new Set(['/about', '/projects', '/blog', '/contact', '/resources']);

export const suggestLinks: ToolDef = {
  name: 'suggest_links',
  description: 'Offer navigation links (chips) to the user for site pages. hrefs must be one of: /about, /projects, /blog, /contact, /resources, or /projects/<slug>, /blog/<slug> for slugs already confirmed to exist via show_projects/show_blog.',
  params: z.object({
    links: z
      .array(z.object({ label: z.string().max(32), href: z.string() }))
      .min(1)
      .max(4),
  }),
  progressLabel: () => 'Adding navigation links…',
  execute: async (args, ctx) => {
    const links = args.links as { label: string; href: string }[];
    const knownProjectSlugs = new Set(ctx.catalog.projects.map((p) => p.slug));
    const knownBlogSlugs = new Set(ctx.catalog.blog.map((b) => b.slug));
    const valid = links.filter((l: { label: string; href: string }) => {
      if (ALLOWED_HREFS.has(l.href)) return true;
      const proj = l.href.match(/^\/projects\/([^/?#]+)$/);
      if (proj && knownProjectSlugs.has(proj[1])) return true;
      const blog = l.href.match(/^\/blog\/([^/?#]+)$/);
      if (blog && knownBlogSlugs.has(blog[1])) return true;
      return false;
    });
    const rejected = links.filter((l: { label: string; href: string }) => !valid.includes(l));
    return {
      forModel: { added: valid.map((l: { label: string; href: string }) => l.label), rejected: rejected.map((l: { label: string; href: string }) => l.href) },
      ui: { chips: valid },
    };
  },
};
