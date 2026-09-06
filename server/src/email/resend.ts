// Ported from src/pages/api/submit-intake.ts (itself modeled on
// src/pages/api/send-email.ts's escapeHtml/formatFrom conventions). Same
// email format the existing intake pipeline already produces, so a lead
// submitted through the new backend looks identical to one from the old
// Netlify endpoint.
import { Resend } from 'resend';
import { env } from '../env';
import { QUOTE_FIELD_ORDER, QUOTE_FIELD_LABELS, CONTENT_FIELD_ORDER, CONTENT_FIELD_LABELS } from '../../../shared/intake';
import type { Flow } from '../db/schema';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatFrom(emailOrFrom: string, label = 'Site Chat'): string {
  if (!emailOrFrom) return '';
  if (emailOrFrom.includes('<') && emailOrFrom.includes('>')) return emailOrFrom;
  return `${label} <${emailOrFrom}>`;
}

const resend = new Resend(env.RESEND_API_KEY);

export interface SendLeadEmailResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

export async function sendLeadEmail(flow: Flow, fields: Record<string, string>): Promise<SendLeadEmailResult> {
  const toEmail = (env.CONTACT_EMAIL || env.RESEND_FROM_EMAIL || '').trim();

  if (!toEmail) {
    return { ok: false, error: 'Server configuration error: CONTACT_EMAIL is not set.' };
  }

  // No 'onboarding@resend.dev' fallback. That address is Resend's shared
  // test sender and is hard-restricted to the account owner's own inbox —
  // every lead to any other address comes back 403 validation_error ("You
  // can only send testing emails to your own email address"). It looks
  // configured, boots fine, passes every test that doesn't actually send,
  // and then drops real leads. Fail explicitly instead: the lead row is
  // still written with emailStatus 'failed' by the caller, so nothing is
  // lost while this is being fixed.
  if (!env.RESEND_FROM_EMAIL) {
    return {
      ok: false,
      error:
        'Server configuration error: RESEND_FROM_EMAIL is not set, so there is no verified sender to send from.',
    };
  }
  const from = formatFrom(env.RESEND_FROM_EMAIL);

  const name = fields.name ?? '';
  const email = fields.email ?? '';

  let subject: string;
  let rows: string;

  if (flow === 'quote') {
    subject = `New Quote Request from ${escapeHtml(name)}`;
    rows = QUOTE_FIELD_ORDER.filter((key) => fields[key])
      .map((key) => `<p><strong>${escapeHtml(QUOTE_FIELD_LABELS[key])}:</strong> ${escapeHtml(String(fields[key])).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  } else {
    const projectName = fields.project_name ? ` — ${escapeHtml(fields.project_name)}` : '';
    subject = `New Content Submission from ${escapeHtml(name)}${projectName}`;
    rows =
      CONTENT_FIELD_ORDER.filter((key) => fields[key])
        .map((key) => `<p><strong>${escapeHtml(CONTENT_FIELD_LABELS[key])}:</strong> ${escapeHtml(String(fields[key])).replace(/\n/g, '<br>')}</p>`)
        .join('\n') +
      '\n<p><em>Note: file uploads (logos/photos/documents) were not collected here — ask the client to email those separately.</em></p>';
  }

  const html = `<h2>${flow === 'quote' ? 'New Quote Request' : 'New Content Submission'}</h2>\n${rows}`;

  try {
    const { data, error } = await resend.emails.send({ from, to: [toEmail], reply_to: email, subject, html });
    if (error) return { ok: false, error: error.message || 'Failed to send email' };
    return { ok: true, resendId: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'An unexpected error occurred.' };
  }
}
