# Future features (later)
This doc captures ideas we can layer in after the Blog + Resources foundation is solid.

## Formats that match the “innovation off the charts” era
### Signal Notes (weekly / biweekly)
A short, repeatable post format:
- 3–5 bullets: what changed, why it matters, what to do next
- 1 deeper paragraph: your POV
- 1 “build link”: a demo/prototype/repo

### Build Logs (designer-who-ships)
A lightweight, high-signal log:
- what you built
- stack/tools
- time-to-ship
- what broke + what you learned

### Living pages (updated occasionally)
- “Best AI UI patterns this month”
- “Design system decisions that scale”
- “My current tool stack for shipping”

## Community mechanics
### Submit-a-resource
- Simple form to submit links
- You curate/approve before publishing

### Comments (lightweight)
- Offsite discussion link (newsletter reply / social)
- Or a minimal comment system if desired

## Product-y features for the blog
### Search and reading paths
- Search (client-side) across posts/resources
- “Start here” page + curated reading paths

### Better post UX
- Footnotes/citations component
- Highlighted pull-quotes
- “Last updated” callouts on posts

## AI-native, but grounded
### “Ask the site” (search-first)
- Search results show real posts/resources first
- Optional AI summary after (not instead of) results

## Algorithmic / autopilot features
### Perplexity-style Trends Feed (Design + AI)
Goal: a clean “Discover”/feed page that keeps the site feeling current without turning it into a noisy news site.

Pipeline (high level):
- Ingest: pull new items from a whitelist of sources (RSS/APIs where possible)
- Normalize + dedupe: extract canonical URL/title/date/source + remove duplicates
- Cluster + rank: group items into “story clusters” using similarity and score by recency + momentum + source quality
- Summarize (grounded): generate short summaries with citations (links to the sources)

Outputs:
- `/trends` page: top clusters + links
- Weekly “What moved” digest section (can also feed newsletter drafts)

Controls:
- Human-in-the-loop publish mode (approve clusters before they go live)
- Source allowlist + topic allowlist
- Diversity constraints (avoid 10 items of the same theme)

### Trend detection (2b)
Daily/weekly job that:
- identifies trending clusters (velocity of mentions + recency)
- flags “new + important” releases
- suggests tags and which items belong in Resources

### Auto newsletter drafts (MailerLite) (2c)
Weekly/biweekly job that:
- compiles top trends + newly-added resources + 1–2 posts
- generates a draft newsletter (subject line options + sections)
- creates a draft in MailerLite (or outputs ready-to-paste content) for review (not auto-send)

### AI Readiness Audit mini-tool (3a)
A public mini-tool for “Does my site work for AI?” that checks:
- robots visibility for common agents
- whether core content is readable without JS (SSR/static content)
- schema presence / basic structure
- sitemap/llms.txt presence

Outputs: score + prioritized fixes + links to your posts/resources.

## Operational
### Analytics loops
- Track events: resource clicks, newsletter submits, contact submits
- Use that data to prioritize new posts/resources and improve layout

---

# How to add resources
Resources live in `src/content/resources/` as simple Markdown files.

Minimal example (URL-only):
```yaml
---
url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
type: "video"
tags: ["AI", "Design"]
---
```

Optional overrides (if you want to control the card):
```yaml
---
url: "https://example.com/some-post"
title: "Custom title"
description: "Custom description"
image: "https://example.com/og-image.jpg"
type: "article"
tags: ["Design systems"]
featured: true
addedDate: 2025-12-16
---
```

Notes:
- If you only provide `url`, the site will attempt to auto-fetch title/thumbnail (YouTube is supported via oEmbed and thumbnail fallback).
- If a site blocks metadata fetching, add `title` and `image` manually.
