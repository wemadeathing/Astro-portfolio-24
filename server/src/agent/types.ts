// Core types for the one-loop, mode-scoped agent design. No agent registry,
// no handoff tools — see plan §Architecture ("One loop, three modes").
import type { z } from 'zod';
import type { ContentCatalog } from '../content/load';
import type { RetrievalIndex } from '../retrieval';
import type { UiPayload, Mode, Flow } from '../db/schema';
export type { RetrievalIndex };
import type { QuoteFields, ContentFields } from '../../../shared/intake';

export type { Mode, Flow, UiPayload };

export interface ConversationState {
  id: string;
  sessionId: string;
  mode?: Mode;
  flow?: Flow;
  quoteFields: QuoteFields;
  contentFields: ContentFields;
  /** Field keys directly edited via the summary card — protected from save_intake_fields overwrite. */
  manualEditFields: string[];
  readyToSubmit: boolean;
  messageCount: number;
}

export interface ToolContext {
  conversationId: string;
  sessionId: string;
  turnId: string;
  signal: AbortSignal;
  catalog: ContentCatalog;
  retrieval: RetrievalIndex;
  state: ConversationState;
  emit: (label: string) => void;
}

export interface ToolResult {
  /** Serialised back into the tool message the model sees next iteration. */
  forModel: unknown;
  /** Merged into this turn's UI payload, subject to the mode's uiCapabilities allowlist. */
  ui?: Partial<UiPayload>;
  /** Side-effecting tools (save_intake_fields etc.) mutate ctx.state directly and set this. */
  stateChanged?: boolean;
}

export interface ToolDef<P extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  /** This IS the prompt for cheap models — be specific about when to call it. */
  description: string;
  params: P;
  progressLabel: (args: z.infer<P>) => string;
  execute: (args: z.infer<P>, ctx: ToolContext) => Promise<ToolResult>;
}

export interface ModeDef {
  id: Mode;
  systemPrompt: (ctx: ToolContext) => string;
  tools: ToolDef[];
  model: import('../llm/client').ModelSpec;
  maxIterations: number;
  uiCapabilities: ReadonlyArray<keyof UiPayload>;
   /**
   * Optional guard against a mode ending a turn without the state change it
   * exists to make. Consulted twice per iteration — once when the model
   * returns prose with no tool calls at all, and once after a round of tool
   * calls has executed — so it catches both "answered instead of acting"
   * and "called the wrong tools and still hasn't acted".
   *
   * Receives the tool names already dispatched this turn, so a mode can ask
   * "did the thing that matters actually happen?" rather than only "were any
   * tools called at all".
   *
   * Returning a string injects it as a system message and retries; it fires
   * at most ONCE per turn, so a model that simply won't comply still gets
   * its reply through rather than burning every iteration. Return null to
   * let the turn proceed (the default when unset).
   */
  progressNudge?: (ctx: ToolContext, toolsCalledThisTurn: string[]) => string | null;
}
