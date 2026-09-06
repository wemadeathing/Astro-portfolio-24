import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { toOpenAiTools, zodHint } from '../src/agent/toolSchema.ts';
import type { ToolDef } from '../src/agent/types.ts';

function tool(params: z.ZodTypeAny): ToolDef {
  return {
    name: 't',
    description: 'd',
    params: params as ToolDef['params'],
    progressLabel: () => 'x',
    execute: async () => ({ forModel: {} }),
  };
}

function schemaFor(params: z.ZodTypeAny): Record<string, unknown> {
  return toOpenAiTools([tool(params)])[0].function.parameters as Record<string, unknown>;
}

test('zod -> JSON Schema conversion for tool params', async (t) => {
  await t.test('marks plain fields required and optional/default ones not', () => {
    const s = schemaFor(
      z.object({
        query: z.string(),
        k: z.number().int().default(4),
        note: z.string().optional(),
      })
    );
    assert.deepEqual(s.required, ['query']);
    assert.equal((s.properties as any).query.type, 'string');
    assert.equal((s.properties as any).k.type, 'number');
    assert.equal((s.properties as any).note.type, 'string');
  });

  await t.test('unwraps optional/default to the inner type, not to {}', () => {
    // Regression guard: if these ever collapse to an empty schema the model
    // loses all type information for the field while still being told the
    // field exists — the failure looks like random bad arguments.
    const s = schemaFor(z.object({ a: z.string().optional(), b: z.number().default(1) }));
    assert.equal((s.properties as any).a.type, 'string');
    assert.equal((s.properties as any).b.type, 'number');
  });

  await t.test('enums carry their values so the model cannot invent one', () => {
    const s = schemaFor(z.object({ mode: z.enum(['hiring', 'sop']) }));
    assert.deepEqual((s.properties as any).mode.enum, ['hiring', 'sop']);
  });

  await t.test('arrays describe their item type', () => {
    const s = schemaFor(z.object({ slugs: z.array(z.string()) }));
    assert.equal((s.properties as any).slugs.type, 'array');
    assert.equal((s.properties as any).slugs.items.type, 'string');
  });

  await t.test('records become open string-valued objects (save_intake_fields shape)', () => {
    const s = schemaFor(z.object({ fields: z.record(z.string()) }));
    assert.equal((s.properties as any).fields.type, 'object');
    assert.deepEqual((s.properties as any).fields.additionalProperties, { type: 'string' });
  });

  await t.test('nested objects recurse rather than flattening', () => {
    const s = schemaFor(z.object({ outer: z.object({ inner: z.boolean() }) }));
    assert.equal((s.properties as any).outer.type, 'object');
    assert.equal((s.properties as any).outer.properties.inner.type, 'boolean');
  });

  await t.test('carries the tool name and description through', () => {
    const [t0] = toOpenAiTools([tool(z.object({ a: z.string() }))]);
    assert.equal(t0.function.name, 't');
    assert.equal(t0.function.description, 'd');
  });
});

test('zodHint turns a validation failure into model-readable feedback', async (t) => {
  await t.test('names the failing path so the model can retry that field', () => {
    const result = z.object({ query: z.string().min(2) }).safeParse({ query: 'x' });
    assert.equal(result.success, false);
    const hint = zodHint((result as { error: unknown }).error);
    assert.match(hint, /query/);
  });

  await t.test('falls back to a usable message when there are no issues', () => {
    assert.equal(zodHint(undefined), 'Invalid arguments.');
    assert.equal(zodHint({}), 'Invalid arguments.');
  });
});
