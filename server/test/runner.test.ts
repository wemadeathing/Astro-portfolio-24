// Regression tests for the agent loop's model-fallback path. The bug these
// exist for was a process-wide DoS, not a bad reply: a failed FIRST
// tool-selection call put the loop into an unkillable retry spin (no throw,
// no yield) that pinned the event loop at 99% CPU and took /health down
// with it — one visitor closing a tab was enough.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// runner -> llm/client -> env, which process.exit(1)s on missing vars.
// These are never used: every model call in this file is stubbed.
process.env.DATABASE_URL ||= 'postgres://test/test';
process.env.OPENROUTER_API_KEY ||= 'test-key';
process.env.RESEND_API_KEY ||= 'test-key';
process.env.CONTACT_EMAIL ||= 'test@example.com';

const { runAgent } = await import('../src/agent/runner.ts');
const { openrouter } = await import('../src/llm/client.ts');
import type { ModeDef, ToolContext } from '../src/agent/types.ts';

const PRIMARY = 'test/primary';
const FALLBACK = 'test/fallback';

function mode(): ModeDef {
  return {
    id: 'hiring',
    systemPrompt: () => 'system',
    tools: [],
    model: { primary: PRIMARY, fallback: FALLBACK },
    maxIterations: 4,
    uiCapabilities: [],
  };
}

function ctx(signal: AbortSignal): ToolContext {
  return {
    conversationId: 'c',
    sessionId: 's',
    turnId: 't',
    signal,
    catalog: {} as ToolContext['catalog'],
    retrieval: {} as ToolContext['retrieval'],
    state: {
      id: 'c',
      sessionId: 's',
      quoteFields: {},
      contentFields: {},
      manualEditFields: [],
      readyToSubmit: false,
      messageCount: 0,
    },
    emit: () => {},
  };
}

// The retry spin this file guards against never yields to the macrotask
// queue (it is `await` on an already-rejected promise, so only microtasks
// run), which means node:test's own `timeout` option cannot fire on it — a
// regression would hang the suite forever instead of failing it. So the
// stub itself is the circuit breaker: past CALL_BUDGET it stops feeding the
// loop errors and returns a terminating completion, letting the call-count
// assertions below fail loudly and immediately.
const CALL_BUDGET = 8;

/** Replaces the model call with `impl`, recording the model each call asked for. */
function stubCreate(impl: (model: string, callNo: number) => Promise<unknown>) {
  const completions = openrouter.chat.completions as unknown as Record<string, unknown>;
  const original = completions.create;
  const models: string[] = [];
  completions.create = async (body: { model: string }) => {
    models.push(body.model);
    if (models.length > CALL_BUDGET) {
      return {
        choices: [{ message: { role: 'assistant', content: 'circuit breaker', tool_calls: [] } }],
        usage: { prompt_tokens: 0, completion_tokens: 0 },
      };
    }
    return impl(body.model, models.length);
  };
  return { models, restore: () => { completions.create = original; } };
}

async function drain(gen: AsyncGenerator<unknown>): Promise<unknown[]> {
  const events: unknown[] = [];
  for await (const ev of gen) events.push(ev);
  return events;
}

test('a failing first tool-selection call falls back once and then gives up', { timeout: 5000 }, async () => {
  const stub = stubCreate(async () => {
    throw new Error('provider returned 429');
  });
  try {
    const controller = new AbortController();
    await drain(runAgent(mode(), [], 'hello', ctx(controller.signal))).then(
      () => { throw new Error('the loop must surface the model error, not swallow it'); },
      (err: Error) => assert.match(err.message, /429/)
    );
    // The whole point: primary once, fallback once, stop. Before the fix
    // this array grew without bound because iteration 0 always re-selected
    // the primary, so the "already on the fallback?" rethrow never fired.
    assert.deepEqual(stub.models, [PRIMARY, FALLBACK]);
  } finally {
    stub.restore();
  }
});

