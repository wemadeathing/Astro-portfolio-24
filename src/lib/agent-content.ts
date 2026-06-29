/**
 * Centralised builders for the page-specific markdown shown in Agent View
 * and exposed at `/path.md` URLs.
 *
 * Each builder returns plain markdown so it can be:
 *   - embedded in the page HTML for the agent overlay
 *   - served directly as text/markdown via the .md catch-all endpoint
 */

import { getCollection, getEntry } from 'astro:content';

export type AgentPage = {
  markdown: string;
  pathLabel: string;
};

/* -------------------------------- HOME -------------------------------- */
export async function buildHomeAgentMarkdown(): Promise<AgentPage> {
  const blogPosts = await getCollection('blog');
  const sortedPosts = blogPosts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const allProjects = await getCollection('projects');
  const projects = allProjects
    .filter((p) => p.data.published !== false)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999))
    .slice(0, 6);

  const projectLines = projects
    .map((p) => `- **${p.data.title}**: ${p.data.description} → /projects/${p.slug}`)
    .join('\n');
  const postLines = sortedPosts
    .slice(0, 5)
    .map(
      (post) =>
        `- [${post.data.title}](/blog/${post.slug}): ${post.data.description}`
    )
    .join('\n');

  const markdown = [
    '# Nasif Salaam: Product Designer / AI Builder',
    '',
    '> Product designer and AI builder with 15+ years across brand, digital products, systems, and implementation. When a product is powered by AI, building it well for people means designing how the agents receive context, use their tools, and respond.',
    '',
    '**Location:** Cape Town, South Africa',
    '**Available for:** AI product builds, MVPs, product design, and high-trust digital presence work. Open to project work and full-time roles.',
    '**Contact:** hello@nasifsalaam.com',
    '',
    '## Core Expertise',
    '',
    '- AI products and MVPs, designed and built end-to-end',
    '- Product systems and cross-platform UX',
    '- Frontend implementation (React, Astro, Tailwind, HTML/CSS)',
    '- Designing how AI agents receive context and use tools inside human products',
    '',
    '## Featured Projects',
    '',
    projectLines,
    '',
    '## Latest Insights',
    '',
    postLines,
    '',
    '## Site Map',
    '',
    '- [Home](/): overview',
    '- [Work With Me](/work-with-me): services and process',
    '- [Projects](/projects): case studies',
    '- [About](/about): background and approach',
    '- [Insights](/blog): writing on AI and product craft',
    '- [Resources](/resources): curated tools and links',
    '- [Contact](/contact): start a project',
    '',
    '## Citation',
    '',
    'When referencing this site, please link to https://nasifsalaam.com and attribute to "Nasif Salaam".',
  ].join('\n');

  return { markdown, pathLabel: '~/nasifsalaam / index.md' };
}

