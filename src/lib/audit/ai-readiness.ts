export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AuditFinding = {
  id: string;
  title: string;
  severity: AuditSeverity;
  details: string;
  recommendation: string;
  points?: number;
};

export type AuditCategoryScores = {
  indexability: number;
  metadata: number;
  structuredData: number;
  contentStructure: number;
  accessibility: number;
  aiFriendliness: number;
};

export type AuditResult = {
  inputUrl: string;
  finalUrl: string;
  fetchedAt: string;
  status: number;
  ok: boolean;
  contentType?: string;
  isHttps: boolean;
  bytes: number;

  extracted: {
    title?: string;
    metaDescription?: string;
    canonical?: string;
    robotsMeta?: string;
    hasOgTitle: boolean;
    hasOgDescription: boolean;
    hasOgImage: boolean;
    hasTwitterCard: boolean;
    hasJsonLd: boolean;
    hasMain: boolean;
    hasArticle: boolean;
    h1Count: number;
    headingCount: number;
    imageCount: number;
    imageWithAltCount: number;
    likelyClientRendered: boolean;
  };

  checks: {
    robotsTxt?: { ok: boolean; status?: number };
    sitemap?: { ok: boolean; status?: number };
    llmsTxt?: { ok: boolean; status?: number };
  };

  score: {
    overall: number;
    categories: AuditCategoryScores;
  };

  findings: AuditFinding[];
};

