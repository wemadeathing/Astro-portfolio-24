import { Resend } from 'resend';
import type { APIRoute } from 'astro';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const prerender = false;

const getEnv = (key: string) => {
  // Runtime (Node)
  const nodeVal = (globalThis as any)?.process?.env?.[key];
  if (typeof nodeVal === 'string' && nodeVal.trim()) return nodeVal.trim();

  // Runtime (Edge / Deno)
  const denoGet = (globalThis as any)?.Deno?.env?.get;
  if (typeof denoGet === 'function') {
    const denoVal = denoGet.call((globalThis as any).Deno.env, key);
    if (typeof denoVal === 'string' && denoVal.trim()) return denoVal.trim();
  }

  // Build-time (Vite/Astro) fallback
  const buildTime = (import.meta as any)?.env?.[key];
  return typeof buildTime === 'string' ? buildTime.trim() : '';
};

const formatFrom = (emailOrFrom: string) => {
  if (!emailOrFrom) return '';
  // If already formatted like "Name <email@...>", keep it.
  if (emailOrFrom.includes('<') && emailOrFrom.includes('>')) return emailOrFrom;
  return `Contact Form <${emailOrFrom}>`;
};

export const POST: APIRoute = async ({ request }) => {
  const resendApiKey = getEnv('RESEND_API_KEY');
  const contactEmail = getEnv('CONTACT_EMAIL');
  const resendFromEmail = getEnv('RESEND_FROM_EMAIL');

  // Destination inbox fallback: if CONTACT_EMAIL isn't set, use RESEND_FROM_EMAIL.
  const toEmail = (contactEmail || resendFromEmail).trim();
  const from = formatFrom(resendFromEmail || 'onboarding@resend.dev');

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server configuration error: RESEND_API_KEY is not set.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!toEmail) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server configuration error: CONTACT_EMAIL is not set.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resend = new Resend(resendApiKey);

  try {
    const formData = await request.json();
    const { name, email, message, company } = formData as {
      name?: string;
      email?: string;
      message?: string;
      // Honeypot field (should stay empty)
      company?: string;
    };

    // Basic bot mitigation: if honeypot is filled, silently succeed.
    if (company && String(company).trim().length > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: name, email, and message are required.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const safeName = String(name).trim();
    const safeEmail = String(email).trim();
    const safeMessage = String(message).trim();

    if (safeName.length < 2 || safeMessage.length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please provide a bit more detail in your message.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await resend.emails.send({
      from,
      to: [toEmail],
      replyTo: safeEmail,
      subject: `New Contact Form Submission from ${escapeHtml(safeName)}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(safeMessage).replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const isDev = Boolean((import.meta as any)?.env?.DEV);
    const details = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
        ...(isDev ? { details } : {}),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}