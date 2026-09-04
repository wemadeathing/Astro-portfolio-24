// SOP-mode-only tools. Critically: NO tool here sends an email. This module
// only ever flips ready_to_submit — the actual send is a separate HTTP
// route (routes/intake.ts) triggered by a human clicking Submit, with
// fields read from the DB row, not the request body. See plan
// §Architecture ("No tool sends email").
import { z } from 'zod';
import type { ToolDef } from '../agent/types';
import { sanitizeFields } from '../safety/sanitize';
import {
  AnyIntakeFieldsSchema,
  mergeFields,
  partitionLockedFields,
  isReadyToSubmit,
  submitReadinessReason,
  QUOTE_FIELD_ORDER,
  QUOTE_FIELD_LABELS,
  CONTENT_FIELD_ORDER,
  CONTENT_FIELD_LABELS,
  type QuoteFields,
  type ContentFields,
} from '../../../shared/intake';

export const getIntakeState: ToolDef = {
  name: 'get_intake_state',
  description: 'Get the fields already captured for this project intake, and which fields are still missing. Call this before asking a question to avoid re-asking something already answered.',
  params: z.object({}),
  progressLabel: () => 'Checking what has been captured so far…',
  execute: async (_args, ctx) => {
    const flow = ctx.state.flow;
    if (!flow) {
      return { forModel: { flow: null, fields: {}, missing: [] } };
    }
    const fields = flow === 'quote' ? ctx.state.quoteFields : ctx.state.contentFields;
    const order = flow === 'quote' ? QUOTE_FIELD_ORDER : CONTENT_FIELD_ORDER;
    const labels = flow === 'quote' ? QUOTE_FIELD_LABELS : CONTENT_FIELD_LABELS;
    const missing = order.filter((k) => !fields[k as keyof typeof fields]).map((k) => labels[k as keyof typeof labels]);
    return { forModel: { flow, fields, missing } };
  },
};

export const setFlow: ToolDef = {
  name: 'set_flow',
  description: "Set which kind of intake this is: 'quote' for a new project someone wants built, 'content' for someone submitting website copy/content for an already-approved project. Call this once, early, as soon as it's clear which applies.",
  params: z.object({ flow: z.enum(['quote', 'content']) }),
  progressLabel: () => 'Setting up the intake…',
  execute: async ({ flow }, ctx) => {
    ctx.state.flow = flow;
    return { forModel: { ok: true, flow }, stateChanged: true };
  },
};

export const saveIntakeFields: ToolDef = {
  name: 'save_intake_fields',
  description: "Save field values the user just stated or corrected THIS turn. Only include what was just said — you don't need to repeat earlier fields, previously saved values are preserved automatically. Never invent a value the user didn't provide.",
  params: z.object({
    fields: AnyIntakeFieldsSchema,
  }),
  progressLabel: () => 'Saving details…',
  execute: async ({ fields }, ctx) => {
    const sanitized = sanitizeFields(fields);
    const { applied, skipped } = partitionLockedFields(sanitized, ctx.state.manualEditFields ?? []);
    if (ctx.state.flow === 'content') {
      ctx.state.contentFields = mergeFields(ctx.state.contentFields, applied as Partial<ContentFields>);
    } else {
      ctx.state.quoteFields = mergeFields(ctx.state.quoteFields, applied as Partial<QuoteFields>);
    }
    return {
      forModel: {
        ok: true,
        saved: Object.keys(applied),
        ...(skipped.length > 0
          ? { skipped, skippedReason: 'These were already edited directly by the user in the summary card and are locked — if they need to change, tell the user to edit them there.' }
          : {}),
      },
      stateChanged: true,
    };
  },
};

export const proposeSubmission: ToolDef = {
  name: 'propose_submission',
  description: "Call this once enough has been captured to let the user review and submit — name, email, what the project is (project type / project name), AND at least one of goals/budget/timeline (or, for content submissions, some actual content). This does NOT send anything — it only shows a Submit button. Never claim to the user that anything has been sent.",
  params: z.object({ summary: z.string().max(500) }),
  progressLabel: () => 'Preparing to submit…',
  execute: async (_args, ctx) => {
    const fields = ctx.state.flow === 'content' ? ctx.state.contentFields : ctx.state.quoteFields;
    const ready = isReadyToSubmit(ctx.state.flow, fields);
    ctx.state.readyToSubmit = ready;
    return { forModel: { ready, reason: submitReadinessReason(ctx.state.flow, fields) }, stateChanged: true };
  },
};
