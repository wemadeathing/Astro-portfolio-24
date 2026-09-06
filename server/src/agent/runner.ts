// The agent loop. See plan §Agent loop for the four reliability details that
// matter here specifically because the models are cheap: invalid tool args
// fed back (not thrown), toolChoice:'none' forcing prose on the last
// iteration, truncated tool results, and non-streaming tool-calling
// iterations (we need the complete tool-call block) followed by REAL token
// streaming on the guaranteed-prose final iteration.
import type OpenAI from 'openai';
import { openrouter, modelTuning } from '../llm/client';
import { sanitizeModelText, containsForbiddenOutput, containsToolCallMarkup } from '../safety/outputPolicy';
import type { ModeDef, ToolContext, UiPayload } from './types';
import { toOpenAiTools, zodHint } from './toolSchema';

export type RunnerEvent =
  // Emitted around every model call so the UI can account for the silence.
  // These models all reason before answering — measured time-to-first-token
  // is 2.8s on glm and 5.9s on gemini-3.7-flash — and without this the chat
  // just sits blank through it. Carries no reasoning TEXT on purpose: raw
  // chain-of-thought routinely restates the system prompt and tool names,
  // which this assistant is explicitly forbidden from revealing.
  | { type: 'thinking'; active: boolean }
  | { type: 'tool_start'; id: string; name: string; label: string }
  | { type: 'tool_end'; id: string; ok: boolean }
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; ui: UiPayload; promptTokens: number; completionTokens: number; model: string; toolCalls: ToolCallRecord[] };

export interface ToolCallRecord {
  id: string;
  name: string;
  args: unknown;
  result?: unknown;
  ok: boolean;
  latencyMs: number;
}

const TOOL_TIMEOUT_MS = 8_000;
const TOOL_RESULT_MAX_CHARS = 6_000;
// Denylist scrub needs full text to catch multi-word patterns split across
// stream chunks; hold back this many trailing chars from each flush as a
// lookbehind buffer, only emitting what's safely behind it. See plan
// §Agent loop ("Denylist interaction, resolved").
const STREAM_LOOKBEHIND_CHARS = 120;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Tool execution timed out')), ms)),
  ]);
}

