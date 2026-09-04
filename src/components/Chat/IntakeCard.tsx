import React, { useId, useState } from 'react';
import { submitReadinessReason } from '../../lib/intake';

export interface IntakeState {
  intent: 'quote_intake' | 'content_intake';
  flow: 'quote' | 'content';
  fields: Record<string, string>;
  missingFields: string[];
  readyToSubmit: boolean;
  submitted?: boolean;
  submitError?: string;
}

interface IntakeCardProps {
  intake: IntakeState;
  onFieldEdit: (key: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  calendlyUrl?: string;
}

const FLOW_TITLES: Record<IntakeState['flow'], string> = {
  quote: 'Project Quote',
  content: 'Project Content',
};

// Every captured field is a real, always-editable input/textarea — no
// click-to-reveal edit mode. Saves straight via onFieldEdit (the same
// non-LLM PATCH path), on blur or Enter. A single hairline underline
// carries the "this is an input" affordance — no full border box, no
// shadow; consistent with the site's minimal/hairline visual language
// (fewer stacked rectangles read as calmer than one box per field).
function IntakeField({
  label,
  value,
  placeholder,
  type = 'text',
  multiline = false,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  multiline?: boolean;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const id = useId();

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    if (!trimmed) setDraft(value);
  };

  const fieldClassName =
    'mt-1 w-full border-b border-border/60 bg-transparent py-1.5 text-[15px] leading-relaxed text-foreground outline-none transition-colors focus:border-b-2 focus:border-primary';

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commit();
              (e.target as HTMLTextAreaElement).blur();
            }
          }}
          placeholder={placeholder}
          rows={draft.length > 70 ? 3 : draft.length > 30 ? 2 : 1}
          className={`${fieldClassName} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
    </div>
  );
}

// Fields long enough to want more than one line at a glance — everything
// else stays a compact single-line input even if the user's answer runs a
// little long (the input just scrolls internally, matching Name/Email).
const MULTILINE_FIELDS = new Set(['goals', 'notes', 'about_story', 'team_bios', 'services', 'anything_else']);

// The fields that actually gate submission (see shared/intake.ts's
// isReadyToSubmit) beyond name/email — always shown as direct inputs, same
// as Name/Email, even when empty. Without this, once the bar required more
// than contact info, there was no way to satisfy it from the card at all:
// the dynamic list below only ever renders fields that are ALREADY
// captured, so a never-yet-mentioned requirement had nowhere to be filled
// in. Doesn't matter which of goals/budget/timeline the OR-requirement
// ends up satisfied by — Goals is just the most natural single field to
// always offer for it.
const GATING_FIELDS: Record<'quote' | 'content', { key: string; label: string; placeholder: string; multiline: boolean }[]> = {
  quote: [
    { key: 'project_type', label: 'Project type', placeholder: 'e.g. website, app, brand identity', multiline: false },
    { key: 'goals', label: 'Goals', placeholder: 'What are you trying to achieve?', multiline: true },
  ],
  content: [
    { key: 'project_name', label: 'Project name', placeholder: 'e.g. Acme Co. website', multiline: false },
    { key: 'intro_text', label: 'Intro text', placeholder: 'What should the homepage intro say?', multiline: true },
  ],
};

export default function IntakeCard({ intake, onFieldEdit, onSubmit, submitting, calendlyUrl }: IntakeCardProps) {
  const gatingFields = GATING_FIELDS[intake.flow];
  const gatingKeys = new Set(gatingFields.map((f) => f.key));
  const capturedEntries = Object.entries(intake.fields).filter(
    ([k, v]) => k !== 'name' && k !== 'email' && !gatingKeys.has(k) && v && v.trim().length > 0
  );

  if (intake.submitted) {
    return (
      <div className="border border-border/80 p-4">
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-primary">
          {FLOW_TITLES[intake.flow]} — Submitted
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Thanks — this has been sent through. You'll hear back shortly.
        </p>
      </div>
    );
  }

  const nameEmailCaptured = (intake.fields.name ? 1 : 0) + (intake.fields.email ? 1 : 0);
  const gatingCaptured = gatingFields.filter((f) => intake.fields[f.key]?.trim()).length;
  // computeMissingFields (ChatInterface.tsx) excludes already-filled fields,
  // so missingFields only ever lists what's NOT captured — name/email (and
  // now the gating fields) drop out of it once filled, same as they're
  // excluded from capturedEntries above (shown as their own inputs
  // instead). Add them back on both sides so the total stays the fixed
  // field count (10 for quote, 15 for content) regardless of fill state.
  const totalFields = capturedEntries.length + intake.missingFields.length + nameEmailCaptured + gatingCaptured;
  const totalCaptured = capturedEntries.length + nameEmailCaptured + gatingCaptured;

  return (
    <div className="border border-border/80 p-4">
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {FLOW_TITLES[intake.flow]}
        </div>
        {totalFields > 0 && (
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/90">
            {totalCaptured} of {totalFields}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        <IntakeField
          label="Name"
          value={intake.fields.name ?? ''}
          placeholder="Your name"
          type="text"
          onSave={(v) => onFieldEdit('name', v)}
        />
        <IntakeField
          label="Email"
          value={intake.fields.email ?? ''}
          placeholder="you@example.com"
          type="email"
          onSave={(v) => onFieldEdit('email', v)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-border/60 pt-4 sm:flex-row">
        {gatingFields.map((f) => (
          <IntakeField
            key={f.key}
            label={f.label}
            value={intake.fields[f.key] ?? ''}
            placeholder={f.placeholder}
            multiline={f.multiline}
            onSave={(v) => onFieldEdit(f.key, v)}
          />
        ))}
      </div>

      {capturedEntries.length > 0 && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border/60 pt-4">
          {capturedEntries.map(([key, value]) => (
            <IntakeField
              key={key}
              label={key.replace(/_/g, ' ')}
              value={value}
              placeholder={`Add ${key.replace(/_/g, ' ')}`}
              multiline={MULTILINE_FIELDS.has(key)}
              onSave={(v) => onFieldEdit(key, v)}
            />
          ))}
        </div>
      )}

      {intake.submitError && (
        <div className="mt-3 text-xs text-red-500">{intake.submitError}</div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!intake.readyToSubmit || submitting}
          className="border border-border/80 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? 'Sending…'
            : intake.readyToSubmit
              ? 'Submit'
              : submitReadinessReason(intake.flow, intake.fields) ?? 'Not ready yet'}
        </button>
        {calendlyUrl && (
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Prefer to talk? Book a call →
          </a>
        )}
      </div>
    </div>
  );
}
