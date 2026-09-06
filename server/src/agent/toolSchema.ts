// Converts this project's zod tool params into the loose JSON Schema the
// OpenAI-shaped tool-calling API expects, plus the error formatter used to
// hand a model its own validation failures.
//
// Split out of runner.ts (479 lines) because none of it touches the agent
// loop: it is a pure, synchronous transform that was only hard to test
// because of where it lived. Everything here is now exercised directly by
// test/toolSchema.test.ts.
import type OpenAI from 'openai';
import type { ToolDef } from './types';

// Returns the FUNCTION-tool variant specifically, not the wider
// ChatCompletionTool union (which also covers custom tools). We only ever
// emit `type: 'function'`, and saying so means callers get `.function`
// without narrowing — the union previously forced a cast at every use.
export function toOpenAiTools(tools: ToolDef[]): OpenAI.Chat.Completions.ChatCompletionFunctionTool[] {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      // A hand-rolled minimal JSON Schema is sufficient here — the
      // description IS the real prompt for a cheap model, and invalid args
      // are recovered via the zod-error-feedback loop below regardless of
      // how precise this declared schema is.
      parameters: zodToLooseJsonSchema(t.params),
    },
  }));
}

function zodToLooseJsonSchema(schema: unknown): Record<string, unknown> {
  const def = (schema as { _def?: Record<string, unknown> })?._def;
  const typeName = def?.typeName as string | undefined;

  switch (typeName) {
    case 'ZodObject': {
      const shape = (def!.shape as () => Record<string, unknown>)();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToLooseJsonSchema(value);
        const inner = (value as { _def?: Record<string, unknown> })._def;
        if (inner?.typeName !== 'ZodOptional' && inner?.typeName !== 'ZodDefault') required.push(key);
      }
      return { type: 'object', properties, required, additionalProperties: false };
    }
    case 'ZodString':
      return { type: 'string' };
    case 'ZodNumber':
      return { type: 'number' };
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodArray':
      return { type: 'array', items: zodToLooseJsonSchema(def!.type) };
    case 'ZodEnum':
      return { type: 'string', enum: def!.values };
    case 'ZodOptional':
    case 'ZodDefault':
      return zodToLooseJsonSchema(def!.innerType);
    case 'ZodUnion':
      return { anyOf: (def!.options as unknown[]).map(zodToLooseJsonSchema) };
    case 'ZodRecord':
      return { type: 'object', additionalProperties: { type: 'string' } };
    default:
      return {};
  }
}

export function zodHint(error: unknown): string {
  const issues = (error as { issues?: { path: (string | number)[]; message: string }[] })?.issues ?? [];
  return issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') || 'Invalid arguments.';
}
