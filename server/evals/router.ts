// Router-only eval: asserts which MODE a cold first message routes to.
//
// Separate from evals/run.ts (which drives the full stack over HTTP) because
// routing needs none of it — no server, no DB, no tools, just route() and at
// most one flash-lite call per case. That makes it cheap enough to run on
// every prompt change, which is the point: the LLM-classify tier is the one
// non-deterministic step in the cascade, and it is edited by hand.
//
// This file exists because a prompt change that measurably improved intake
// detection also silently broke "show me your best work" — the single most
// common request a portfolio gets — and nothing caught it. Every case below
// dodges SOP_KEYWORDS on purpose, so they exercise the classifier rather
// than the free regex tier above it.
//
// Usage: npm run evals:router
import { route } from '../src/agent/router';

interface RouterCase {
  message: string;
  expect: 'sop' | 'hiring';
}

export const ROUTER_CASES: RouterCase[] = [
  // Wants Nasif to take on new work — phrased to dodge the keyword regex.
  { message: 'My company needs some design work done for our online presence.', expect: 'sop' },
  { message: "We're thinking about revamping our online presence — is that something you take on?", expect: 'sop' },
  { message: 'Do you take on freelance projects these days?', expect: 'sop' },
  { message: 'Are you open to commissions right now?', expect: 'sop' },
  { message: "I'd love to collaborate on something with you.", expect: 'sop' },
  { message: 'I want to talk about a possible project idea I have.', expect: 'sop' },
  { message: "So what's next if I want to move forward with something?", expect: 'sop' },
  { message: 'My startup is exploring options for getting online.', expect: 'sop' },

  // Wants to SEE existing work. These read as commercial intent to a naive
  // classifier ("work", "project", "best") but are pure browsing, and they
  // are what the entry-screen "Try asking" chips send — a misroute here
  // drops a visitor into an intake interrogation instead of project cards.
  { message: 'Show me your best work.', expect: 'hiring' },
  { message: 'Show me your work', expect: 'hiring' },
  { message: 'Can I see some examples?', expect: 'hiring' },
  { message: 'What have you worked on?', expect: 'hiring' },
  { message: "What's your best project?", expect: 'hiring' },
  { message: 'Do you have any case studies?', expect: 'hiring' },
  { message: 'Show me your portfolio', expect: 'hiring' },

  // Evaluating him — process, background, availability, recruiters.
  { message: 'Tell me about your design process.', expect: 'hiring' },
  { message: "What's your process on a typical project?", expect: 'hiring' },
  { message: 'What tools do you usually use?', expect: 'hiring' },
  { message: 'Have you worked with fintech or financial services clients?', expect: 'hiring' },
  { message: 'I saw your Kota project, really impressive work.', expect: 'hiring' },
  { message: 'Are you available for work right now?', expect: 'hiring' },
  { message: 'Are you looking for a full-time role right now?', expect: 'hiring' },
  { message: "I'm a recruiter reaching out about an opportunity.", expect: 'hiring' },

  // Too little to go on — must fall to the lower-stakes mode, never intake.
  { message: 'Just exploring for now, not sure what I need yet.', expect: 'hiring' },
  { message: 'Hey', expect: 'hiring' },
  { message: 'job', expect: 'hiring' },
];

// The classifier is not deterministic despite temperature: 0 — the same case
// was observed passing and failing across back-to-back runs with identical
// code. So each case is sampled RUNS times and judged on the majority: a
// single unlucky sample can't fail the suite (an eval that cries wolf gets
// ignored), while a case that genuinely flips is surfaced as UNSTABLE rather
// than quietly averaged away — a coin-flip case is a real weak spot, just a
// different one from a consistent misroute.
const RUNS = 3;

async function main() {
  let passed = 0;
  const failures: string[] = [];
  const unstable: string[] = [];

  for (const c of ROUTER_CASES) {
    const modes: string[] = [];
    for (let i = 0; i < RUNS; i++) {
      const decision = await route(c.message, undefined, undefined);
      modes.push(decision.mode);
    }
    const hits = modes.filter((m) => m === c.expect).length;
    const ok = hits > RUNS / 2;
    const flipped = hits !== 0 && hits !== RUNS;

    if (ok) passed++;
    else failures.push(`  expected ${c.expect}, got ${modes.join('/')} :: "${c.message}"`);
    if (flipped) unstable.push(`  ${hits}/${RUNS} correct :: "${c.message}"`);

    process.stdout.write(`${ok ? '✓' : '✗'}${flipped ? '~' : ' '} ${`${hits}/${RUNS}`.padEnd(5)} ${c.expect.padEnd(7)} "${c.message}"\n`);
  }

  console.log(`\n${passed}/${ROUTER_CASES.length} passed (majority of ${RUNS} samples each)`);
  if (unstable.length > 0) {
    console.log(`\nUnstable — classified both ways across samples:`);
    unstable.forEach((u) => console.log(u));
  }
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(f));
    process.exitCode = 1;
  }
}

main();