export type AnalyzeOptions = {
  url: string;
  finalUrl: string;
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  html: string;
  bytes: number;
  checks?: AuditResult['checks'];
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const normalizeWs = (s: string) => String(s || '').replace(/\s+/g, ' ').trim();

const pickFirst = (html: string, re: RegExp) => {
  const m = html.match(re);
  return m && m[1] ? normalizeWs(m[1]) : undefined;
};

const hasTag = (html: string, re: RegExp) => re.test(html);

const countMatches = (html: string, re: RegExp) => {
  const m = html.match(re);
  return m ? m.length : 0;
};

const likelyClientRendered = (html: string) => {
  const h = html.toLowerCase();
  // Heuristics for popular SPA frameworks
  if (h.includes('id="__next"') || h.includes('__next_data__') || h.includes('__next_data__')) return true;
  if (h.includes('data-reactroot') || h.includes('reactroot')) return true;
  if (h.includes('id="root"') || h.includes('id="app"')) {
    // Only count as likely SPA if there isn't much real text content.
    const bodyTextApprox = h
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ');
    const len = normalizeWs(bodyTextApprox).length;
    if (len < 700) return true;
  }
  return false;
};

export const analyzeAiReadiness = (opts: AnalyzeOptions): AuditResult => {
  const { url: inputUrl, finalUrl, status, ok, headers, html, bytes, checks } = opts;
  const lowered = html.toLowerCase();

  const title = pickFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = pickFirst(
    html,
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );
  const canonical = pickFirst(
    html,
    /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
  );
  const robotsMeta = pickFirst(
    html,
    /<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );

  const hasOgTitle = hasTag(html, /<meta\s+[^>]*property=["']og:title["'][^>]*>/i);
  const hasOgDescription = hasTag(html, /<meta\s+[^>]*property=["']og:description["'][^>]*>/i);
  const hasOgImage = hasTag(html, /<meta\s+[^>]*property=["']og:image["'][^>]*>/i);
  const hasTwitterCard = hasTag(html, /<meta\s+[^>]*name=["']twitter:card["'][^>]*>/i);
  const hasJsonLd = hasTag(html, /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>/i);

  const hasMain = hasTag(html, /<main\b[^>]*>/i);
  const hasArticle = hasTag(html, /<article\b[^>]*>/i);

  const h1Count = countMatches(lowered, /<h1\b[^>]*>/g);
  const headingCount = countMatches(lowered, /<h[1-6]\b[^>]*>/g);

  const imageCount = countMatches(lowered, /<img\b[^>]*>/g);
  const imageWithAltCount = countMatches(lowered, /<img\b[^>]*\balt=["'][^"']*["'][^>]*>/g);

  const isHttps = finalUrl.startsWith('https://');
  const contentType = headers['content-type'];

  const spaLikely = likelyClientRendered(html);

  const findings: AuditFinding[] = [];

  // Indexability
  if (!ok || status >= 400) {
    findings.push({
      id: 'http_status',
      title: `Page returned HTTP ${status}`,
      severity: 'critical',
      details: 'AI systems and search crawlers often skip pages that error or redirect endlessly.',
      recommendation: 'Fix server errors, redirect chains, or blocked access. Re-run the audit after it returns 200 OK.',
      points: 20,
    });
  }

  const xRobotsTag = headers['x-robots-tag'];
  if (xRobotsTag && /noindex|none/i.test(xRobotsTag)) {
    findings.push({
      id: 'x_robots_noindex',
      title: 'X-Robots-Tag blocks indexing',
      severity: 'critical',
      details: `Found X-Robots-Tag: ${xRobotsTag}`,
      recommendation: 'Remove noindex/none directives from X-Robots-Tag for pages you want visible.',
      points: 25,
    });
  }

  if (robotsMeta && /noindex|none/i.test(robotsMeta)) {
    findings.push({
      id: 'meta_robots_noindex',
      title: 'Meta robots blocks indexing',
      severity: 'critical',
      details: `Found meta robots content="${robotsMeta}".`,
      recommendation: 'Remove noindex/none directives from meta robots for pages you want discoverable.',
      points: 25,
    });
  }

  // JS dependency
  if (spaLikely) {
    findings.push({
      id: 'spa_likely',
      title: 'Page looks like a client-rendered SPA',
      severity: 'high',
      details:
        'Many AI crawlers do not execute JavaScript. If your core content renders on the client, it may be invisible to AI.',
      recommendation:
        'Ensure core content is server-rendered or statically generated (SSR/SSG). Verify by disabling JavaScript and checking that key content still appears.',
      points: 18,
    });
  }

  if (!isHttps) {
    findings.push({
      id: 'not_https',
      title: 'Site is not HTTPS',
      severity: 'high',
      details: 'HTTPS is expected by modern platforms and improves trust and crawl reliability.',
      recommendation: 'Enable HTTPS and redirect HTTP → HTTPS.',
      points: 12,
    });
  }

  // Metadata
  if (!title || title.length < 8) {
    findings.push({
      id: 'missing_title',
      title: 'Missing/weak <title>',
      severity: 'high',
      details: 'Title is a primary signal for search, social previews, and AI summarization.',
      recommendation: 'Add a descriptive title (roughly 40–60 chars) that matches the page intent.',
      points: 10,
    });
  }

  if (!metaDescription || metaDescription.length < 60) {
    findings.push({
      id: 'missing_description',
      title: 'Missing/weak meta description',
      severity: 'medium',
      details: 'A good description improves SERP snippets and gives AI a concise summary anchor.',
      recommendation: 'Add a meta description (~120–160 chars) explaining who it’s for and what it provides.',
      points: 6,
    });
  }

  if (!canonical) {
    findings.push({
      id: 'missing_canonical',
      title: 'Missing canonical link',
      severity: 'medium',
      details: 'Canonical helps consolidate duplicates and makes citation URLs stable.',
      recommendation: 'Add a canonical URL pointing to the preferred version of the page.',
      points: 5,
    });
  }

  if (!hasOgTitle || !hasOgDescription || !hasOgImage) {
    findings.push({
      id: 'missing_open_graph',
      title: 'Open Graph metadata incomplete',
      severity: 'low',
      details: 'Social/AI previews often rely on og:title, og:description, and og:image.',
      recommendation: 'Add complete Open Graph tags so previews and citations look good.',
      points: 3,
    });
  }

  if (!hasTwitterCard) {
    findings.push({
      id: 'missing_twitter_card',
      title: 'Twitter card metadata missing',
      severity: 'info',
      details: 'Not critical for AI, but improves sharing previews.',
      recommendation: 'Add twitter:card (and optionally title/description/image).',
      points: 1,
    });
  }

  // Structured data
  if (!hasJsonLd) {
    findings.push({
      id: 'missing_jsonld',
      title: 'No JSON-LD structured data detected',
      severity: 'medium',
      details:
        'Schema.org JSON-LD helps machines understand entities, page type, and relationships (especially helpful for AI/citation contexts).',
      recommendation: 'Add JSON-LD (e.g., WebSite, Organization/Person, Article/Product/FAQ where relevant).',
      points: 8,
    });
  }

  // Content structure
  if (!hasMain) {
    findings.push({
      id: 'missing_main',
      title: 'No <main> landmark detected',
      severity: 'low',
      details: 'Semantic landmarks make content extraction easier for assistive tech and some parsers.',
      recommendation: 'Wrap primary content in a <main> element.',
      points: 2,
    });
  }

  if (h1Count === 0) {
    findings.push({
      id: 'missing_h1',
      title: 'No H1 detected',
      severity: 'medium',
      details: 'A single H1 improves content structure and extraction.',
      recommendation: 'Add one clear H1 that represents the page topic.',
      points: 6,
    });
  } else if (h1Count > 1) {
    findings.push({
      id: 'multiple_h1',
      title: 'Multiple H1s detected',
      severity: 'low',
      details: 'Multiple H1s can confuse extraction and hierarchy.',
      recommendation: 'Prefer a single H1, then use H2/H3 for sections.',
      points: 2,
    });
  }

  if (headingCount < 3) {
    findings.push({
      id: 'few_headings',
      title: 'Low heading structure',
      severity: 'info',
      details: 'Clear sections improve scanability for humans and machines.',
      recommendation: 'Add section headings (H2/H3) around major topics.',
      points: 1,
    });
  }

  // Accessibility (lite)
  if (imageCount >= 3) {
    const altRatio = imageWithAltCount / Math.max(1, imageCount);
    if (altRatio < 0.7) {
      findings.push({
        id: 'image_alt_low',
        title: 'Many images missing alt text',
        severity: 'medium',
        details: `Detected ~${imageCount} images, but only ~${imageWithAltCount} have alt text.`,
        recommendation: 'Add meaningful alt text for informative images; use empty alt (alt="") for decorative images.',
        points: 6,
      });
    }
  }

  // Extra checks (robots/sitemap/llms)
  if (checks?.robotsTxt && !checks.robotsTxt.ok) {
    findings.push({
      id: 'robots_missing',
      title: 'robots.txt missing or not accessible',
      severity: 'medium',
      details: `robots.txt fetch failed (status ${checks.robotsTxt.status ?? 'unknown'}).`,
      recommendation: 'Add a robots.txt and ensure it is publicly accessible.',
      points: 6,
    });
  }

  if (checks?.sitemap && !checks.sitemap.ok) {
    findings.push({
      id: 'sitemap_missing',
      title: 'sitemap.xml missing or not accessible',
      severity: 'low',
      details: `sitemap.xml fetch failed (status ${checks.sitemap.status ?? 'unknown'}).`,
      recommendation: 'Publish a sitemap.xml and reference it from robots.txt.',
      points: 3,
    });
  }

  if (checks?.llmsTxt && !checks.llmsTxt.ok) {
    findings.push({
      id: 'llms_txt_missing',
      title: 'llms.txt not found',
      severity: 'info',
      details: 'llms.txt is emerging, but it can help specify AI/crawler guidance and canonical content paths.',
      recommendation: 'Consider adding /llms.txt with a brief description and key URLs.',
      points: 1,
    });
  }

  // Category scoring (simple weighted model)
  const totalPenalty = findings.reduce((sum, f) => sum + (f.points ?? 0), 0);

  // Build category scores from key signals
  const indexabilitySignals =
    (ok ? 1 : 0) * 0.35 +
    (status >= 200 && status < 300 ? 1 : 0) * 0.25 +
    (robotsMeta && /noindex|none/i.test(robotsMeta) ? 0 : 1) * 0.25 +
    (xRobotsTag && /noindex|none/i.test(xRobotsTag) ? 0 : 1) * 0.15;

  const metadataSignals =
    (title && title.length >= 8 ? 1 : 0) * 0.35 +
    (metaDescription && metaDescription.length >= 60 ? 1 : 0) * 0.25 +
    (canonical ? 1 : 0) * 0.2 +
    (hasOgTitle && hasOgDescription && hasOgImage ? 1 : 0) * 0.2;

  const structuredSignals = (hasJsonLd ? 1 : 0) * 0.8 + (checks?.sitemap?.ok ? 1 : 0) * 0.2;

  const structureSignals =
    (hasMain ? 1 : 0) * 0.35 +
    (h1Count === 1 ? 1 : h1Count > 1 ? 0.6 : 0) * 0.35 +
    (headingCount >= 4 ? 1 : headingCount >= 2 ? 0.7 : 0.4) * 0.3;

  const altRatio = imageWithAltCount / Math.max(1, imageCount);
  const accessibilitySignals = (imageCount < 3 ? 1 : clamp01(altRatio)) * 0.7 + (hasMain ? 1 : 0) * 0.3;

  const aiSignals =
    (spaLikely ? 0.2 : 1) * 0.55 +
    (checks?.llmsTxt?.ok ? 1 : 0.6) * 0.15 +
    (checks?.robotsTxt?.ok ? 1 : 0.6) * 0.15 +
    (hasJsonLd ? 1 : 0.6) * 0.15;

  const categories: AuditCategoryScores = {
    indexability: clamp100(indexabilitySignals * 100),
    metadata: clamp100(metadataSignals * 100),
    structuredData: clamp100(structuredSignals * 100),
    contentStructure: clamp100(structureSignals * 100),
    accessibility: clamp100(accessibilitySignals * 100),
    aiFriendliness: clamp100(aiSignals * 100),
  };

  // Overall score starts from category avg, then subtract penalty lightly.
  const avg =
    (categories.indexability +
      categories.metadata +
      categories.structuredData +
      categories.contentStructure +
      categories.accessibility +
      categories.aiFriendliness) /
    6;

  const overall = clamp100(avg - totalPenalty * 0.35);

  // Prioritize findings (severity first, then points)
  const severityRank: Record<AuditSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  findings.sort((a, b) => {
    const sa = severityRank[a.severity];
    const sb = severityRank[b.severity];
    if (sa !== sb) return sa - sb;
    return (b.points ?? 0) - (a.points ?? 0);
  });

  return {
    inputUrl,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    status,
    ok,
    contentType,
    isHttps,
    bytes,
    extracted: {
      title,
      metaDescription,
      canonical,
      robotsMeta,
      hasOgTitle,
      hasOgDescription,
      hasOgImage,
      hasTwitterCard,
      hasJsonLd,
      hasMain,
      hasArticle,
      h1Count,
      headingCount,
      imageCount,
      imageWithAltCount,
      likelyClientRendered: spaLikely,
    },
    checks: checks ?? {},
    score: {
      overall,
      categories,
    },
    findings,
  };
};
