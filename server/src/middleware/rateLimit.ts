import type { Context, Next } from 'hono';

// Best-effort in-memory sliding-window rate limiter, ported from the pattern
// already used in src/pages/api/chat.ts. Keyed on sessionId+ip (compound) so
// one IP behind CGNAT doesn't lock out an entire building, and one session
// can't just rotate IPs to bypass the limit either.
function makeLimiter(windowMs: number, maxPerWindow: number) {
  const byKey = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const arr = byKey.get(key) ?? [];
    const recent = arr.filter((t) => now - t < windowMs);
    recent.push(now);
    byKey.set(key, recent);
    return recent.length <= maxPerWindow;
  };
}

const chatLimiter = makeLimiter(60_000, 12);
const submitLimiter = makeLimiter(60_000, 3);

function rateLimitKey(c: Context): string {
  const sessionId = c.req.header('x-session-id') || 'no-session';
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
  return `${sessionId}:${ip}`;
}

export async function chatRateLimit(c: Context, next: Next) {
  if (!chatLimiter(rateLimitKey(c))) {
    return c.json({ reply: 'Too many requests. Please wait a moment and try again.' }, 429);
  }
  await next();
}

export async function submitRateLimit(c: Context, next: Next) {
  if (!submitLimiter(rateLimitKey(c))) {
    return c.json({ success: false, error: 'Too many submissions. Please wait a moment and try again.' }, 429);
  }
  await next();
}
