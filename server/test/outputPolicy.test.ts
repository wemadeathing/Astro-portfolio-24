import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containsForbiddenOutput, scrubForbiddenOutput } from '../src/safety/outputPolicy.ts';

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
