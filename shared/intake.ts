import { z } from 'zod';

export const PROJECT_TYPES = ['website', 'brand_identity', 'product_ux_design', 'app_development', 'other'] as const;
export const BUDGET_BRACKETS_ZAR = ['under_15k', '15k_35k', '35k_75k', '75k_150k', '150k_plus', 'not_sure'] as const;
export const TIMELINE_OPTIONS = ['asap', '1_3_months', '3_6_months', '6_plus_months', 'flexible'] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type BudgetBracket = (typeof BUDGET_BRACKETS_ZAR)[number];
export type TimelineOption = (typeof TIMELINE_OPTIONS)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  website: 'Website',
  brand_identity: 'Brand Identity',
  product_ux_design: 'Product / UX Design',
  app_development: 'App Development',
  other: 'Other',
};

export const BUDGET_LABELS: Record<BudgetBracket, string> = {
  under_15k: 'Under R15,000',
  '15k_35k': 'R15,000 – R35,000',
  '35k_75k': 'R35,000 – R75,000',
  '75k_150k': 'R75,000 – R150,000',
  '150k_plus': 'R150,000+',
  not_sure: 'Not sure yet',
};

export const TIMELINE_LABELS: Record<TimelineOption, string> = {
  asap: 'As soon as possible',
  '1_3_months': '1–3 months',
  '3_6_months': '3–6 months',
  '6_plus_months': '6+ months',
  flexible: 'Flexible',
};

const FIELD_MAX = 2000;
const str = (max: number = FIELD_MAX) => z.string().max(max).optional();

export const QuoteFieldsSchema = z
  .object({
    name: str(120),
    email: str(200),
    phone: str(50),
    company: str(160),
    project_type: str(60), // free text from the LLM; resolved against PROJECT_TYPES server-side
    goals: str(),
    budget_range: str(60), // free text from the LLM; resolved against BUDGET_BRACKETS_ZAR server-side
    timeline: str(60), // free text from the LLM; resolved against TIMELINE_OPTIONS server-side
    notes: str(),
    referral_source: str(160),
  })
  .partial();

export const ContentFieldsSchema = z
  .object({
    name: str(120),
    email: str(200),
    project_name: str(160),
    headline: str(300),
    intro_text: str(),
    about_story: str(4000),
    team_bios: str(4000),
    services: str(4000),
    pricing_info: str(),
    testimonials: str(),
    business_info: str(1000),
    social_links: str(1000),
    seo_keywords: str(500),
    additional_pages: str(1000),
    anything_else: str(),
  })
  .partial();

export type QuoteFields = z.infer<typeof QuoteFieldsSchema>;
export type ContentFields = z.infer<typeof ContentFieldsSchema>;

// Flat union of every quote + content field, all optional. Used as the
// save_intake_fields tool's param schema instead of z.union([Quote, Content])
// — a union compiles to an anyOf of two large nested object schemas, which
// is a much harder shape for a cheap tool-calling model to reliably fill
// than one flat object. The two field sets barely overlap (just name/email),
// so a flat schema costs nothing: the tool's execute() still only persists
// whichever subset applies to the active flow.
export const AnyIntakeFieldsSchema = QuoteFieldsSchema.merge(ContentFieldsSchema);
export type AnyIntakeFields = z.infer<typeof AnyIntakeFieldsSchema>;

export const QUOTE_FIELD_ORDER: (keyof QuoteFields)[] = [
  'name',
  'email',
  'phone',
  'company',
  'project_type',
  'goals',
  'budget_range',
  'timeline',
  'notes',
  'referral_source',
];

export const QUOTE_FIELD_LABELS: Record<keyof QuoteFields, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  project_type: 'Project type',
  goals: 'Goals',
  budget_range: 'Budget',
  timeline: 'Timeline',
  notes: 'Notes',
  referral_source: 'How they heard about us',
};

export const CONTENT_FIELD_ORDER: (keyof ContentFields)[] = [
  'name',
  'email',
  'project_name',
  'headline',
  'intro_text',
  'about_story',
  'team_bios',
  'services',
  'pricing_info',
  'testimonials',
  'business_info',
  'social_links',
  'seo_keywords',
  'additional_pages',
  'anything_else',
];