test('an aborted turn stops immediately instead of retrying on a dead signal', { timeout: 5000 }, async () => {
  const controller = new AbortController();
  const stub = stubCreate(async () => {
    controller.abort();
    const err = new Error('Request was aborted.');
    err.name = 'APIUserAbortError';
    throw err;
  });
  try {
    await drain(runAgent(mode(), [], 'hello', ctx(controller.signal))).then(
      () => { throw new Error('an aborted turn must surface the abort'); },
      (err: Error) => assert.match(err.message, /aborted/)
    );
    // No fallback attempt: no other model can serve an aborted signal.
    assert.deepEqual(stub.models, [PRIMARY]);
  } finally {
    stub.restore();
  }
});

test('a first call that fails then succeeds on the fallback stays on the fallback', { timeout: 5000 }, async () => {
  const stub = stubCreate(async (model, callNo) => {
    if (callNo === 1) throw new Error('provider returned 429');
    return {
      choices: [{ message: { role: 'assistant', content: `answered by ${model}`, tool_calls: [] } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    };
  });
  try {
    const controller = new AbortController();
    const events = await drain(runAgent(mode(), [], 'hello', ctx(controller.signal)));
    const done = events.find((e) => (e as { type: string }).type === 'done') as { text: string; model: string };
    assert.ok(done, 'turn should complete');
    assert.equal(done.model, FALLBACK);
    assert.match(done.text, /answered by test\/fallback/);
    assert.deepEqual(stub.models, [PRIMARY, FALLBACK]);
  } finally {
    stub.restore();
  }
});

/** An async-iterable stand-in for the SDK's streaming response. */
function proseStream(text: string) {
  return (async function* () {
    for (const piece of text.match(/[\s\S]{1,20}/g) ?? []) {
      yield { choices: [{ delta: { content: piece } }] };
    }
    yield { choices: [{ delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5 } };
  })();
}

/** What a model that answers a forced-prose round with a tool_calls block looks like. */
function emptyStream() {
  return (async function* () {
    yield { choices: [{ delta: { content: '' }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 10, completion_tokens: 28 } };
  })();
}

test('an empty forced-prose round retries on the other model instead of the canned reply', { timeout: 5000 }, async () => {
  // The tool-selection rounds return prose-free dead ends so the loop reaches
  // forcedProse; the primary then produces no text there, as gemini-3.7-flash
  // does on 7 of 8 real samples.
  const completions = openrouter.chat.completions as unknown as Record<string, unknown>;
  const original = completions.create;
  const models: string[] = [];
  completions.create = async (body: { model: string; stream?: boolean }) => {
    models.push(body.model + (body.stream ? ':prose' : ':select'));
    if (!body.stream) {
      return { choices: [{ message: { role: 'assistant', content: '', tool_calls: [] } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
    }
    return body.model === PRIMARY ? emptyStream() : proseStream('Here is the real answer about his design process, at length.');
  };
  try {
    const controller = new AbortController();
    const events = await drain(runAgent(mode(), [], 'hello', ctx(controller.signal)));
    const done = events.find((e) => (e as { type: string }).type === 'done') as { text: string; model: string };
    assert.ok(done, 'turn should complete');
    assert.match(done.text, /the real answer/, 'must surface the fallback prose, not the canned line');
    assert.doesNotMatch(done.text, /share a bit more detail/);
    assert.equal(done.model, FALLBACK);
    assert.ok(models.includes(PRIMARY + ':prose'), 'primary should have been tried first');
    assert.ok(models.includes(FALLBACK + ':prose'), 'fallback should have been retried');
  } finally {
    completions.create = original;
  }
});

test('the canned reply still stands when both models come up empty', { timeout: 5000 }, async () => {
  const completions = openrouter.chat.completions as unknown as Record<string, unknown>;
  const original = completions.create;
  completions.create = async (body: { stream?: boolean }) =>
    body.stream
      ? emptyStream()
      : { choices: [{ message: { role: 'assistant', content: '', tool_calls: [] } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
  try {
    const controller = new AbortController();
    const events = await drain(runAgent(mode(), [], 'hello', ctx(controller.signal)));
    const done = events.find((e) => (e as { type: string }).type === 'done') as { text: string };
    assert.match(done.text, /share a bit more detail/);
  } finally {
    completions.create = original;
  }
});
