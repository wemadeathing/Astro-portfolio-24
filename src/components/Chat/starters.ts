// The two sets of entry-screen prompts. Kept together because they are a
// pair by design: one set opens the intake, the other opens a conversation,
// and changing one without looking at the other is how the entry screen ends
// up lopsided (see the ASK_STARTERS note below).

/**
 * Project-intake entry points. `chipId` is what makes the router
 * deterministic — it routes straight to SOP mode and pre-seeds project_type,
 * skipping free-text intent classification for the common case. Ids must
 * match CHIP_SEEDS in server/src/agent/router.ts.
 */
export const STARTER_CHIPS: { label: string; chipId: string; prompt: string }[] = [
  { label: 'Website', chipId: 'website', prompt: "I'm looking to get a website built." },
  { label: 'Brand Identity', chipId: 'brand_identity', prompt: 'I need help with my brand identity.' },
  { label: 'Product / UX Design', chipId: 'product_ux_design', prompt: 'I have a product or UX design project.' },
  { label: 'App Development', chipId: 'app_development', prompt: 'I want to build an app.' },
  { label: 'Not sure yet', chipId: 'not_sure', prompt: "I'm not sure what I need yet — can you help me figure it out?" },
];

// The "ask" half of the entry had no clickable affordance at all — the
// headline invited a question and then left a blank box to compose it in,
// while the only chips on screen jumped straight into project intake. These
// send as ordinary messages (no chipId), so the router classifies them
// normally. Ordered by how people actually behave on a portfolio: the first
// one returns project cards, which is scannable in a few seconds and asks
// nothing of a visitor who isn't ready to type yet.
export const ASK_STARTERS: { label: string; prompt: string }[] = [
  { label: 'Show me your best work', prompt: 'Show me your best work.' },
  { label: 'Worked in fintech?', prompt: 'Have you worked with fintech or financial services clients?' },
  { label: 'Available for work?', prompt: 'Are you available for work right now?' },
];
