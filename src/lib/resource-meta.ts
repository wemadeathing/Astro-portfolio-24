export type ResourceMeta = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  author?: string;
};

const cache = new Map<string, ResourceMeta>();

const withTimeout = async <T>(p: Promise<T>, ms: number) => {
  let t: any;
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
};

const firstMeta = (html: string, patterns: RegExp[]) => {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
};

const isYouTubeUrl = (url: URL) => {
  const h = url.hostname.replace(/^www\./, '');
  return h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtu.be';
};

const getYouTubeId = (url: URL) => {
  const h = url.hostname.replace(/^www\./, '');
  if (h === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id || '';
  }
  if (h.endsWith('youtube.com')) {
    const v = url.searchParams.get('v');
    if (v) return v;
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'shorts' || p === 'embed');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  }
  return '';
};

const fetchJson = async (url: string, headers: Record<string, string>) => {
  const res = await withTimeout(fetch(url, { headers }), 4000);
  const json = await res.json().catch(() => ({}));
  return { res, json };
};

const fetchText = async (url: string, headers: Record<string, string>) => {
  const res = await withTimeout(fetch(url, { headers }), 5000);
  const text = await res.text();
  return { res, text };
};

const normalizeUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    // strip common tracking params
    for (const k of Array.from(u.searchParams.keys())) {
      if (k.startsWith('utm_') || k === 'si') u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return raw;
  }
};

export const getResourceMeta = async (rawUrl: string): Promise<ResourceMeta> => {
  const normalized = normalizeUrl(rawUrl);
  const cached = cache.get(normalized);
  if (cached) return cached;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (compatible; NasifSalaamBot/1.0; +https://www.nasifsalaam.com)',
    Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  };

  let meta: ResourceMeta = {};

  try {
    const url = new URL(normalized);

    // YouTube: use oEmbed for title/thumb (no API key).
    if (isYouTubeUrl(url)) {
      const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`;
      const { res, json } = await fetchJson(oembed, headers);
      if (res.ok) {
        meta = {
          title: typeof (json as any).title === 'string' ? (json as any).title : undefined,
          author: typeof (json as any).author_name === 'string' ? (json as any).author_name : undefined,
          image: typeof (json as any).thumbnail_url === 'string' ? (json as any).thumbnail_url : undefined,
          siteName: 'YouTube',
        };
      }

      // If oEmbed failed, still provide a thumbnail if we can.
      if (!meta.image) {
        const id = getYouTubeId(url);
        if (id) meta.image = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      }

      cache.set(normalized, meta);
      return meta;
    }

    // Generic: try Open Graph / <title>
    const { res, text } = await fetchText(url.toString(), headers);
    if (!res.ok) {
      cache.set(normalized, meta);
      return meta;
    }

    const ogTitle = firstMeta(text, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
    ]);

    const ogDesc = firstMeta(text, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ]);

    const ogImage = firstMeta(text, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ]);

    const titleTag = firstMeta(text, [/<title[^>]*>([^<]+)<\/title>/i]);

    meta = {
      title: ogTitle || titleTag || url.hostname,
      description: ogDesc || undefined,
      image: ogImage || undefined,
      siteName: url.hostname.replace(/^www\./, ''),
    };
  } catch {
    // ignore
  }

  cache.set(normalized, meta);
  return meta;
};