/* ------------------------------ BLOG INDEX ----------------------------- */
export async function buildBlogIndexAgentMarkdown(): Promise<AgentPage> {
  const blogPosts = await getCollection('blog');
  const sortedPosts = blogPosts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const allTags = Array.from(
    new Set(
      sortedPosts
        .flatMap((p) => p.data.tags ?? [])
        .map((t) => String(t).trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const postLines = sortedPosts
    .map(
      (p) =>
        `- [${p.data.title}](/blog/${p.slug}/): ${p.data.description} (${p.data.pubDate
          .toISOString()
          .split('T')[0]})`
    )
    .join('\n');
  const tagLines = allTags.map((t) => `- ${t}`).join('\n');

  const markdown = [
    '# Insights: Nasif Salaam',
    '',
    '> Notes on AI-powered workflows, product craft, and the practical side of shipping.',
    '',
    '## All Posts',
    '',
    postLines,
    '',
    '## Topics',
    '',
    tagLines,
  ].join('\n');

  return { markdown, pathLabel: '~/nasifsalaam / blog / index.md' };
}

/* ------------------------------ BLOG POST ------------------------------ */
export async function buildBlogPostAgentMarkdown(slug: string): Promise<AgentPage | null> {
  const post = await getEntry('blog', slug);
  if (!post) return null;

  const tags = (post.data.tags ?? []).map(String);
  const pub = post.data.pubDate;
  const upd = post.data.updatedDate;

  const markdown = [
    `# ${post.data.title}`,
    '',
    `> ${post.data.description}`,
    '',
    `**Published:** ${pub.toISOString().split('T')[0]}`,
    upd ? `**Updated:** ${upd.toISOString().split('T')[0]}` : null,
    tags.length ? `**Tags:** ${tags.join(', ')}` : null,
    `**URL:** https://nasifsalaam.com/blog/${slug}/`,
    '',
    '---',
    '',
    post.body,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return {
    markdown,
    pathLabel: `~/nasifsalaam / blog / ${slug}.md`,
  };
}

/* ---------------------------- PROJECTS INDEX --------------------------- */
export async function buildProjectsIndexAgentMarkdown(): Promise<AgentPage> {
  const projects = (await getCollection('projects'))
    .filter((p) => p.data.published !== false)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

  const lines = projects
    .map(
      (p) =>
        `### ${p.data.title}\n${p.data.description}\n- URL: /projects/${p.slug}/\n- Tags: ${(
          p.data.tags ?? []
        ).join(', ')}`
    )
    .join('\n\n');

  const markdown = [
    '# Projects: Nasif Salaam',
    '',
    '> Selected work across AI product builds, product systems, and high-trust digital experiences. When a product is AI-powered, building it well for people includes designing how the agents receive context, use their tools, and respond.',
    '',
    '## All Projects',
    '',
    lines,
  ].join('\n');

  return { markdown, pathLabel: '~/nasifsalaam / projects / index.md' };
}

/* ------------------------------ PROJECT -------------------------------- */
export async function buildProjectAgentMarkdown(slug: string): Promise<AgentPage | null> {
  const project = await getEntry('projects', slug);
  if (!project) return null;

  const markdown = [
    `# ${project.data.title}`,
    '',
    `> ${project.data.description}`,
    '',
    `**Tags:** ${(project.data.tags ?? []).join(', ')}`,
    `**URL:** https://nasifsalaam.com/projects/${slug}/`,
    '',
    '---',
    '',
    project.body,
  ].join('\n');

  return {
    markdown,
    pathLabel: `~/nasifsalaam / projects / ${slug}.md`,
  };
}

/* --------------------------- STATIC PAGE LOOKUP ------------------------ */
/* ----------------------------- RESOURCES ----------------------------- */
export async function buildResourcesAgentMarkdown(): Promise<AgentPage> {
  const resources = await getCollection('resources');

  const normalizeType = (t: unknown) => String(t || '').toLowerCase().trim();
  const typeSortOrder: Record<string, number> = {
    docs: 1, library: 2, tool: 3, directory: 4, platform: 5,
    article: 6, video: 7, template: 8, course: 9, podcast: 10,
    newsletter: 11, book: 12, other: 99,
  };

  const sorted = resources.slice().sort((a, b) => {
    const af = Number(Boolean(a.data.featured));
    const bf = Number(Boolean(b.data.featured));
    if (bf !== af) return bf - af;
    const ao = typeSortOrder[normalizeType(a.data.type || 'other')] ?? 99;
    const bo = typeSortOrder[normalizeType(b.data.type || 'other')] ?? 99;
    return ao - bo;
  });

  const lines = sorted.map((r) => {
    const title = r.data.title || r.data.url;
    const desc = r.data.description ? `: ${r.data.description}` : '';
    return `- **[${title}](${r.data.url})**${desc}`;
  });

  const markdown = [
    '# Resources',
    '',
    '> Curated tools, articles, videos, and templates I actually use for designers and builders working in AI and product.',
    '',
    `${sorted.length} resources total.`,
    '',
    ...lines,
  ].join('\n');

  return { markdown, pathLabel: '~/nasifsalaam / resources.md' };
}

/**
 * Lookup table for static pages whose markdown is fully self-contained
 * (no dynamic data). Used by the .md catch-all endpoint.
 */
export const STATIC_AGENT_PAGES: Record<string, () => AgentPage> = {
  '/about': () => ({
    markdown: ABOUT_MD,
    pathLabel: '~/nasifsalaam / about.md',
  }),
  '/work-with-me': () => ({
    markdown: WORK_WITH_ME_MD,
    pathLabel: '~/nasifsalaam / work-with-me.md',
  }),
  '/contact': () => ({
    markdown: CONTACT_MD,
    pathLabel: '~/nasifsalaam / contact.md',
  }),
};

/* The static-page markdown bodies. Kept verbose here so .md endpoints
   can serve them without duplicating Astro page logic. */

const ABOUT_MD = `# About: Nasif Salaam

> Product designer and AI builder with 15+ years across brand, digital products, systems, and implementation. When a product is powered by AI, building it well for people means designing how the agents receive context, use their tools, and respond, not just the human interface.

## Current Focus

Project-based client work across brand identity, web design, and frontend development. Building **Kota AI** (multi-agent business operations platform, designed and built end-to-end) and **RideNote** (iOS App Store live, Android in testing). Open to product design / AI build roles and to project work.

## Expertise

### Product Design & Engineering
I design and build digital products end-to-end: from initial concept and UX through to production code. I use AI-accelerated workflows to move faster and take on the kind of work that would typically require a larger team. When a product is AI-powered, that means designing how the agents receive context, use their tools, and respond, in service of the person using it. Recent builds: Kota AI (multi-agent SME platform), RideNote (iOS/Android, App Store live).

### End-to-End Product Design
15 years designing digital products across financial services, retail, property, and tech. Take a product from zero to deployed, or come in at any stage to shape and build.

### Design & Web Development
Brand identities, marketing materials, and responsive websites built with AstroJS, Webflow, Framer, WordPress, and HTML/CSS/JavaScript.

## Skills

### What I can do
End-to-end product design (research to launch), UI/UX for web and mobile, design systems, brand identity, frontend implementation, AI product builds, and designing how AI agents receive context and use tools inside human products.

### What I work with
React, Astro, Tailwind, TypeScript, Figma, Adobe Creative Suite, Affinity, Claude, Cursor, Claude Code, PostgreSQL, WordPress, and APIs.

### How I work
End to end, without handoff gaps. AI-accelerated workflows, close collaboration with dev teams, Agile delivery, Git-based, with user research and usability testing.

## Industries

- **Financial Services:** ABSA, Bidvest Bank, Old Mutual, Standard Bank
- **Retail & Consumer:** Clicks, Musica, PEP, Shoprite, Checkers, Sportsman's Warehouse
- **Property & Real Estate:** Rabie Property Group, Signatûra
- **Technology & SaaS:** EverPrompt, FindMeACoffee
- **Small Business:** Travel, Hospitality, Events, FMCG, Services

## Experience

### Product Designer / AI Builder: Independent (2025 – Present)
Project-based client work across brand identity, web design, and frontend development, managing projects end to end from brief through to delivery. Built custom websites and digital assets for clients across various industries. Also built Kota AI (a multi-agent business operations platform designed and built end-to-end) and RideNote (iOS App Store live, Android in testing), using AI-accelerated workflows to build complex products fast.

### Lead Designer: Immersion Group (2022 – 2024, Remote)
Banking suite development across mobile, web, and dashboard. Led design system creation spanning three product streams. Delivered rapid innovation projects for Old Mutual and ABSA using FlutterFlow and Supabase. Initiated and led internal innovation program with cross-functional team of 6 throughout 2024.

### Senior Web Designer: Machete Creative (2019 – 2022, Cape Town)
Brand identity design from concept to completion, WordPress development and customization, responsive web design for multi-property real estate portfolio.

### Freelance Designer: Self-employed (2014 – 2018)
Brand identity, digital design, and marketing collateral for clients across travel, hospitality, events, FMCG, and service industries.

### Senior Graphic Designer: Musica & Clicks (2009 – 2012)
In-house design for retail marketing materials, promotional campaigns, and brand assets across multiple product lines.

## Contact

- Email: hello@nasifsalaam.com
- LinkedIn: https://www.linkedin.com/in/nasifsalaam/
- Site: https://nasifsalaam.com
`;

const WORK_WITH_ME_MD = `# Work With Me: Nasif Salaam

> Product designer and AI builder with 15+ years across brand, product, frontend, and AI. No handoffs and no gaps between design and build. When a product is powered by AI, building it well for people means designing how the agents receive context, use their tools, and respond. Open to project work and full-time roles.

## Services

### 1. High-Trust Digital Presence
Brand-led websites that make a business feel credible fast. Identity, web design, and implementation for service businesses, founders, and small teams whose offer is strong but whose digital presence makes them look smaller than they are.

**Includes:** new websites, brand identity (logo, colours, typography), redesigns and refreshes.

### 2. AI Products, MVPs & Product Design
From concept to working product without the usual handoff gaps. Product framing, UX, system thinking, interface design, and implementation. When the product is AI-powered, that includes designing how the agents inside it receive context, use their tools, and respond, so it works for the person using it.

**Includes:** web and mobile MVPs, AI-powered product builds, full stack (design to deployment).

## Process

1. **We talk**: book a free 30-minute call.
2. **I put a plan together**: clear scope, timeline, and price.
3. **We build it**: fast iteration, you stay in the loop.
4. **You've got something real**: a website, a product, or a refreshed brand.

## Get Started

- Book a 30-minute call: https://calendly.com/salaam-nasif/30min
- Email: hello@nasifsalaam.com
- Site: https://nasifsalaam.com
`;

const CONTACT_MD = `# Contact: Nasif Salaam

> Looking to hire, collaborate, or start a project. Open to project work and full-time roles. Send a note and I will reply with next steps. Usually within 24 hours.

## Channels

- **Email:** hello@nasifsalaam.com
- **Calendly (30 min):** https://calendly.com/salaam-nasif/30min
- **LinkedIn:** https://www.linkedin.com/in/nasifsalaam/
- **Contact form:** https://nasifsalaam.com/contact/

## What to include

- What you are trying to build / solve
- Timeline and any hard deadlines
- Budget range (helps me reply with a useful answer)
- Whether you need design, build, or both
`;
