import { Resend } from 'resend';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { escapeHtml, getEnv, formatFrom } from '../../lib/emailHelpers';
import {
  QuoteFieldsSchema,
  ContentFieldsSchema,
  QUOTE_FIELD_ORDER,
  QUOTE_FIELD_LABELS,
  CONTENT_FIELD_ORDER,
  CONTENT_FIELD_LABELS,
} from '../../lib/intake';

export const prerender = false;

const SubmitSchema = z.discriminatedUnion('flow', [
  z.object({
    flow: z.literal('quote'),
    fields: QuoteFieldsSchema.extend({ name: z.string().min(1).max(120), email: z.string().email() }),
    honeypot: z.string().optional(),
  }),
  z.object({
    flow: z.literal('content'),
    fields: ContentFieldsSchema.extend({ name: z.string().min(1).max(120), email: z.string().email() }),
    honeypot: z.string().optional(),
  }),
]);

// Best-effort in-memory rate limiting (own bucket, separate module from chat.ts).
// Tighter than /api/chat since every allowed request here sends a real email.
const rl = (() => {
  const byIp = new Map<string, number[]>();
  const WINDOW_MS = 60_000;
  const MAX_PER_WINDOW = 5;

  const allow = (ip: string) => {
    const now = Date.now();
    const arr = byIp.get(ip) ?? [];
    const recent = arr.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    byIp.set(ip, recent);
    return recent.length <= MAX_PER_WINDOW;
  };

  return { allow };
})();

const getClientIp = (request: Request) => {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = request.headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request);
  if (!rl.allow(ip)) {
    return jsonResponse({ success: false, error: 'Too many submissions. Please wait a moment and try again.' }, 429);
  }

  const resendApiKey = getEnv('RESEND_API_KEY');
  const contactEmail = getEnv('CONTACT_EMAIL');
  const resendFromEmail = getEnv('RESEND_FROM_EMAIL');

  const toEmail = (contactEmail || resendFromEmail).trim();
  const from = formatFrom(resendFromEmail || 'onboarding@resend.dev', 'Site Chat');

  if (!resendApiKey) {
    return jsonResponse({ success: false, error: 'Server configuration error: RESEND_API_KEY is not set.' }, 500);
  }
  if (!toEmail) {
    return jsonResponse({ success: false, error: 'Server configuration error: CONTACT_EMAIL is not set.' }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Invalid request body.' }, 400);
  }

  // Honeypot: if filled, silently succeed without sending anything.
  const honeypot = (body as any)?.honeypot;
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return jsonResponse({ success: true }, 200);
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return jsonResponse(
      { success: false, error: firstIssue?.message || 'Invalid submission.' },
      400
    );
  }

  const { flow, fields } = parsed.data;
  const name = fields.name.trim();
  const email = fields.email.trim();

  const resend = new Resend(resendApiKey);

  try {
    let subject: string;
    let rows: string;

    if (flow === 'quote') {
      subject = `New Quote Request from ${escapeHtml(name)}`;
      rows = QUOTE_FIELD_ORDER.filter((key) => fields[key])
        .map(
          (key) =>
            `<p><strong>${escapeHtml(QUOTE_FIELD_LABELS[key])}:</strong> ${escapeHtml(String(fields[key])).replace(/\n/g, '<br>')}</p>`
        )
        .join('\n');
    } else {
      const projectName = fields.project_name ? ` — ${escapeHtml(fields.project_name)}` : '';
      subject = `New Content Submission from ${escapeHtml(name)}${projectName}`;
      rows = CONTENT_FIELD_ORDER.filter((key) => fields[key])
        .map(
          (key) =>
            `<p><strong>${escapeHtml(CONTENT_FIELD_LABELS[key])}:</strong> ${escapeHtml(String(fields[key])).replace(/\n/g, '<br>')}</p>`
        )
        .join('\n');
      rows += `\n<p><em>Note: file uploads (logos/photos/documents) were not collected here — ask the client to email those separately.</em></p>`;
    }

    const html = `
      <h2>${flow === 'quote' ? 'New Quote Request' : 'New Content Submission'}</h2>
      ${rows}
    `;

    const { data, error } = await resend.emails.send({
      from,
      to: [toEmail],
      reply_to: email,
      subject,
      html,
    });

    if (error) {
      return jsonResponse({ success: false, error: error.message || 'Failed to send email' }, 400);
    }

    return jsonResponse({ success: true, data }, 200);
  } catch (error) {
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    const details = error instanceof Error ? error.message : String(error);
    return jsonResponse(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
        ...(isDev ? { details } : {}),
      },
      500
    );
  }
};
