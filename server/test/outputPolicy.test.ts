import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containsForbiddenOutput, scrubForbiddenOutput , stripToolCallMarkup , sanitizeModelText , containsToolCallMarkup } from '../src/safety/outputPolicy.ts';

test('detects and scrubs the actual backend provider/model', () => {
  const text = 'This chat is powered by OpenRouter using Gemini 2.5 Flash Lite.';
  assert.ok(containsForbiddenOutput(text));
  const scrubbed = scrubForbiddenOutput(text);
  assert.ok(!/openrouter/i.test(scrubbed));
  assert.ok(!/gemini/i.test(scrubbed));
});

test('does NOT flag legitimate mentions of AI tools Nasif uses (regression guard)', () => {
  // This is the exact bug found during live testing: "Claude" was
  // previously in the denylist, which incorrectly censored true content
  // about Nasif's own tool stack (he genuinely uses Claude Code).
  const text = 'For development assistance, I use Claude AI. I also sometimes reference ChatGPT.';
  assert.ok(!containsForbiddenOutput(text), 'legitimate AI tool names must not trip the denylist');
});

test('detects internal implementation leaks (jaccard, system prompt, tool-calling)', () => {
  assert.ok(containsForbiddenOutput('My retrieval uses jaccard similarity scoring.'));
  assert.ok(containsForbiddenOutput('Let me check my system prompt for that.'));
  assert.ok(containsForbiddenOutput('I just made a tool call to search projects.'));
});

test('leaves clean text untouched', () => {
  const text = "I'm a product designer with 15+ years of experience.";
  assert.equal(scrubForbiddenOutput(text), text);
});

test('strips leaked tool-call markup from user-visible text', async (t) => {
  await t.test('removes the exact glm-5.3-flash leak observed live', () => {
    const leaked =
      '<tool_call>propose_submission<arg_key>summary</arg_key><arg_value>Website quote request — Jane Doe</arg_value></tool_call>';
    // A complete block is machine syntax, not an answer — it is removed
    // whole, arguments included. Surfacing the arg_value would leak an
    // internal payload to the visitor. Empty is correct here; the runner
    // substitutes its own fallback sentence.
    assert.equal(stripToolCallMarkup(leaked), '');
    assert.ok(!sanitizeModelText(leaked).includes('tool_call'));
    assert.ok(!sanitizeModelText(leaked).includes('arg_key'));
    assert.ok(!sanitizeModelText(leaked).includes('Jane Doe'));
  });

  await t.test('drops everything after an unterminated opener (truncated stream)', () => {
    assert.equal(stripToolCallMarkup('Here you go. <tool_call>propose_submission<arg_key>sum'), 'Here you go.');
  });

  await t.test('keeps ordinary prose untouched', () => {
    const prose = 'Nasif has worked with ABSA, Old Mutual, and Standard Bank.';
    assert.equal(stripToolCallMarkup(prose), prose);
    assert.equal(sanitizeModelText(prose), prose);
  });

  await t.test('detects markup so the stream can stop emitting it', () => {
    assert.ok(containsToolCallMarkup('<tool_call>propose_submission'));
    assert.ok(containsToolCallMarkup('x<arg_key>y</arg_key>'));
    assert.ok(!containsToolCallMarkup('We can call it a design system project.'));
  });

  await t.test('strips before the denylist, so a leak cannot become "<lookup>"', () => {
    assert.ok(!sanitizeModelText('<tool_call>search_knowledge</tool_call>').includes('lookup'));
  });
});
