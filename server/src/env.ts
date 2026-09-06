// Central env var access + validation. Fails fast on boot if anything
// required is missing, rather than surfacing as a confusing runtime error
// on the first request.
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Also used for embeddings (via OpenRouter's /v1/embeddings proxy) — one
  // provider/key for both chat and retrieval, see retrieval/embed.ts.
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  CONTACT_EMAIL: z.string().min(1, 'CONTACT_EMAIL is required'),
  RESEND_FROM_EMAIL: z.string().optional(),
  CALENDLY_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:4321,http://localhost:4322,http://localhost:4323'),
  DEBUG_TOKEN: z.string().optional(),
  DAILY_COST_CAP_USD: z.coerce.number().default(5),
  CONTENT_DIR: z.string().default('../src/content'),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid/missing environment variables:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  // Loud warning rather than a silently ephemeral DB — see plan §Postgres.
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.DATABASE_URL.includes('railway')) {
    console.warn(
      'WARNING: NODE_ENV=production but DATABASE_URL does not look like a Railway-managed ' +
        'Postgres URL. Confirm this is intentional — an unexpected local/ephemeral DB in ' +
        'production silently loses conversations and leads on every restart.'
    );
  }

  // Lead email silently no-ops without this: sendLeadEmail refuses to fall
  // back to Resend's shared test sender, because that sender can only
  // deliver to the account owner's own address and 403s on everything else.
  // Warn at boot rather than at the first real lead.
  if (!parsed.data.RESEND_FROM_EMAIL) {
    console.warn(
      'WARNING: RESEND_FROM_EMAIL is not set. Lead emails WILL FAIL to send — ' +
        'set it to an address on a domain verified at resend.com/domains. ' +
        'Submitted leads are still persisted to the `leads` table with emailStatus="failed".'
    );
  }

  return parsed.data;
}

export const env = loadEnv();

export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
