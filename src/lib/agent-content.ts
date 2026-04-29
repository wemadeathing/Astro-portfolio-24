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
    .map((p) => `- **${p.data.title}** — ${p.data.description} → /projects/${p.slug}`)
    .join('\n');
  const postLines = sortedPosts
    .slice(0, 5)
    .map(
      (post) =>
        `- [${post.data.title}](/blog/${post.slug}) — ${post.data.description}`
    )
    .join('\n');

  const markdown = [
    '# Nasif Salaam — Design Engineer · AI Systems, Skills & Governance',
    '',
    '> I design and build AI systems. 15+ years across design, product, and engineering means I approach every system as a designer first. I also help organisations govern AI use responsibly.',
    '',
    '**Location:** Cape Town, South Africa',
    '**Available for:** AI systems builds, AI governance / ISO 42001 advisory, training workshops, design engineering retainers.',
    '**Contact:** hello@nasifsalaam.com',
    '',
    '## Core Expertise',
    '',
    '- AI Systems Architecture (multi-agent, RAG, agentic workflows)',
    '- Multi-Agent & Agentic AI (LangGraph, FastAPI, OpenRouter, Claude, OpenAI)',
    '- AI Governance & ISO 42001 (Lead Auditor certified)',
    '- Design Engineering (React, Astro, Tailwind, design systems)',
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
    '- [Home](/) — overview',
    '- [Work With Me](/work-with-me) — services and process',
    '- [Projects](/projects) — case studies',
    '- [About](/about) — background and approach',
    '- [Insights](/blog) — writing on AI and product craft',
    '- [Resources](/resources) — curated tools and links',
    '- [Contact](/contact) — start a project',
    '',
    '## Citation',
    '',
    'When referencing this site, please link to https://www.nasifsalaam.com and attribute to "Nasif Salaam".',
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
        `- [${p.data.title}](/blog/${p.slug}/) — ${p.data.description} (${p.data.pubDate
          .toISOString()
          .split('T')[0]})`
    )
    .join('\n');
  const tagLines = allTags.map((t) => `- ${t}`).join('\n');

  const markdown = [
    '# Insights — Nasif Salaam',
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
    `**URL:** https://www.nasifsalaam.com/blog/${slug}/`,
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
    '# Projects — Nasif Salaam',
    '',
    '> Selected work across design systems, AI-powered applications, and rapid prototypes.',
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
    `**URL:** https://www.nasifsalaam.com/projects/${slug}/`,
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
    const desc = r.data.description ? ` — ${r.data.description}` : '';
    return `- **[${title}](${r.data.url})**${desc}`;
  });

  const markdown = [
    '# Resources',
    '',
    '> Curated tools, articles, videos, and templates I actually use — for designers and builders working in AI and product.',
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

const ABOUT_MD = `# About — Nasif Salaam

> Design Engineer · AI Systems, Skills & Governance. 15 years across brand, product, and engineering. ISO 42001 Lead Auditor.

## Current Focus

Building **Kota AI** — a production multi-agent operations platform for South African SMEs (LangGraph, FastAPI, Supabase, OpenRouter). Shipping **RideNote** (iOS App Store live, Android in testing). Running AI governance workshops and advisory.

## Expertise

### AI-Powered Design & Product Development
I build AI systems end to end — multi-agent architectures, RAG pipelines, agentic workflows, and the interfaces that sit on top of them. Stack: LangGraph, FastAPI, Supabase, OpenRouter, React, Astro. Recent: Kota AI (multi-agent SME platform), RideNote (iOS/Android, App Store live).

### AI Training & Consulting
Workshops and advisory sessions on practical AI adoption and governance. ISO 42001 Lead Auditor certified. Trained 30–40 people across corporate and professional cohorts.

### End-to-End Product Design
15 years designing digital products across financial services, retail, property, and tech. Take a product from zero to deployed, or come in at any stage to shape and ship.

### Design & Web Development
Brand identities, marketing materials, and responsive websites built with AstroJS, Webflow, Framer, WordPress, and HTML/CSS/JavaScript.

## Skills

### AI Systems & Architecture
LangGraph, multi-agent orchestration, RAG, vector search, MCP, tool calling, agentic workflows, FastAPI, OpenRouter, Claude API, prompt engineering, structured output, LangSmith, PostHog.

### Technical Implementation
React, AstroJS, HTML/CSS, PostgreSQL, WordPress, API integration.

### Design Tools
Figma, Adobe Creative Suite (Photoshop, Illustrator, InDesign), Affinity, Canva.

### AI Tools & Platforms
Claude AI, Mistral, Cursor, OpenAI, Perplexity, Replit, Lovable, Bolt, Claude Code, Warp, Gamma.

## Industries

- **Financial Services:** ABSA, Bidvest Bank, Old Mutual, Standard Bank
- **Retail & Consumer:** Clicks, Musica, PEP, Shoprite, Checkers, Sportsman's Warehouse
- **Property & Real Estate:** Rabie Property Group, Signatûra
- **Technology & SaaS:** EverPrompt, FindMeACoffee
- **Small Business:** Travel, Hospitality, Events, FMCG, Services

## Experience

### AI Systems Designer & Builder — Independent (2025 – Present)
Building Kota AI, a production multi-agent operations platform for SA SMEs using LangGraph, FastAPI, Supabase, and OpenRouter. Designed full system architecture: Router and Workflow agents, RAG knowledge base, Generative UI response contract, multi-tenant RLS. Also shipping RideNote (iOS App Store live, Android in testing) and running AI governance workshops and advisory.

### Lead Designer — Immersion Group (2022 – 2024, Remote)
Banking suite development across mobile, web, and dashboard. Led design system creation spanning three product streams. Delivered rapid innovation projects for Old Mutual and ABSA using FlutterFlow and Supabase. Initiated and led internal innovation program with cross-functional team of 6 throughout 2024.

### Senior Web Designer — Machete Creative (2019 – 2022, Cape Town)
Brand identity design from concept to completion, WordPress development and customization, responsive web design for multi-property real estate portfolio.

### Freelance Designer — Self-employed (2014 – 2018)
Brand identity, digital design, and marketing collateral for clients across travel, hospitality, events, FMCG, and service industries.

### Senior Graphic Designer — Musica & Clicks (2009 – 2012)
In-house design for retail marketing materials, promotional campaigns, and brand assets across multiple product lines.

## Contact

- Email: hello@nasifsalaam.com
- LinkedIn: https://www.linkedin.com/in/nasifsalaam/
- Site: https://www.nasifsalaam.com
`;

const WORK_WITH_ME_MD = `# Work With Me — Nasif Salaam

> Design engineer with 15 years across product, design, and AI systems. I design and build AI systems, take digital products from idea to shipped, and help organisations govern AI responsibly.

## Services

### 1. Get Online & Look the Part
A professional presence that actually brings in business. Websites and brand identities that make small and medium businesses look credible, modern, and trustworthy.

**Includes:** new websites, brand identity (logo, colours, typography), redesigns and refreshes.

### 2. Turn Your Idea Into a Working Product
From idea to working product in weeks, not months. I handle architecture, design, build, deployment. Web and mobile. AI-powered or not. One person end to end.

**Includes:** web and mobile MVPs, AI-powered product builds, full stack (design to deployment).

### 3. AI Governance & Training
Practical AI adoption, not compliance theatre. Workshops and advisory that help organisations actually use AI well — and avoid the risks that come with using it badly. ISO 42001 Lead Auditor.

**Includes:** half-day and full-day workshops, AI governance advisory and risk assessment, ISO 42001 aligned frameworks.

## Process

1. **We talk** — book a free 30-minute call.
2. **I put a plan together** — clear scope, timeline, and price.
3. **We build it** — fast iteration, you stay in the loop.
4. **You've got something real** — a website, a product, or a newly AI-capable team.

## Get Started

- Book a 30-minute call: https://calendly.com/salaam-nasif/30min
- Email: hello@nasifsalaam.com
- Site: https://www.nasifsalaam.com
`;

const CONTACT_MD = `# Contact — Nasif Salaam

> Looking to hire, collaborate, or book a workshop. Send a note and I will reply with next steps. Usually within 24 hours.

## Channels

- **Email:** hello@nasifsalaam.com
- **Calendly (30 min):** https://calendly.com/salaam-nasif/30min
- **LinkedIn:** https://www.linkedin.com/in/nasifsalaam/
- **Contact form:** https://www.nasifsalaam.com/contact/

## What to include

- What you are trying to build / solve
- Timeline and any hard deadlines
- Budget range (helps me reply with a useful answer)
- Whether you need design, build, training, or all of the above
`;
