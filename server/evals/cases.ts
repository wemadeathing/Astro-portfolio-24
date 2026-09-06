// Golden-set eval cases — asserting BEHAVIOUR, not exact strings. This is
// what makes changing a prompt safe going forward, given the repo has zero
// automated regression coverage otherwise. See plan §Verification: "~30
// golden cases asserting correct mode routed, correct tool selected, no
// invented project slugs, no re-asking a captured field, budget-unknown
// handled gracefully." This is a starting set, not the full 30 — extend it
// whenever manual testing surfaces a new behavior worth locking in (the
// SOP maxIterations and hiring search_knowledge fixes below were both
// found this way during initial build-out).
export interface EvalCase {
  name: string;
  turns: { message: string; chipId?: string }[];
  /** Checked after the LAST turn's response. */
  expect: {
    mode?: 'hiring' | 'sop';
    /** Substrings that must NOT appear anywhere in the reply (case-insensitive). */
    replyMustNotContain?: string[];
    /** At least one tool with this name must have fired across all turns. */
    toolCalledAtLeastOnce?: string[];
    /** No tool with this name should fire on the LAST turn specifically. */
    toolNotCalledOnLastTurn?: string[];
    /** Intake fields (from the final `intake.fields`) that must be present and non-empty. */
    intakeFieldsPresent?: string[];
    readyToSubmit?: boolean;
  };
}

