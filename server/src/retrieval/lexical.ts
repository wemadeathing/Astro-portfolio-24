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
