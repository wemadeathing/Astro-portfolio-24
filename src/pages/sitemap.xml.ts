import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { tagToSlug } from '../lib/tag-utils';

export const prerender = true;

const today = new Date().toISOString().split('T')[0];

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = String(site || 'https://nasifsalaam.com').replace(/\/$/, '');

  // Get all blog posts
  const blogPosts = await getCollection('blog');

  // Get all projects
  const projects = await getCollection('projects');

  // Static pages — trailing slashes match the canonical URLs emitted by Layout.astro
  const staticPages = [
    { url: '/', lastmod: today, changefreq: 'monthly', priority: '1.0' },
    { url: '/projects/', lastmod: today, changefreq: 'monthly', priority: '0.8' },
    { url: '/about/', lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { url: '/contact/', lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { url: '/blog/', lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { url: '/resources/', lastmod: today, changefreq: 'weekly', priority: '0.7' },
    { url: '/work-with-me/', lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { url: '/tools/', lastmod: today, changefreq: 'monthly', priority: '0.5' },
  ];

  // Blog post pages — real lastmod from frontmatter
  const blogPages = blogPosts.map((post) => ({
    url: `/blog/${post.slug}/`,
    lastmod: (post.data.updatedDate || post.data.pubDate).toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.6',
  }));

  // Tag pages — only include tags with >= 3 posts to avoid thin-content tag pages.
  const tagCounts = blogPosts
    .flatMap((p) => p.data.tags ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .reduce((acc, tag) => {
      acc.set(tag, (acc.get(tag) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

  const blogTagPages = Array.from(tagCounts.entries())
    .filter(([, count]) => count >= 3)
    .map(([tag]) => tagToSlug(tag))
    .filter(Boolean)
    .map((slug) => ({
      url: `/blog/tags/${slug}/`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.4',
    }));

  // Project pages
  const projectPages = projects
    .filter((project) => project.data.published !== false)
    .map((project) => ({
      url: `/projects/${project.slug}/`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.6',
    }));

  // Combine all pages
  const allPages = [...staticPages, ...blogPages, ...blogTagPages, ...projectPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
