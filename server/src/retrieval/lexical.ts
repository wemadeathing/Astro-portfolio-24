// Ported verbatim from src/pages/api/chat.ts's normalize/tokenSet/jaccard/
// bigramDice. Kept because bigramDice beats embeddings at matching a short
// exact slug or resource title — card *resolution* stays purely lexical
// (identity, not similarity). See plan §Retrieval.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s\-_/]/g, '');
}

export function tokenSet(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3)
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export function bigramDice(a: string, b: string): number {
  const grams = (s: string) => {
    const x = normalize(s).replace(/\s+/g, '');
    const out: string[] = [];
    for (let i = 0; i < Math.max(0, x.length - 1); i++) out.push(x.slice(i, i + 2));
    return out;
  };
  const ag = grams(a);
  const bg = grams(b);
  if (!ag.length || !bg.length) return 0;
  const bag = new Map<string, number>();
  for (const g of ag) bag.set(g, (bag.get(g) ?? 0) + 1);
  let inter = 0;
  for (const g of bg) {
    const n = bag.get(g) ?? 0;
    if (n > 0) {
      inter += 1;
      bag.set(g, n - 1);
    }
  }
  return (2 * inter) / (ag.length + bg.length);
}

// Words that appear in almost every chunk of a portfolio knowledge base and
// therefore carry no ranking signal here ("work", "project", "design"...),
// plus ordinary English function words. Deliberately aggressive: what's left
// after filtering is what should actually discriminate between chunks.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'has', 'have', 'had', 'you', 'your', 'yours', 'his', 'her', 'their', 'they', 'them',
  'what', 'which', 'who', 'whom', 'whose', 'does', 'did', 'are', 'was', 'were', 'been', 'being', 'that', 'this',
  'these', 'those', 'from', 'about', 'can', 'could', 'would', 'should', 'will', 'shall', 'how', 'why', 'when',
  'where', 'into', 'over', 'under', 'out', 'any', 'all', 'some', 'more', 'most', 'much', 'many', 'other', 'than',
  'then', 'she', 'him', 'its', 'our', 'ours', 'not', 'but', 'also', 'just', 'get', 'got', 'use', 'used', 'using',
  'like', 'want', 'need', 'tell', 'give', 'show', 'say', 'said', 'know',
  // Corpus-specific: true of nearly every chunk, so useless for ranking.
  'nasif', 'work', 'works', 'worked', 'working', 'project', 'projects', 'design', 'designs', 'designed',
  'designer', 'experience', 'client', 'clients',
]);

/** Crude singular-ising stem — enough to match "banks"→"bank", "systems"→"system". */
function stem(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

/**
 * Fraction of the query's *discriminative* terms that actually appear in the
 * target text. Unlike bigramDice this reads chunk CONTENT, and unlike cosine
 * it can't be diluted by a long chunk — a query for "banks" scores 1.0
 * against the one chunk that names them, and 0 against the forty that don't.
 *
 * This exists because cosine alone could not separate them: measured against
 * the live index, "which banks has he worked with" ranked the chunk holding
 * "ABSA, Old Mutual, Standard Bank" *fourth* (0.2568) behind three chunks
 * that never mention a bank, and "what financial institutions has Nasif
 * worked with" dropped it out of the top 6 entirely. Every chunk in this
 * corpus is semantically "about Nasif", so embeddings score them all within
 * ~0.02 of each other and the ranking is effectively noise.
 */
export function keywordCoverage(query: string, target: string): number {
  const queryTerms = [...tokenSet(query)].map(stem).filter((t) => !STOPWORDS.has(t));
  if (queryTerms.length === 0) return 0;

  const targetTokens = [...tokenSet(target)].map(stem);
  let hits = 0;
  for (const term of queryTerms) {
    if (targetTokens.some((t) => t === term || t.startsWith(term) || term.startsWith(t))) hits += 1;
  }
  return hits / queryTerms.length;
}
