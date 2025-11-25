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
  console.log('Contact form submission received');
  console.log('RESEND_API_KEY exists:', !!import.meta.env.RESEND_API_KEY);
  console.log('RESEND_FROM_EMAIL exists:', !!import.meta.env.RESEND_FROM_EMAIL);
  
  if (!import.meta.env.RESEND_API_KEY || !import.meta.env.RESEND_FROM_EMAIL) {
    console.error('Missing environment variables: RESEND_API_KEY or RESEND_FROM_EMAIL');
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
    const { name, email, message } = formData;
    
    console.log('Form data received:', { name, email, messageLength: message?.length });

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: name, email, and message are required.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: [import.meta.env.RESEND_FROM_EMAIL],
      replyTo: email,
      subject: `New Contact Form Submission from ${escapeHtml(name)}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      console.error('Resend API error:', JSON.stringify(error, null, 2));
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email',
        details: error
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Email submission error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
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