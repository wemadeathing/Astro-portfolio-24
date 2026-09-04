// Canonical source moved to shared/intake.ts so both the Astro site and the
// (upcoming) standalone backend service can import it without either pulling
// in the other's runtime (astro:content vs node APIs). This file is kept as
// a re-export shim purely so existing imports of '../../lib/intake' and
// '../lib/intake' inside src/ keep working unchanged.
export * from '../../shared/intake';
