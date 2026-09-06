import type { ModeDef } from './types';
import { HIRING_PROMPT } from './prompts/hiring';
import { SOP_PROMPT } from './prompts/sop';
import { searchKnowledge, searchProjects } from '../tools/knowledge';
import { searchResources, searchBlog, showProjects, showResources, showBlog, suggestLinks } from '../tools/portfolio';
import { getIntakeState, setFlow, saveIntakeFields, proposeSubmission } from '../tools/intake';
import { setMode } from '../tools/mode';

// Models. The original split (gemini-2.5-flash for hiring, gpt-4.1-mini for
// SOP's harder instruction-following) was picked when this ran as a Netlify
// function, where the whole turn had to fit inside a function invocation
// timeout. That constraint is gone: the loop now runs as a long-lived Hono
// process on Railway, bounded by our own TURN_BUDGET_MS (25s).
//
// Measured 2026-09-05. A turn makes TWO kinds of call and they rank
// DIFFERENTLY — benchmarking only the first is how you pick the wrong model:
//
//   (a) tool-selection: non-streaming, full tool schema, ~20-80 output tokens
//   (b) prose generation: streaming, real ~2.7k-token system prompt, 160-350
//       output tokens. This is the slow one and every turn ends with it.
//
//                                  (a) p50 / max      (b) p50 / max      $/call(a)
//   glm-5.3-flash (Together)        859ms /  1343ms   5735ms / 16917ms   $0.000211
//   deepseek-v4-flash-0731          867ms /  5020ms   8822ms / 43012ms   $0.000191
//   deepseek-v4-flash              2701ms /  2922ms  20466ms / 30377ms   $0.000243
//   gemini-3.7-flash               2708ms /  3424ms   6930ms /  7282ms   $0.001895
//
// glm is primary: best p50 on both. The fallback is gemini-3.7-flash, not the
// cheaper deepseek: it is the only candidate measured that never exceeded
// ~7.3s on EITHER call type, whereas deepseek-v4-flash-0731's generation tail
// hit 43s on one of five — which alone exceeds the whole 25s turn budget, on
// the code path that only runs when something has already gone wrong. It
// costs ~9x per call, but a fallback fires rarely enough that predictability
// is worth far more than unit price here. Cheapness is the primary's job; the
// fallback's job is to not fail.
//
// --- Re-measured 2026-09-06. Both models kept; two things around them moved.
//
// 1. The pin moved from Together to Z.AI. Together now hard-429s EVERY
//    request on this account — 4/4 with SDK retries off, in 424-748ms. With
//    the SDK's default two retries each of those became 5-8s of backoff
//    before surfacing, inside a 25s budget, on a loop that makes up to four
//    calls. It also spent a third of live turns failing outright, and it is
//    what exposed the retry-loop DoS since fixed in runner.ts. Re-measured
//    tool-selection p50: Z.AI 5017ms, unpinned 4816ms (routing Z.AI /
//    SiliconFlow), Together unavailable. Z.AI over unpinned keeps the
//    original intent — one deterministic provider, allow_fallbacks off, so a
//    dead provider yields a fast clean error rather than silent re-routing.
//    The 859ms Together figure above is historical; nothing serves that now.
//
// 2. gemini-3.7-flash cannot be trusted to produce prose on the forced-final
//    round: 7 of 8 samples returned ZERO text, emitting a tool_calls block
//    with no tools in the request (finish_reason 'tool_calls', 28 completion
//    tokens). streamProse omits the `tools` param entirely and the API will
//    not accept tool_choice:'none' without it, so omission is the only lever
//    and Gemini ignores it. That is handled in runner.ts rather than by
//    swapping the model — forcedProse now retries an empty round on the other
//    model before falling through to the canned reply. Worth knowing if the
//    fallback ever becomes the primary, where it would fire every turn.
//
// Stale exclusion lifted: deepseek-v4-flash-0731 was previously ruled out of
// both modes for "measured 2.9-14s latency variance" (plan §Models). It is
// now the fastest tool-selector in the set; the old figure no longer holds,
// so this is deliberate, not oversight.
const AGENT_MODEL = {
  primary: 'z-ai/glm-5.3-flash',
  primaryProvider: 'Z.AI',
  fallback: 'google/gemini-3.7-flash',
  reasoningEffort: 'minimal',
  maxTokens: 2048,
} as const;

