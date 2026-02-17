import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { tagToSlug } from '../lib/tag-utils';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const buildDate = '2025-02-17';
  const baseUrl = String(site || 'https://www.nasifsalaam.com').replace(/\/$/, '');
  
  // Get all blog posts
  const blogPosts = await getCollection('blog');
  
  // Get all projects
  const projects = await getCollection('projects');

  // Static pages
  const staticPages = [
    {
      url: '/',
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '1.0'
    },
    {
      url: '/projects',
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      url: '/about',
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: '/contact',
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: '/blog',
      lastmod: buildDate,
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: '/resources',
      lastmod: buildDate,
      changefreq: 'weekly',
      priority: '0.7'
    },
    {
      url: '/work-with-me',
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: '/tools',
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.5'
    }
  ];

  // Blog post pages
  const blogPages = blogPosts.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: (post.data.updatedDate || post.data.pubDate).toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: '0.6'
  }));

  const blogTagPages = Array.from(
    new Set(
      blogPosts
        .flatMap((p) => p.data.tags ?? [])
        .map((t) => String(t).trim())
        .filter(Boolean)
        .map((t) => tagToSlug(t))
        .filter(Boolean)
    )
  ).map((slug) => ({
    url: `/blog/tags/${slug}`,
    lastmod: buildDate,
    changefreq: 'weekly',
    priority: '0.4'
  }));

  // Project pages
  const projectPages = projects
    .filter(project => project.data.published !== false)
    .map(project => ({
      url: `/projects/${project.slug}`,
      lastmod: buildDate,
      changefreq: 'monthly',
      priority: '0.6'
    }));

  // Combine all pages
  const allPages = [...staticPages, ...blogPages, ...blogTagPages, ...projectPages];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
