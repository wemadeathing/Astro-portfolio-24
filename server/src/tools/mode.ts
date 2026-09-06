// Shared, model-callable mode pivot — complements router stickiness (the
// router decides mode on turn 1; the model can pivot mid-conversation if
// the user's intent clearly changes, e.g. "actually forget the quote, tell
// me about your background instead").
import { z } from 'zod';
import type { ToolDef } from '../agent/types';

export const setMode: ToolDef = {
  name: 'set_mode',
  description: "Switch conversation mode. Use 'sop' when the user wants a project quote or is submitting content for an approved project. Use 'hiring' when they want to know about Nasif's background, skills, or work. Only call this if the user's intent has clearly changed from the current mode — don't call it just to answer one aside question.",
  params: z.object({ mode: z.enum(['hiring', 'sop']), reason: z.string().max(200) }),
  progressLabel: (a) => (a.mode === 'sop' ? 'Switching to project intake…' : 'Switching to Q&A…'),
  execute: async ({ mode }, ctx) => {
    // Observed live: the SOP mode calling set_mode('sop') while already in
    // SOP, burning one of only three iterations on a no-op and reading the
    // `ok: true` back as "handled, my work here is done". Say so plainly
    // instead — the model needs to know it has not made any progress.
    if (ctx.state.mode === mode) {
      return {
        forModel: {
          ok: false,
          mode,
          note: `Already in "${mode}" mode — this call changed nothing. Do not call set_mode again this turn; use the tools for this mode instead.`,
        },
      };
    }
    ctx.state.mode = mode;
    return { forModel: { ok: true, mode }, stateChanged: true };
  },
};