export const modes: Record<'hiring' | 'sop', ModeDef> = {
  hiring: {
    id: 'hiring',
    systemPrompt: () => HIRING_PROMPT,
    tools: [searchKnowledge, searchProjects, searchResources, searchBlog, showProjects, showResources, showBlog, suggestLinks, setMode],
    model: { ...AGENT_MODEL },
    // 4, not 3: proactive suggest_links (see hiring.ts) means a turn can now
    // spend two full iterations on tool calls alone (search_knowledge, then
    // suggest_links, both with no content) before ever answering — observed
    // live to strand the model on a forced-final round with nothing queued
    // to say, producing an empty/fallback reply instead of the real answer.
    maxIterations: 4,
    uiCapabilities: ['projects', 'resources', 'blogs', 'chips', 'followUps'],
  },
  sop: {
    id: 'sop',
    systemPrompt: (ctx) => {
      const flow = ctx.state.flow;
      const fields = flow === 'content' ? ctx.state.contentFields : ctx.state.quoteFields;
      const collected = flow && Object.keys(fields).length > 0 ? JSON.stringify(fields).slice(0, 1000) : null;
      return collected
        ? `${SOP_PROMPT}\n\nAlready collected this conversation (flow: ${flow}) — do not re-ask for these:\n${collected}`
        : SOP_PROMPT;
    },
    tools: [searchKnowledge, getIntakeState, setFlow, saveIntakeFields, proposeSubmission, setMode],
    model: { ...AGENT_MODEL },
    // 4, not 3 (and originally not 2): a single turn can legitimately need
    // several tool calls — save_intake_fields, THEN propose_submission —
    // before the guaranteed-prose final round, and progressNudge can now
    // consume one of them. Stranding the model has a nastier failure mode
    // than costing an extra call: on the forced-prose round it cannot emit
    // a real tool_calls block, so it writes the call into the answer as
    // text instead ("<tool_call>propose_submission<arg_key>…", observed
    // live 2026-09-05). outputPolicy strips that now, but the tool still
    // never runs, so the fix is to leave enough room to actually call it.
    maxIterations: 4,
    uiCapabilities: ['intake', 'booking', 'followUps'],
    // Two failure modes, both observed live, both silent — the reply reads
    // as helpful while the lead quietly degrades.
    //
    // 1. No flow set: the model conversed instead of starting the intake
    //    ("would you like me to guide you on how to get in touch?").
    // 2. Flow set, but a turn carrying a real detail ends with no save. Seen
    //    2026-09-05: visitor answered the budget question with "R10k under"
    //    and the reply was "Understood — budget under R10k. That's noted" —
    //    with zero tool calls behind it. Nothing was noted. It also ended
    //    without a question, so the conversation simply stopped there.
    //
    // The second check deliberately offers an out ("if there is genuinely
    // nothing to save, say so"), because this fires on any intake turn that
    // did not write, including legitimate ones — a nudge that forces a save
    // would just trade lost details for invented ones.
    progressNudge: (ctx, called) => {
      if (!ctx.state.flow) {
        return (
          'You have not called set_flow yet, so no intake has started and nothing this visitor said has been saved anywhere. ' +
          "Before this turn ends: call set_flow ('quote' unless they are clearly submitting content for an already-approved project), " +
          'AND call save_intake_fields with every project detail they have mentioned so far. ' +
          'Anything a tool result told you about how to get started — booking a call, using the contact page, emailing — is stale and does not apply here: ' +
          'this chat IS the first step, and you are running it. ' +
          'Then reply with one or two short questions for the next missing details. Do not ask permission, and do not send them anywhere else.'
        );
      }
      if (ctx.state.readyToSubmit) return null;
      if (called.includes('save_intake_fields') || called.includes('propose_submission')) return null;
      return (
        'This turn is about to end without calling save_intake_fields, so anything the visitor just told you is about to be lost — ' +
        'acknowledging a detail in your reply ("noted", "understood", "got it") does NOT store it. ' +
        'Re-read their last message. If it contains ANY project detail — a budget, a timeline, a name, an email, a goal, a project type, ' +
        'a constraint, however casually phrased or however partial ("R10k under", "month end", "just me for now") — call save_intake_fields with it NOW. ' +
        'If it genuinely contains nothing to save, that is fine: skip the tool and just reply. ' +
        'Either way your reply must end with a question asking for the next missing detail — this is an intake, and a turn that ends without one stops the conversation dead.'
      );
    },
  },
};
