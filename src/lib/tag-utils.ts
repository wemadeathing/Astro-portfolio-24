export const tagToSlug = (tag: string) =>
  String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const slugToTag = (slug: string, allTags: string[]) => {
  const s = String(slug || '').trim().toLowerCase();
  // Prefer exact slug match.
  const exact = allTags.find((t) => tagToSlug(t) === s);
  if (exact) return exact;

  // Fallback: try case-insensitive direct match.
  const direct = allTags.find((t) => t.toLowerCase() === s);
  return direct ?? null;
};
