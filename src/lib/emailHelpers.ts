export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Vite's dev-server module runner disallows dynamic `import.meta.env[key]`
// access (it needs statically analyzable `import.meta.env.NAME` references to
// inline at build time), so the build-time fallback below is a static
// snapshot rather than a dynamic lookup.
const IMPORT_META_ENV_SNAPSHOT: Record<string, string | undefined> = {
  RESEND_API_KEY: import.meta.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: import.meta.env.RESEND_FROM_EMAIL,
  CONTACT_EMAIL: import.meta.env.CONTACT_EMAIL,
};

export const getEnv = (key: string) => {
  // Runtime (Node)
  const nodeVal = (globalThis as any)?.process?.env?.[key];
  if (typeof nodeVal === 'string' && nodeVal.trim()) return nodeVal.trim();

  // Runtime (Edge / Deno)
  const denoGet = (globalThis as any)?.Deno?.env?.get;
  if (typeof denoGet === 'function') {
    const denoVal = denoGet.call((globalThis as any).Deno.env, key);
    if (typeof denoVal === 'string' && denoVal.trim()) return denoVal.trim();
  }

  // Build-time (Vite/Astro) fallback
  const buildTime = IMPORT_META_ENV_SNAPSHOT[key];
  return typeof buildTime === 'string' ? buildTime.trim() : '';
};

export const formatFrom = (emailOrFrom: string, label = 'Contact Form') => {
  if (!emailOrFrom) return '';
  // If already formatted like "Name <email@...>", keep it.
  if (emailOrFrom.includes('<') && emailOrFrom.includes('>')) return emailOrFrom;
  return `${label} <${emailOrFrom}>`;
};
