import { cors } from 'hono/cors';
import { allowedOrigins } from '../env';

// Function-form origin check (not a wildcard/list) because Netlify deploy
// previews have dynamic hostnames (*-​-nasifsalaam.netlify.app) that a
// static allowlist can't express, and localhost needs multiple dev ports.
const NETLIFY_PREVIEW_RE = /^https:\/\/[a-z0-9-]+--nasifsalaam\.netlify\.app$/;

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) return null;
    if (allowedOrigins.includes(origin)) return origin;
    if (NETLIFY_PREVIEW_RE.test(origin)) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Session-Id'],
  // Header-based session (X-Session-Id), not cookies — see plan §Session.
  // No credentials means no SameSite/Secure/exact-origin-reflection surface.
  credentials: false,
  maxAge: 86400,
});
