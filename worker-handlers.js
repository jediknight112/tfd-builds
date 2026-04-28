/**
 * Pure handler functions for the tfd-builds Worker.
 *
 * Extracted from worker.js so they can be unit-tested without the
 * `__STATIC_CONTENT_MANIFEST` import that wrangler injects at deploy time.
 * worker.js re-exports / wires these into its fetch handler.
 */

import LZString from 'lz-string';

export const DEFAULT_TFD_CACHE_URL = 'https://tfd-cache.jediknight112.com';

// Shorten endpoint hardening
export const MAX_HASH_BYTES = 8 * 1024;
export const SHORTEN_RATE_LIMIT_PER_HOUR = 30;
export const SHORTEN_RATE_WINDOW_SECONDS = 60 * 60;
export const ALLOWED_ORIGIN_HOSTS = new Set([
  'tfd-builds.jediknight112.com',
  'localhost:3000',
  'localhost:8787',
  '127.0.0.1:3000',
  '127.0.0.1:8787',
]);

export function isLocalRequest(url, hostHeader) {
  return (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '[::1]' ||
    (url.hostname === 'tfd-builds.jediknight112.com' &&
      url.protocol === 'http:') ||
    (hostHeader || '').includes('localhost')
  );
}

export function publicOrigin(request) {
  const url = new URL(request.url);
  const hostHeader = request.headers.get('host') || '';
  return isLocalRequest(url, hostHeader) ? 'http://localhost:3000' : url.origin;
}

export function generateShortId(length = 6) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

export function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function isAllowedShortenOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  if (ALLOWED_ORIGIN_HOSTS.has(host)) return true;
  if (env.ALLOWED_SHORTEN_ORIGIN) {
    try {
      return new URL(env.ALLOWED_SHORTEN_ORIGIN).host === host;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Server-side validation: the payload must be a real LZ-string-compressed
 * serialized build (the shape that BuildSerializer produces).
 */
export function isValidBuildHash(hash) {
  let json;
  try {
    json = LZString.decompressFromEncodedURIComponent(hash);
  } catch {
    return false;
  }
  if (!json || json.length > MAX_HASH_BYTES * 4) return false;
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== 'object') return false;
  if (typeof parsed.v !== 'number') return false;
  if (parsed.d === undefined || parsed.d === null) return false;
  return true;
}

/**
 * Per-IP rate limit using URL_SHORTENER KV. Window is one hour from first hit.
 */
export async function checkShortenRateLimit(env, ip) {
  if (!ip) return { allowed: true };
  const key = `ratelimit:shorten:${ip}`;
  const current = await env.URL_SHORTENER.get(key);
  const count = current ? parseInt(current, 10) || 0 : 0;
  if (count >= SHORTEN_RATE_LIMIT_PER_HOUR) {
    return { allowed: false, retryAfter: SHORTEN_RATE_WINDOW_SECONDS };
  }
  await env.URL_SHORTENER.put(key, String(count + 1), {
    expirationTtl: SHORTEN_RATE_WINDOW_SECONDS,
  });
  return { allowed: true };
}

export async function handleTfdProxy(request, env) {
  const reqUrl = new URL(request.url);
  const upstreamPath = reqUrl.pathname.replace(/^\/api\/tfd/, '/tfd');
  const upstreamBase = env.TFD_CACHE_URL || DEFAULT_TFD_CACHE_URL;
  const upstreamUrl = `${upstreamBase}${upstreamPath}${reqUrl.search}`;

  const workerKey = env.WORKER_API_KEY;
  const nexonKey = env.TFD_API_KEY;
  if (!workerKey || !nexonKey) {
    return jsonError(
      'TFD backend is not configured on this Worker. Set WORKER_API_KEY and TFD_API_KEY secrets.',
      500
    );
  }

  const upstreamHeaders = new Headers();
  upstreamHeaders.set('x-worker-api-key', workerKey);
  upstreamHeaders.set('x-nxopen-api-key', nexonKey);
  upstreamHeaders.set('Accept', request.headers.get('Accept') || '*/*');
  const acceptLang = request.headers.get('Accept-Language');
  if (acceptLang) upstreamHeaders.set('Accept-Language', acceptLang);

  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
    const contentType = request.headers.get('Content-Type');
    if (contentType) upstreamHeaders.set('Content-Type', contentType);
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body,
  });

  const respHeaders = new Headers();
  const contentType = upstream.headers.get('Content-Type');
  if (contentType) respHeaders.set('Content-Type', contentType);
  const xCache = upstream.headers.get('X-Cache');
  if (xCache) respHeaders.set('X-Cache', xCache);
  respHeaders.set('Cache-Control', 'no-store');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export async function handleShortenRequest(request, env) {
  if (request.method !== 'POST') {
    return jsonError('Method Not Allowed', 405);
  }

  if (!isAllowedShortenOrigin(request, env)) {
    return jsonError('Origin not allowed', 403);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const rl = await checkShortenRateLimit(env, ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after: rl.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(rl.retryAfter),
        },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const hash = body?.hash;
  if (typeof hash !== 'string' || hash.length === 0) {
    return jsonError('Missing hash', 400);
  }

  const byteLength = new TextEncoder().encode(hash).length;
  if (byteLength > MAX_HASH_BYTES) {
    return jsonError(
      `Payload too large (${byteLength} bytes; max ${MAX_HASH_BYTES})`,
      413
    );
  }

  if (!isValidBuildHash(hash)) {
    return jsonError(
      'Payload is not a valid serialized build (must be LZ-string-encoded JSON with v and d fields)',
      400
    );
  }

  try {
    let shortId = generateShortId();
    let retries = 0;
    while ((await env.URL_SHORTENER.get(shortId)) !== null && retries < 5) {
      shortId = generateShortId();
      retries++;
    }

    if (retries >= 5) {
      return jsonError('Failed to generate short ID', 500);
    }

    await env.URL_SHORTENER.put(shortId, hash, {
      expirationTtl: 60 * 60 * 24 * 90,
    });

    const shortUrl = `${publicOrigin(request)}/s/${shortId}`;
    return new Response(JSON.stringify({ shortUrl }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('Shorten error:', error);
    return jsonError('Internal Server Error', 500);
  }
}

export async function handleRedirectRequest(request, env, shortId) {
  const hash = await env.URL_SHORTENER.get(shortId);
  const origin = publicOrigin(request);

  if (!hash) {
    return Response.redirect(`${origin}/`, 302);
  }
  return Response.redirect(`${origin}/#${hash}`, 302);
}
