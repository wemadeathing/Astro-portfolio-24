// Shared read tools, available in both modes — this is what lets the SOP
// mode answer "has he done fintech before?" mid-intake without derailing
// the flow (no handoff needed, since both modes share the same loop). See
// plan §Architecture ("Tool scoping is the key nuance").
import { z } from 'zod';
import type { ToolDef } from '../agent/types';

export const searchKnowledge: ToolDef = {
  name: 'search_knowledge',
  description:
    "Search Nasif's background: experience, process, methodologies (agile, design thinking), rates, availability, tooling, certifications. Use for any question about who he is or how he works.",
  // k defaults to 6, not 4: knowledge chunks are small (<1200 chars) and the
  // corpus is flat enough that the right chunk regularly lands 4th or 5th —
  // two extra chunks is a rounding error on cost and the difference between
  // naming a client and hedging about one.
  params: z.object({
    query: z.string().min(2).max(200),
    k: z.number().int().min(1).max(8).default(6),
  }),
  progressLabel: (a) => `Looking up "${a.query}"…`,
  execute: async ({ query, k }, ctx) => {
    const hits = await ctx.retrieval.search(query, { kinds: ['knowledge', 'about'], k });
    return {
      forModel: hits.map((h) => ({ section: h.heading, content: h.content, score: Number(h.score.toFixed(3)) })),
    };
  },
};

export const searchProjects: ToolDef = {
  name: 'search_projects',
  description: 'Search past projects/case studies by topic, industry, or skill. Returns summaries only — call show_projects with the returned slugs to actually display cards.',
  params: z.object({
    query: z.string().min(2).max(200),
    k: z.number().int().min(1).max(8).default(6),
  }),
  progressLabel: (a) => `Searching projects for "${a.query}"…`,
  execute: async ({ query, k }, ctx) => {
    const hits = await ctx.retrieval.search(query, { kinds: ['project'], k });
    return {
      forModel: hits.map((h) => ({ slug: h.refId, summary: h.content, score: Number(h.score.toFixed(3)) })),
    };
  },
};
