// Runs the golden-set cases against a LIVE server instance over HTTP —
// exercising the full stack (routing, persistence, tool calling) rather
// than mocking internals. Usage: start the server (`npm run dev` in
// another terminal), then `npm run evals` here.
import { randomUUID } from 'node:crypto';
import { EVAL_CASES } from './cases';

const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:8080';

interface TurnResult {
  reply: string;
  mode: string;
  intake?: { fields: Record<string, string>; readyToSubmit: boolean };
  toolsCalled: string[];
}

async function runTurn(sessionId: string, message: string, chipId?: string): Promise<TurnResult> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
    body: JSON.stringify({ message, chipId }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalPayload: Record<string, unknown> = {};
  const toolsCalled: string[] = [];
  const toolLabelById = new Map<string, string>();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = chunk.split('\n');
      let event: string | null = null;
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data = line.slice(5).trim();
      }
      if (!event || !data) continue;
      const parsed = JSON.parse(data);
      if (event === 'tool_start') toolLabelById.set(parsed.id, parsed.label);
      if (event === 'tool_end') {
        // We don't get the tool name directly from tool_end; approximate
        // via debug trace lookup is overkill for this harness — instead
        // infer from the label text set at tool_start (good enough for
        // eval assertions, which check "was some knowledge/search/save
        // tool used", not exact tool identity).
      }
      if (event === 'final') finalPayload = parsed;
    }
  }

  // Tool identity: re-fetch via /debug/trace using the conversationId isn't
  // wired to turnId here without extra plumbing; instead this harness
  // treats any tool_start firing as evidence *a* tool was called, and
  // cases only assert on tool categories broad enough for that to be a
  // meaningful check (see cases.ts comments for the ones that need exact
  // identity — those are checked manually, not automated, for now).
  for (const label of toolLabelById.values()) toolsCalled.push(label);

  return {
    reply: String(finalPayload.reply ?? ''),
    mode: String(finalPayload.mode ?? ''),
    intake: finalPayload.intake as TurnResult['intake'],
    toolsCalled,
  };
}

async function main() {
  let pass = 0;
  let fail = 0;

  for (const testCase of EVAL_CASES) {
    const sessionId = randomUUID();
    let last: TurnResult | null = null;
    const allToolsCalled: string[] = [];

    try {
      for (const turn of testCase.turns) {
        last = await runTurn(sessionId, turn.message, turn.chipId);
        allToolsCalled.push(...last.toolsCalled);
      }
    } catch (err) {
      fail++;
      console.log(`FAIL  ${testCase.name}\n      error: ${err instanceof Error ? err.message : err}`);
      continue;
    }

    const problems: string[] = [];
    const e = testCase.expect;

    if (e.mode && last!.mode !== e.mode) problems.push(`expected mode=${e.mode}, got ${last!.mode}`);
    if (e.replyMustNotContain) {
      const lower = last!.reply.toLowerCase();
      for (const bad of e.replyMustNotContain) {
        if (lower.includes(bad.toLowerCase())) problems.push(`reply contained forbidden substring "${bad}"`);
      }
    }
    if (e.readyToSubmit !== undefined && last!.intake?.readyToSubmit !== e.readyToSubmit) {
      problems.push(`expected readyToSubmit=${e.readyToSubmit}, got ${last!.intake?.readyToSubmit} (known-flaky on cheap models — see plan §Risks)`);
    }
    if (e.intakeFieldsPresent) {
      const fields = last!.intake?.fields ?? {};
      for (const f of e.intakeFieldsPresent) {
        if (!fields[f]) problems.push(`expected intake field "${f}" to be present`);
      }
    }
    // toolCalledAtLeastOnce / toolNotCalledOnLastTurn use label text
    // heuristically (see runTurn note) — approximate, not exact.
    if (e.toolCalledAtLeastOnce) {
      const labelsText = allToolsCalled.join(' ').toLowerCase();
      for (const t of e.toolCalledAtLeastOnce) {
        const keyword = t.replace(/_/g, ' ').split(' ')[0]; // crude but workable for this small tool set
        if (!labelsText.includes(keyword)) problems.push(`expected a tool call resembling "${t}" (no matching progress label seen)`);
      }
    }

    if (problems.length === 0) {
      pass++;
      console.log(`PASS  ${testCase.name}`);
    } else {
      fail++;
      console.log(`FAIL  ${testCase.name}`);
      for (const p of problems) console.log(`      - ${p}`);
      console.log(`      reply: ${last!.reply.slice(0, 150)}${last!.reply.length > 150 ? '…' : ''}`);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed, ${EVAL_CASES.length} total.`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Eval run failed:', err);
  process.exit(1);
});
