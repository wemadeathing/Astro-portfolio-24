# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Modern portfolio and blog website built with Astro, React, and Tailwind CSS. Deployed on Netlify with SSR capabilities. Features a content collection system for blog posts and project showcases.

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment
- Deploys automatically to Netlify on push to main branch
- Build command: `npm run build`
- Publish directory: `dist`

## Architecture

### SSR Configuration
- Uses Astro's server-side rendering mode (`output: 'server'`)
- Deployed with `@astrojs/netlify` adapter
- Pages support both static generation (`prerender: true`) and dynamic rendering

### Content Collections
Located in `src/content/` with schemas defined in `src/content/config.ts`:

**Blog Collection** (`src/content/blog/`)
- Type: MDX content files
- Required fields: `title`, `description`, `pubDate`, `image` (URL), `tags`
- Dynamic route: `/blog/[slug]`

**Projects Collection** (`src/content/projects/`)
- Type: MDX content files  
- Required fields: `title`, `description`, `image`, `tags`
- Optional fields: `featured` (boolean), `published` (boolean)
- Dynamic route: `/projects/[slug]`

### Key Patterns

**Fetching Collections:**
```typescript
import { getCollection, getEntry } from 'astro:content';

// Get all items from a collection
const projects = await getCollection('projects');

// Get single item by slug
const project = await getEntry('projects', slug);
```

**Page Generation:**
- Dynamic pages use `getStaticPaths()` with `prerender: true`
- Falls back to server-side rendering if static paths unavailable
- Content is rendered using `await collection.render()` which returns `{ Content, headings }`

### Environment Variables
Required variables (see `.env.example`):
- `RESEND_API_KEY` - For contact form email sending via Resend API
- `CONTACT_EMAIL` - Destination email for contact form submissions
- `WEB3FORMS_ACCESS_KEY` - Alternative contact form service

TypeScript types are defined in `src/env.d.ts`

### API Routes
Server endpoints in `src/pages/api/`:
- `/api/send-email.ts` - POST endpoint for contact form (uses Resend)
- Must have `export const prerender = false;` for SSR

### Component Architecture
- **Astro Components** (`src/components/*.astro`) - Server-rendered UI components
- **React Components** - Used where interactivity is needed
- **Layouts** (`src/layouts/Layout.astro`) - Base layout with SEO, meta tags, and navigation

### Styling System
- **Tailwind CSS** with custom theme in `tailwind.config.js`
- **Dark mode only** design (no light mode toggle)
- HSL-based color system with CSS custom properties in `src/styles/globals.css`
- Primary color: `80.5 82.6% 72.9%` (lime green)
- Font: Instrument Sans (`@fontsource/instrument-sans`)
- Component library utilities: `class-variance-authority`, `clsx`, `tailwind-merge`

### Code Style
- **Prettier** configuration in `.prettierrc`:
  - Single quotes
  - Semicolons
  - 2 space tabs
  - 100 character line width
- **ESLint** with TypeScript and Astro support
- Import alias: `@/*` maps to `src/*`

### TypeScript Configuration
- Non-strict mode (`strict: false`)
- `noImplicitAny: false` for flexibility
- Path alias: `@/*` → `src/*`

## Content Guidelines

### Adding Blog Posts
Create MDX file in `src/content/blog/` with frontmatter:
```yaml
---
title: "Post Title"
description: "Post description"
pubDate: 2024-01-01
image: "https://example.com/image.jpg"
tags: ["tag1", "tag2"]
---
```

### Adding Projects
Create MDX file in `src/content/projects/` with frontmatter:
```yaml
---
title: "Project Title"
description: "Project description"
image: "/images/work/project-image.jpg"
tags: ["Design", "Development"]
featured: true
published: true
---
```

### Static Assets
- Place images in `public/` or `src/images/`
- Project images organized in `src/images/work/`
- Reference public assets with absolute paths: `/images/file.jpg`

## Special Features

### SEO & Meta Tags
- Comprehensive meta tags, Open Graph, Twitter Cards in `Layout.astro`
- Structured data (JSON-LD) for Person schema
- Google Analytics integration (GA4)
- Sitemap generation at `/sitemap.xml.ts`

### Security Headers
Configured in `netlify.toml`:
- CSP, X-Frame-Options, HSTS
- API proxy for `/api/*` routes

### Interactive Features
- WhatsApp widget on all pages
- View transitions enabled (`<ViewTransitions />`)
- Table of contents for blog posts and projects with smooth scrolling
- PhotoSwipe library for image galleries

## File Organization

```
src/
├── components/     # Astro & React UI components
├── content/        # MDX content collections (blog, projects)
├── data/           # Static data files
├── images/         # Source images
├── layouts/        # Page layouts
├── pages/          # File-based routing
│   ├── api/        # Server endpoints
│   ├── blog/       # Blog pages
│   └── projects/   # Project pages
└── styles/         # Global CSS
```
