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
      if (event === 'tool_start' && parsed.name) toolsCalled.push(String(parsed.name));
      if (event === 'final') finalPayload = parsed;
    }
  }

  // Intake state comes from the SERVER, not from the `intake` UI payload.
  // The payload is only populated once propose_submission has fired (see
  // routes/chat.ts — one deliberate summary, not a live accumulator), so
  // asserting on it silently made every "was this field captured?" case
  // untestable until the very last turn of a conversation. What we
  // actually want to know is whether save_intake_fields persisted it.
  let intake: TurnResult['intake'];
  try {
    const stateRes = await fetch(`${BASE_URL}/session/${sessionId}/conversation`, {
      headers: { 'X-Session-Id': sessionId },
    });
    if (stateRes.ok) {
      const { conversation } = (await stateRes.json()) as {
        conversation: { flow?: string; quoteFields?: Record<string, string>; contentFields?: Record<string, string>; readyToSubmit?: boolean } | null;
      };
      if (conversation) {
        intake = {
          fields: (conversation.flow === 'content' ? conversation.contentFields : conversation.quoteFields) ?? {},
          readyToSubmit: Boolean(conversation.readyToSubmit),
        };
      }
    }
  } catch {
    // Leave `intake` undefined — the assertion will report it as missing.
  }

  return {
    reply: String(finalPayload.reply ?? ''),
    mode: String(finalPayload.mode ?? ''),
    intake,
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
    // Exact tool identity, off the `name` field the server now puts on every
    // tool_start event. This previously matched the human-readable progress
    // LABEL against the first word of the tool name — which meant
    // `search_knowledge` was checked as "does any label contain 'search'",
    // and its label is `Looking up "…"`. The assertion could therefore
    // never pass on its own merits; it only ever went green by accident
    // when the model also happened to call search_projects ("Searching
    // projects for…"). Three cases were failing for that reason alone.
    if (e.toolCalledAtLeastOnce) {
      for (const t of e.toolCalledAtLeastOnce) {
        if (!allToolsCalled.includes(t)) {
          problems.push(`expected tool "${t}" to be called (called: ${allToolsCalled.join(', ') || 'none'})`);
        }
      }
    }
    if (e.toolNotCalledOnLastTurn) {
      for (const t of e.toolNotCalledOnLastTurn) {
        if (last!.toolsCalled.includes(t)) problems.push(`tool "${t}" should not have been called on the last turn`);
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
