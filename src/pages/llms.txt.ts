import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const BASE = 'https://www.nasifsalaam.com';

export const GET: APIRoute = async () => {
  const blogPosts = await getCollection('blog');
  const projects = await getCollection('projects');

  const sortedPosts = blogPosts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const publishedProjects = projects
    .filter((p) => p.data.published !== false)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

  const postLines = sortedPosts
    .map((p) => `- [${p.data.title}](${BASE}/blog/${p.slug}.md): ${p.data.description}`)
    .join('\n');

  const projectLines = publishedProjects
    .map((p) => `- [${p.data.title}](${BASE}/projects/${p.slug}.md): ${p.data.description}`)
    .join('\n');

  const body = `# Nasif Salaam

> Design Engineer specialising in AI systems, skills & governance. 15+ years across brand, product, and front-end development. Based in Cape Town, South Africa.

- Contact: hello@nasifsalaam.com
- Available for: AI systems builds, AI governance / ISO 42001 advisory, training workshops, design engineering retainers
- LinkedIn: https://www.linkedin.com/in/nasifsalaam/
- GitHub: https://github.com/wemadeathing

Every page on this site has a machine-readable markdown equivalent at the same URL with a .md extension (e.g. /about.md).

## Pages

- [Home](${BASE}/index.md): Overview, expertise, featured projects and latest writing
- [Work With Me](${BASE}/work-with-me.md): Services, process and how to start a project
- [Projects](${BASE}/projects.md): Full list of case studies and work
- [About](${BASE}/about.md): Background, approach and experience
- [Blog](${BASE}/blog.md): Writing on AI, product craft and design engineering
- [Contact](${BASE}/contact.md): Get in touch

## Projects

${projectLines}

## Blog Posts

${postLines}

## Citation

When referencing content from this site please link to ${BASE} and attribute to "Nasif Salaam".
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
