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
  /\b(quote|price|pricing|cost|how much|budget|your rates?|day rate|hourly rate|what do you charge|how much do you charge|hire|hire you|hire him|build me a|start a project|work with (you|him)|get started|need (a |an |some )?(website|app|logo|brand( identity)?|design help|redesign)|(need|want|looking for) help (with|on)|i'?m looking to (get|have|build)|can you (build|design|make)|(want|need) (to|a) (build|create|make|design)|i(?:'?d|'?ve)? ?have a .{0,25}(project|idea)\b)\b/i;

async function llmClassify(message: string): Promise<Mode> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      const res = await openrouter.chat.completions.create(
        {
          // Deliberately the OLD flash-lite, and deliberately not any of
          // the models the agent loop runs. This slot is a one-word
          // classifier with max_tokens: 4 and a 1500ms abort, and EVERY
          // current-generation candidate is a reasoning model that spends
          // that entire budget thinking and returns content: null —
          // measured, all of them, on 2026-09-05:
          //
          //   glm-5.3-flash        null (reasoning cannot be disabled at all)
          //   deepseek-v4-flash-0731  null
          //   gemini-3.1-flash-lite   null
          //   gemini-3.7-flash        null
          //   gemini-2.5-flash-lite   "hiring" / "sop"   p50 521ms
          //
          // null reads as "not sop" here, which would silently route EVERY
          // message to hiring. Given a real token budget (512) instead, the
          // reasoning models answer but blow the timeout: gemini-3.7-flash
          // scored 9/9 correct at p50 2663ms / max 13031ms, over 1500ms on
          // 9 of 9 calls — it would abort every time and default to hiring.
          //
          // So this is a latency-budget constraint, not a model-recency one.
          // A one-word classifier has no use for reasoning, the prompt below
          // does the actual work (26/26 on evals/router.ts), and this is the
          // fastest thing measured that can answer at all. Revisit only
          // alongside raising the 1500ms abort.
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
                'Classify the user\'s message as exactly one word: "sop" or "hiring".\n\n' +
                'The question is who would be doing work for whom.\n' +
                '"sop" = the visitor wants to BUY work from Nasif. They have a project, a need, or a company, and they want him to do something for them: starting a project, contract/freelance/commission work, a quote, revamping or overhauling something of theirs, exploring getting something built, or submitting content for an already-approved project.\n' +
                '"hiring" = the visitor is EVALUATING Nasif. Browsing his work, asking about his background, process, skills or past clients, or recruiting him for a job at their company.\n\n' +
                'Two traps:\n' +
                '1. "Available?" splits by what for. Available to take on a project, new clients, or contract work -> sop. Available for a job, role, or position -> hiring. A bare "are you available?" or "available for work right now?" with no project and no role attached is too thin to act on -> hiring, which is the safer default.\n' +
                '2. Words like "work", "project" and "best" appear on both sides, so read the verb, not the noun. "Show me / can I see / do you have any" + work -> hiring. "Do you take on / are you taking / would you consider / we need" + work -> sop, even when the noun is literally "projects".\n\n' +
                'Examples:\n' +
                'sop: "We need some design work done for our site."\n' +
                'sop: "Do you still take on contract work?"\n' +
                'sop: "Are you taking on new clients at the moment?"\n' +
                'sop: "We are looking at overhauling our website."\n' +
                'sop: "Is building something like this something you would consider?"\n' +
                'hiring: "Show me your strongest projects."\n' +
                'hiring: "Can I see what you have built?"\n' +
                'hiring: "Show me a project about healthcare."\n' +
                'hiring: "What is your background in fintech?"\n' +
                'hiring: "How do you normally run a project?"\n' +
                'hiring: "We have an open Senior Designer role, would you be interested?"\n' +
                'hiring: "Not sure what I need yet, just looking around."\n\n' +
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