export const CONTENT_FIELD_LABELS: Record<keyof ContentFields, string> = {
  name: 'Name',
  email: 'Email',
  project_name: 'Project name',
  headline: 'Homepage headline',
  intro_text: 'Homepage intro',
  about_story: 'About / company story',
  team_bios: 'Team bios',
  services: 'Services / products',
  pricing_info: 'Pricing info',
  testimonials: 'Testimonials',
  business_info: 'Business address / hours / phone',
  social_links: 'Social media links',
  seo_keywords: 'Target SEO keywords',
  additional_pages: 'Additional pages needed',
  anything_else: 'Anything else',
};

// Submission bar: contact info alone (name + email) isn't enough to be a
// useful lead — this also requires knowing WHAT the project is (project
// type / project name) and at least one piece of real context about it
// (goals, budget, or timeline for a quote; any actual content for a
// content submission). Every OTHER field stays fully optional — this is
// the one gate, checked identically wherever readiness is computed
// (propose_submission tool, the direct-field-edit PATCH route, and the
// client's own optimistic update) so they can never disagree.
function hasAny(fields: Record<string, string | undefined>, keys: string[]): boolean {
  return keys.some((k) => Boolean(fields[k]?.trim()));
}

export function isReadyToSubmit(flow: 'quote' | 'content' | null | undefined, fields: Record<string, string | undefined>): boolean {
  if (!fields.name?.trim() || !fields.email?.trim()) return false;
  if (flow === 'content') {
    return hasAny(fields, ['project_name']) && hasAny(fields, ['intro_text', 'about_story', 'services', 'headline']);
  }
  // Default to the quote bar (covers flow === 'quote' and flow === undefined,
  // matching QUOTE as the fallback flow used elsewhere).
  return hasAny(fields, ['project_type']) && hasAny(fields, ['goals', 'budget_range', 'timeline']);
}

/** Human-readable reason the submit bar isn't met yet, for UI copy / tool feedback. */
export function submitReadinessReason(flow: 'quote' | 'content' | null | undefined, fields: Record<string, string | undefined>): string | null {
  if (isReadyToSubmit(flow, fields)) return null;
  if (!fields.name?.trim() || !fields.email?.trim()) return 'name and email are required first';
  if (flow === 'content') {
    if (!hasAny(fields, ['project_name'])) return 'project name is needed first';
    return 'at least some actual content (intro, story, services, or headline) is needed first';
  }
  if (!hasAny(fields, ['project_type'])) return 'project type is needed first';
  return 'at least one of goals, budget, or timeline is needed first';
}

/**
 * Overlays only non-empty trimmed string values from `incoming` onto `prev`.
 * This is what makes the server-side merged object authoritative over the
 * LLM's own turn-to-turn memory: a turn that omits a field (or the model
 * simply forgetting it was already captured) can never erase prior state.
 */
export function mergeFields<T extends Record<string, unknown>>(prev: T, incoming: Partial<T> | undefined | null): T {
  const merged: T = { ...prev };
  if (!incoming) return merged;
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v === 'string' && v.trim().length > 0) {
      (merged as Record<string, unknown>)[k] = v.trim();
    }
  }
  return merged;
}

/**
 * Splits incoming field values into what's safe to merge vs. what's locked
 * because the user already edited it directly (see the conversations table's
 * manualEditFields column). Cheap tool-calling models routinely re-send a
 * field's last-known value out of habit, even when the user didn't just
 * restate it — without this, that silently clobbers a deliberate correction
 * the model was never told about.
 */
export function partitionLockedFields<T extends Record<string, unknown>>(
  incoming: Partial<T>,
  lockedKeys: readonly string[]
): { applied: Partial<T>; skipped: string[] } {
  const applied: Partial<T> = {};
  const skipped: string[] = [];
  for (const [k, v] of Object.entries(incoming)) {
    if (lockedKeys.includes(k)) skipped.push(k);
    else (applied as Record<string, unknown>)[k] = v;
  }
  return { applied, skipped };
}
