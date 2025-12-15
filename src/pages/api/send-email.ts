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

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.RESEND_API_KEY || !import.meta.env.CONTACT_EMAIL) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server configuration error. Please contact the site administrator.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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
      from: 'Contact Form <onboarding@resend.dev>',
      to: [import.meta.env.CONTACT_EMAIL],
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
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again later.',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}