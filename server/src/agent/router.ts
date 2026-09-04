// Deterministic-first router. See plan §Router cascade: sticky -> chip ->
// keyword -> LLM classify (fallback only, must never fail a turn).
import { openrouter } from '../llm/client';
import type { Mode } from './types';

export type RouteVia = 'sticky' | 'chip' | 'keyword' | 'llm';

export interface RouteDecision {
  mode: Mode;
  via: RouteVia;
  /** For chip routing: a seed value to pre-populate (e.g. project_type). */
  chipSeed?: { project_type?: string };
}

// Starter chips seed the SOP flow directly and pre-populate project_type —
// this is what makes the deterministic router actually deterministic,
// rather than relying on free-text intent classification even for the
// common case. Chip ids must match STARTER_CHIPS in ChatInterface.tsx.
const CHIP_SEEDS: Record<string, { project_type: string }> = {
  website: { project_type: 'website' },
  brand_identity: { project_type: 'brand_identity' },
  product_ux_design: { project_type: 'product_ux_design' },
  app_development: { project_type: 'app_development' },
  not_sure: { project_type: '' },
};

const SOP_KEYWORDS =
  /\b(quote|price|pricing|cost|how much|budget|hire|hire you|hire him|build me a|start a project|work with (you|him)|get started|need (a |an |some )?(website|app|logo|brand( identity)?|design help|redesign)|(need|want|looking for) help (with|on)|i'?m looking to (get|have|build)|can you (build|design|make)|(want|need) (to|a) (build|create|make|design)|i have a .{0,25}(project|idea)\b)\b/i;

async function llmClassify(message: string): Promise<Mode> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      const res = await openrouter.chat.completions.create(
        {
          model: 'google/gemini-2.5-flash-lite',
          temperature: 0,
          max_tokens: 4,
          messages: [
            {
              role: 'system',
              // Edit this with evals/router.ts open — `npm run evals:router`.
              // Two failure directions pull against each other here, and
              // fixing one has already broken the other: too narrow ("want a
              // quote, want to hire") sends real enquiries to the portfolio
              // side, while loosening it to read intent sent "show me your
              // best work" into project intake. The explicit SEE/BROWSE
              // carve-out below is load-bearing for that second case.
              content:
                'Classify the user\'s message as exactly one word: "sop" or "hiring".\n' +
                'Say "sop" only if they want Nasif to take on NEW work for them: starting a project, freelance or commission work, a quote, revamping/redesigning/overhauling something of theirs, exploring getting something built, or submitting content for an already-approved project. Read for intent, not just literal words like "quote" or "hire".\n' +
                'Say "hiring" for everything else. That includes any request to SEE or BROWSE existing work — "show me your work", "show me your best work", "can I see examples", "any case studies?" — and questions about his process, background, skills, past clients, or availability for a full-time role.\n' +
                'Reply with only that one word.',
            },
            { role: 'user', content: message.slice(0, 500) },
          ],
        },
        { signal: controller.signal }
      );
      const text = res.choices[0]?.message?.content?.trim().toLowerCase() ?? '';
      return text.includes('sop') ? 'sop' : 'hiring';
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Must never fail a turn — default to the lower-stakes mode.
    return 'hiring';
  }
}

const EXPLICIT_SWITCH_RE = /show me (your )?(work|portfolio|projects)|never ?mind|different question|actually,? (tell|show)|forget (that|the quote)/i;

export async function route(
  message: string,
  chipId: string | undefined,
  stickyMode: Mode | undefined
): Promise<RouteDecision> {
  // 1. Sticky — dominant path after turn 1, unless the user explicitly bails.
  if (stickyMode && !EXPLICIT_SWITCH_RE.test(message)) {
    return { mode: stickyMode, via: 'sticky' };
  }

  // 2. Deterministic UI — the starter chips, PRIMARY router.
  if (chipId && CHIP_SEEDS[chipId]) {
    return { mode: 'sop', via: 'chip', chipSeed: CHIP_SEEDS[chipId] };
  }

  // 3. Free keyword regex — ~0ms, catches the obvious.
  if (SOP_KEYWORDS.test(message)) {
    return { mode: 'sop', via: 'keyword' };
  }

  // 4. LLM classification — fallback only.
  const mode = await llmClassify(message);
  return { mode, via: 'llm' };
}
