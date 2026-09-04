import type { ModeDef } from './types';
import { HIRING_PROMPT } from './prompts/hiring';
import { SOP_PROMPT } from './prompts/sop';
import { searchKnowledge, searchProjects } from '../tools/knowledge';
import { searchResources, searchBlog, showProjects, showResources, showBlog, suggestLinks } from '../tools/portfolio';
import { getIntakeState, setFlow, saveIntakeFields, proposeSubmission } from '../tools/intake';
import { setMode } from '../tools/mode';

// See plan §Models: cheap "flash-lite"-tier reasoning-disabled models are
// fine for search/display tool selection (hiring); the SOP mode's "converse,
// don't interrogate" requirement is an instruction-following problem, so it
// gets the strongest cheap-tier model. deepseek-v4-flash-0731 is
// deliberately excluded from both — see plan §Models for the measured
// 2.9-14s latency variance that makes it unsuitable for a multi-step loop.
export const modes: Record<'hiring' | 'sop', ModeDef> = {
  hiring: {
    id: 'hiring',
    systemPrompt: () => HIRING_PROMPT,
    tools: [searchKnowledge, searchProjects, searchResources, searchBlog, showProjects, showResources, showBlog, suggestLinks, setMode],
    model: { primary: 'google/gemini-2.5-flash', fallback: 'google/gemini-2.5-flash-lite' },
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
    model: { primary: 'openai/gpt-4.1-mini', fallback: 'google/gemini-2.5-flash' },
    // 3, not 2: a single turn can legitimately need more than one tool call
    // (e.g. save_intake_fields THEN propose_submission) before the
    // guaranteed-prose final round — 2 was observed live to strand the
    // model after only its first tool call, unable to reach
    // propose_submission in the same turn.
    maxIterations: 3,
    uiCapabilities: ['intake', 'booking', 'followUps'],
  },
};