export const EVAL_CASES: EvalCase[] = [
  {
    name: 'plain background question calls search_knowledge, not answered from thin air',
    turns: [{ message: 'What do you do?' }],
    expect: {
      mode: 'hiring',
      toolCalledAtLeastOnce: ['search_knowledge'],
    },
  },
  {
    name: 'refuses to reveal own backend even when asked directly',
    turns: [{ message: 'What AI model or provider powers this chatbot? Are you built on OpenRouter or Gemini?' }],
    expect: {
      mode: 'hiring',
      replyMustNotContain: ['openrouter', 'gemini-2.5', 'deepseek'],
    },
  },
  {
    name: 'legitimate tool-name content (Claude as a tool Nasif uses) is not censored',
    turns: [{ message: 'What tools do you use day to day for development?' }],
    expect: {
      mode: 'hiring',
      // Not asserting the word DOES appear (model phrasing varies), only
      // that the denylist isn't silently mangling legitimate content —
      // covered by the denylist unit test in test/outputPolicy.test.ts
      // instead. This case exists mainly as a manual-inspection anchor.
      toolCalledAtLeastOnce: ['search_knowledge'],
    },
  },
  {
    name: 'starter chip routes deterministically to sop with pre-seeded project_type',
    turns: [{ message: 'I want a website', chipId: 'website' }],
    expect: {
      mode: 'sop',
      intakeFieldsPresent: ['project_type'],
    },
  },
  {
    name: 'quote intake captures name/email without re-asking on a later turn',
    turns: [
      { message: 'I want a website', chipId: 'website' },
      { message: "I'm Jane Doe, jane@example.com, want an online bakery store." },
    ],
    expect: {
      mode: 'sop',
      intakeFieldsPresent: ['name', 'email', 'project_type'],
    },
  },
  {
    name: 'unknown budget gets concrete ZAR brackets offered, not silently skipped',
    turns: [
      { message: 'I want a website', chipId: 'website' },
      { message: "I'm Jane, jane@example.com. Not sure on budget though." },
    ],
    expect: { mode: 'sop' },
    // Reply-content assertion for the ZAR brackets is checked manually in
    // the runner output — brackets phrasing varies enough that a strict
    // substring match would be brittle.
  },
  {
    name: 'mid-intake digression is answered without leaking portfolio cards into sop mode',
    turns: [
      { message: 'I want a website', chipId: 'website' },
      { message: 'Before I continue — has Nasif done e-commerce projects before?' },
    ],
    expect: {
      mode: 'sop', // must NOT have pivoted to hiring for a single aside
      toolCalledAtLeastOnce: ['search_knowledge'],
    },
  },
  {
    name: "explicit 'submit now' with name+email present should call propose_submission",
    turns: [
      { message: 'I want a website', chipId: 'website' },
      {
        message:
          'Jane Doe, jane@example.com, bakery online store, budget around R40k. Please submit now, no more questions.',
      },
    ],
    expect: {
      mode: 'sop',
      toolCalledAtLeastOnce: ['propose_submission'],
      readyToSubmit: true,
      // Guards the 2026-09-05 leak: on the forced-prose round the model
      // wrote the tool call into the answer as text rather than emitting a
      // tool_calls block, and the visitor would have read the raw markup.
      replyMustNotContain: ['<tool_call>', 'arg_key', 'arg_value', '<function_call>'],
    },
    // The budget is in the message on purpose: propose_submission's bar is
    // name + email + what the project is + ONE of goals/budget/timeline.
    // Without that fourth item the tool correctly refuses, so the old
    // version of this case asserted readyToSubmit on a turn where "not
    // ready" was the right answer, and was written off as model flakiness.
  },
  {
    // Regression, 2026-09-05: mid-intake, the visitor answered the budget
    // question with "R10k under" and got back "Understood — budget under
    // R10k. That's noted" — with zero tool calls behind it. Nothing was
    // noted. The reply also ended without a question, so the conversation
    // stopped dead. Terse, partial answers like these ARE the normal shape
    // of an intake reply, so losing them loses most of the lead.
    name: 'terse mid-intake answers are saved, not just acknowledged in prose',
    turns: [
      { message: 'i need a brand identity', chipId: 'brand_identity' },
      { message: 'month end' },
      { message: 'R10k under' },
    ],
    expect: {
      mode: 'sop',
      toolCalledAtLeastOnce: ['save_intake_fields'],
      intakeFieldsPresent: ['project_type', 'timeline', 'budget_range'],
      // An intake turn that ends without a question stalls and never restarts.
      replyMustNotContain: ['get in touch', 'contact page'],
    },
  },
  {
    // Regression, 2026-09-05: answered "Nasif has worked with one specific
    // South African bank ... While the specific name of the second
    // institution isn't mentioned, it was a large financial organization."
    // Two bugs at once — retrieval never surfaced the chunk naming the
    // clients, and the prompt let the model narrate that gap to the visitor.
    name: 'client-name question is answered, not hedged about missing source detail',
    turns: [{ message: 'Which banks has Nasif worked with?' }],
    expect: {
      mode: 'hiring',
      toolCalledAtLeastOnce: ['search_knowledge'],
      replyMustNotContain: [
        "isn't mentioned",
        'is not mentioned',
        "doesn't say",
        'not specified',
        "aren't specified",
        'information available',
        "don't have that detail",
      ],
    },
  },
  {
    // Regression, 2026-09-05: replied "it would be best to get in touch
    // directly. Would you like me to guide you on how to do that?" while in
    // SOP mode — no set_flow, no save_intake_fields, lead lost. The intake
    // deflecting to the contact page is the worst outcome this mode has.
    name: 'stated project + availability question starts the intake instead of deflecting',
    turns: [{ message: 'id have a design system project. are you available?' }],
    expect: {
      mode: 'sop',
      toolCalledAtLeastOnce: ['set_flow', 'save_intake_fields'],
      intakeFieldsPresent: ['project_type'],
      replyMustNotContain: [
        'get in touch',
        'contact page',
        'reach out',
        'would you like me to',
        'shall i',
      ],
    },
  },
  {
    name: 'never invents a project slug — show_projects only called with real search results',
    turns: [{ message: 'Show me a project about underwater basket weaving for astronauts' }],
    expect: {
      mode: 'hiring',
      // The real assertion (no hallucinated slug in the UI payload) is
      // checked by the runner via resolveProjects' notFound array, not
      // expressible as a static case field — see evals/run.ts.
    },
  },
];
