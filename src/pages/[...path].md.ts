/**
 * Catch-all .md endpoint — Speakeasy-style direct markdown access for any page.
 *
 * Examples:
 *   /index.md
 *   /about.md
 *   /work-with-me.md
 *   /contact.md
 *   /blog.md
 *   /blog/building-ridenote-choosing-the-tech-stack.md
 *   /projects.md
 *   /projects/kota-ai.md
 *
 * Returns plain text/markdown so AI agents and humans can read the page
 * source without executing JavaScript.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  STATIC_AGENT_PAGES,
  buildHomeAgentMarkdown,
  buildBlogIndexAgentMarkdown,
  buildBlogPostAgentMarkdown,
  buildProjectsIndexAgentMarkdown,
  buildProjectAgentMarkdown,
  buildResourcesAgentMarkdown,
} from '../lib/agent-content';

export const prerender = true;

export async function getStaticPaths() {
  const blogPosts = await getCollection('blog');
  const projects = await getCollection('projects');

  const paths: { params: { path: string } }[] = [
    { params: { path: 'index' } },
    { params: { path: 'about' } },
    { params: { path: 'work-with-me' } },
    { params: { path: 'contact' } },
    { params: { path: 'blog' } },
    { params: { path: 'projects' } },
    { params: { path: 'resources' } },
  ];

  for (const post of blogPosts) {
    paths.push({ params: { path: `blog/${post.slug}` } });
  }
  for (const project of projects) {
    if (project.data.published === false) continue;
    paths.push({ params: { path: `projects/${project.slug}` } });
  }

  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  const raw = String(params.path || '').replace(/\.md$/, '');
  const normalized = raw === '' || raw === 'index' ? '/' : `/${raw}`;

  const respond = (markdown: string) =>
    new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  // Home
  if (normalized === '/') {
    const { markdown } = await buildHomeAgentMarkdown();
    return respond(markdown);
  }

  // Static pages
  if (STATIC_AGENT_PAGES[normalized]) {
    const { markdown } = STATIC_AGENT_PAGES[normalized]();
    return respond(markdown);
  }

  // Blog index
  if (normalized === '/blog') {
    const { markdown } = await buildBlogIndexAgentMarkdown();
    return respond(markdown);
  }

  // Projects index
  if (normalized === '/projects') {
    const { markdown } = await buildProjectsIndexAgentMarkdown();
    return respond(markdown);
  }

  // Resources
  if (normalized === '/resources') {
    const { markdown } = await buildResourcesAgentMarkdown();
    return respond(markdown);
  }

  // Blog post
  const blogMatch = normalized.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const result = await buildBlogPostAgentMarkdown(blogMatch[1]);
    if (result) return respond(result.markdown);
  }

  // Project
  const projectMatch = normalized.match(/^\/projects\/(.+)$/);
  if (projectMatch) {
    const result = await buildProjectAgentMarkdown(projectMatch[1]);
    if (result) return respond(result.markdown);
  }

  return new Response('# 404 — Not Found\n\nNo markdown source for this path.\n', {
    status: 404,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