/** Drops any UI slot a mode isn't allowed to fill — the structural fix for card leakage. */
function mergeUi(target: UiPayload, incoming: Partial<UiPayload>, allowed: ReadonlyArray<keyof UiPayload>) {
  for (const key of Object.keys(incoming) as (keyof UiPayload)[]) {
    if (!allowed.includes(key)) continue;
    const value = incoming[key];
    if (Array.isArray(value)) {
      const existing = (target[key] as unknown[]) ?? [];
      (target as Record<string, unknown>)[key] = [...existing, ...value].slice(0, 8);
    } else if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

/**
 * Streams a guaranteed-prose completion (tool_choice already forced to
 * 'none' by the caller) with real token-by-token output, running the output
 * denylist over a sliding lookbehind so multi-word patterns split across
 * chunks are still caught. On a denylist hit mid-stream, stops emitting
 * further deltas and falls back to buffered mode for the remainder — the
 * client already replaces content wholesale on the `done` event, so the
 * correction is invisible; residual risk is a sub-frame flash of
 * unscrubbed text, accepted per plan §Agent loop.
 */
async function* streamProse(
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  signal: AbortSignal,
  tuning: Record<string, unknown>
): AsyncGenerator<
  | { type: 'thinking'; active: boolean }
  | { type: 'delta'; text: string }
  | { type: 'final'; text: string; promptTokens: number; completionTokens: number }
> {
  yield { type: 'thinking', active: true };
  const stream = await openrouter.chat.completions.create(
    { model, messages, temperature: 0.4, ...tuning, stream: true, stream_options: { include_usage: true } } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
    { signal }
  );

  let full = '';
  let held = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let denylistTripped = false;

  let sawContent = false;

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content ?? '';
    if (delta && !sawContent) {
      // First real answer token — the model has stopped thinking and
      // started writing, whatever the reveal queue does with it downstream.
      sawContent = true;
      yield { type: 'thinking', active: false };
    }
    if (chunk.usage) {
      promptTokens = chunk.usage.prompt_tokens ?? promptTokens;
      completionTokens = chunk.usage.completion_tokens ?? completionTokens;
    }
    if (!delta) continue;
    full += delta;

    if (denylistTripped) continue; // already fell back to buffered-only mode

    held += delta;
    if (held.length <= STREAM_LOOKBEHIND_CHARS) continue;

    const safeToFlush = held.slice(0, held.length - STREAM_LOOKBEHIND_CHARS);
    if (containsForbiddenOutput(safeToFlush) || containsToolCallMarkup(full)) {
      denylistTripped = true;
      held = '';
      continue;
    }
    yield { type: 'delta', text: safeToFlush };
    held = held.slice(safeToFlush.length);
  }

  const finalText =
    sanitizeModelText(full).trim() || "Could you share a bit more detail on what you're looking for?";

  if (!denylistTripped && held && !containsForbiddenOutput(held) && !containsToolCallMarkup(held)) {
    yield { type: 'delta', text: held };
  }
  // If anything was scrubbed (denylist tripped, or the trailing `held`
  // segment itself matched), the caller's `done` event carries `finalText`
  // as the canonical replacement — see runner event contract below.
  yield { type: 'final', text: finalText, promptTokens, completionTokens };
}

export async function* runAgent(
  mode: ModeDef,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  ctx: ToolContext
): AsyncGenerator<RunnerEvent> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    // Stable prefix first (system + tools implied by the `tools` param) for
    // prompt-caching friendliness — see plan §Agent loop.
    { role: 'system', content: mode.systemPrompt(ctx) },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const openAiTools = toOpenAiTools(mode.tools);
  const toolCallRecords: ToolCallRecord[] = [];
  // One-shot: a mode's toollessReplyNudge fires at most once per turn, so a
  // model that simply refuses to call a tool still gets its prose through
  // rather than burning every iteration on retries.
  let nudged = false;
  let ui: UiPayload = {};
  let lastModel = mode.model.primary;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  // Guaranteed prose (tool_choice forced off), streamed for real, with a
  // model fallback on error. Used both for the last permitted iteration AND
  // — see the `!toolCalls && !content` branch below — whenever a non-final
  // completion comes back with neither a tool call nor any text: that's a
  // dead end (observed live with gemini-2.5-flash after two consecutive
  // tool-only rounds with null content), not a real "the model is done"
  // signal, so it gets one guaranteed shot at prose instead of falling back
  // to a canned "share more detail" reply while a perfectly good tool
  // result already sits in the transcript.
  async function* forcedProse(
    model: string
  ): AsyncGenerator<{ type: 'delta'; text: string } | { type: 'thinking'; active: boolean }, { finalText: string; model: string }> {
    let finalText = '';
    let usedModel = model;
    try {
      for await (const ev of streamProse(model, messages, ctx.signal, modelTuning(mode.model, model))) {
        if (ev.type === 'delta') {
          yield { type: 'delta', text: ev.text };
        } else if (ev.type === 'thinking') {
          yield ev;
        } else {
          finalText = ev.text;
          totalPromptTokens += ev.promptTokens;
          totalCompletionTokens += ev.completionTokens;
        }
      }
    } catch (err) {
      if (model !== mode.model.fallback && mode.model.fallback) {
        usedModel = mode.model.fallback;
        for await (const ev of streamProse(mode.model.fallback, messages, ctx.signal, modelTuning(mode.model, mode.model.fallback))) {
          if (ev.type === 'delta') yield { type: 'delta', text: ev.text };
          else if (ev.type === 'thinking') yield ev;
          else {
            finalText = ev.text;
            totalPromptTokens += ev.promptTokens;
            totalCompletionTokens += ev.completionTokens;
          }
        }
      } else {
        throw err;
      }
    }
    return { finalText, model: usedModel };
  }

  for (let i = 0; i < mode.maxIterations; i++) {
    const isLastIteration = i === mode.maxIterations - 1;
    const model = i === 0 ? mode.model.primary : lastModel;

    if (isLastIteration) {
      const result = yield* forcedProse(model);
      lastModel = result.model;
      yield {
        type: 'done',
        text: result.finalText,
        ui,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        model: lastModel,
        toolCalls: toolCallRecords,
      };
      return;
    }

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    yield { type: 'thinking', active: true };
    try {
      completion = await openrouter.chat.completions.create(
        { model, messages, tools: openAiTools, tool_choice: 'auto', temperature: 0.4, ...modelTuning(mode.model, model) } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
        { signal: ctx.signal }
      );
      lastModel = model;
    } catch (err) {
      if (model !== mode.model.fallback && mode.model.fallback) {
        lastModel = mode.model.fallback;
        i -= 1; // retry this same iteration index with the fallback model
        continue;
      }
      throw err;
    }

    yield { type: 'thinking', active: false };

    totalPromptTokens += completion.usage?.prompt_tokens ?? 0;
    totalCompletionTokens += completion.usage?.completion_tokens ?? 0;

    const choice = completion.choices[0];
    const toolCalls = choice?.message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      const volunteered = choice?.message?.content?.trim();

      if (!volunteered) {
        // No tool calls AND no text — a dead end, not real completion (see
        // forcedProse's doc comment above). Give it one guaranteed-prose
        // shot instead of surfacing a canned reply while a real tool result
        // already sits in the transcript.
        const result = yield* forcedProse(model);
        lastModel = result.model;
        yield {
          type: 'done',
          text: result.finalText,
          ui,
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          model: lastModel,
          toolCalls: toolCallRecords,
        };
        return;
      }

      // Model volunteered prose before the forced-final iteration — but in
      // some modes that IS the failure. SOP mode observed live answering
      // "I'd have a design system project. Are you available?" with a
      // deflection to the contact page and zero tool calls: no set_flow, no
      // save_intake_fields, the whole lead dropped on the floor while the
      // reply read as helpful. Nothing downstream can recover that, because
      // the loop below accepts the first prose it is handed. So the mode
      // gets one chance to reject it and retry with a pointed reminder.
      const nudge = !nudged ? (mode.progressNudge?.(ctx, toolCallRecords.map((r) => r.name)) ?? null) : null;
      if (nudge) {
        nudged = true;
        // The rejected prose is deliberately NOT pushed into `messages` —
        // we want the model to answer afresh, not to defend the reply we
        // just discarded. No iteration is consumed either (`i -= 1`): no
        // tool ran, so nothing was accomplished that should cost a round.
        messages.push({ role: 'system', content: nudge });
        i -= 1;
        continue;
      }

      // We already have the complete (non-streamed) text at this point, so
      // "streaming" it is chunking — same perceived-latency benefit as the
      // old fake typewriter, just over genuinely tool-informed output.
      const text = sanitizeModelText(volunteered);
      const chunkSize = 24;
      for (let j = 0; j < text.length; j += chunkSize) {
        yield { type: 'delta', text: text.slice(j, j + chunkSize) };
      }
      yield {
        type: 'done',
        text,
        ui,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        model: lastModel,
        toolCalls: toolCallRecords,
      };
      return;
    }

    // Some models (observed with gemini-2.5-flash) return content AND
    // tool_calls in the same message — a full prose answer alongside e.g. a
    // suggest_links call. Captured here so it can be surfaced as the actual
    // answer once the tool calls below finish, instead of being silently
    // dropped into history: previously only choice.message.content was ever
    // read when toolCalls was EMPTY, so this text was pushed into `messages`
    // for the model's own future reference but never shown to the user —
    // the model then considered itself already answered and returned empty
    // content with no tool calls on the next iteration.
    const contentAlongsideToolCalls = choice.message.content?.trim();

    messages.push(choice.message);

    for (const call of toolCalls) {
      // We only ever declare `type: 'function'` tools (toOpenAiTools above),
      // so a custom tool call should never occur — this guard just narrows
      // the SDK's union type for TypeScript.
      if (call.type !== 'function') continue;
      const tool = mode.tools.find((t) => t.name === call.function.name);
      const callId = call.id;

      if (!tool) {
        messages.push({
          role: 'tool',
          tool_call_id: callId,
          content: `Unknown tool "${call.function.name}". Available: ${mode.tools.map((t) => t.name).join(', ')}`,
        });
        continue;
      }

      let parsedArgs: unknown;
      try {
        parsedArgs = JSON.parse(call.function.arguments || '{}');
      } catch {
        messages.push({ role: 'tool', tool_call_id: callId, content: 'Arguments were not valid JSON. Retry with a valid JSON object.' });
        continue;
      }

      const validated = tool.params.safeParse(parsedArgs);
      if (!validated.success) {
        messages.push({ role: 'tool', tool_call_id: callId, content: `Invalid arguments: ${zodHint(validated.error)}` });
        continue;
      }

      const label = tool.progressLabel(validated.data);
      yield { type: 'tool_start', id: callId, name: tool.name, label };

      const startedAt = Date.now();
      let ok = true;
      let resultForModel: unknown;
      try {
        const result = await withTimeout(tool.execute(validated.data, ctx), TOOL_TIMEOUT_MS);
        resultForModel = result.forModel;
        if (result.ui) mergeUi(ui, result.ui, mode.uiCapabilities);
      } catch (err) {
        ok = false;
        resultForModel = { error: err instanceof Error ? err.message : 'Tool execution failed' };
      }

      yield { type: 'tool_end', id: callId, ok };
      toolCallRecords.push({
        id: callId,
        name: tool.name,
        args: validated.data,
        result: resultForModel,
        ok,
        latencyMs: Date.now() - startedAt,
      });

      let content = JSON.stringify(resultForModel);
      if (content.length > TOOL_RESULT_MAX_CHARS) content = content.slice(0, TOOL_RESULT_MAX_CHARS) + '…(truncated)';
      messages.push({ role: 'tool', tool_call_id: callId, content });
    }

    // Second nudge point. Tools ran, but a mode can still be no closer to
    // the state change it exists to make — SOP mode was observed answering
    // "I'd have a design system project" by calling search_knowledge and a
    // no-op set_mode('sop'), never set_flow or save_intake_fields, so the
    // toolless branch above never saw it and the lead was lost anyway.
    // Unlike that branch this DOES consume an iteration, because real tool
    // work happened and its results are now in the transcript.
    const postToolNudge = !nudged ? (mode.progressNudge?.(ctx, toolCallRecords.map((r) => r.name)) ?? null) : null;
    if (postToolNudge) {
      nudged = true;
      messages.push({ role: 'system', content: postToolNudge });
      continue;
    }

    if (contentAlongsideToolCalls) {
      const text = sanitizeModelText(contentAlongsideToolCalls);
      const chunkSize = 24;
      for (let j = 0; j < text.length; j += chunkSize) {
        yield { type: 'delta', text: text.slice(j, j + chunkSize) };
      }
      yield {
        type: 'done',
        text,
        ui,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        model: lastModel,
        toolCalls: toolCallRecords,
      };
      return;
    }
  }
}
