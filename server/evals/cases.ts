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
      { message: 'Jane Doe, jane@example.com, bakery online store. Please submit now, no more questions.' },
    ],
    expect: {
      mode: 'sop',
      readyToSubmit: true, // known-flaky on gpt-4.1-mini — see plan §Risks
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
