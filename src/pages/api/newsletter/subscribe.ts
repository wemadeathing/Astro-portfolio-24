import type { APIRoute } from 'astro';

export const prerender = false;

const getEnv = (key: string) => {
  const nodeVal = (globalThis as any)?.process?.env?.[key];
  if (typeof nodeVal === 'string' && nodeVal.trim()) return nodeVal.trim();

  const denoGet = (globalThis as any)?.Deno?.env?.get;
  if (typeof denoGet === 'function') {
    const denoVal = denoGet.call((globalThis as any).Deno.env, key);
    if (typeof denoVal === 'string' && denoVal.trim()) return denoVal.trim();
  }

  const buildTime = (import.meta as any)?.env?.[key];
  return typeof buildTime === 'string' ? buildTime.trim() : '';
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const isValidEmail = (email: string) => {
  const e = String(email || '').trim();
  // Simple, permissive email check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

export const POST: APIRoute = async ({ request }) => {
  const token = getEnv('MAILERLITE_API_TOKEN');
  const groupId = getEnv('MAILERLITE_GROUP_ID');
  const baseUrl = getEnv('MAILERLITE_API_BASE_URL') || 'https://connect.mailerlite.com/api';

  if (!token || !groupId) {
    return json(
      {
        success: false,
        error: 'Newsletter is not configured yet. Please try again later.',
      },
      500
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email ?? '').trim();
    const company = String(body?.company ?? '').trim();

    // Honeypot: if filled, pretend success.
    if (company.length > 0) return json({ success: true });

    if (!isValidEmail(email)) {
      return json({ success: false, error: 'Please enter a valid email address.' }, 400);
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Try the group-specific endpoint first (common in MailerLite APIs).
    const groupEndpoint = `${baseUrl.replace(/\/$/, '')}/groups/${encodeURIComponent(groupId)}/subscribers`;
    const subscriberEndpoint = `${baseUrl.replace(/\/$/, '')}/subscribers`;

    const attempt = async (url: string, payload: any) => {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      return { res, data };
    };

    let out = await attempt(groupEndpoint, { email });

    // If that endpoint doesn't exist (or rejects payload shape), try the generic subscribers endpoint.
    if (out.res.status === 404 || out.res.status === 405) {
      out = await attempt(subscriberEndpoint, { email, groups: [groupId] });
    }

    if (out.res.ok) {
      return json({ success: true });
    }

    const msg =
      typeof out.data?.message === 'string'
        ? out.data.message
        : typeof out.data?.error === 'string'
          ? out.data.error
          : 'Unable to subscribe right now. Please try again later.';

    return json({ success: false, error: msg }, out.res.status || 400);
  } catch {
    return json(
      {
        success: false,
        error: 'Unable to subscribe right now. Please try again later.',
      },
      500
    );
  }
};
