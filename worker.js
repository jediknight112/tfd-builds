/**
 * TFD Builds Cloudflare Worker
 * Serves the Vite-built static site with environment variable injection
 * and handles URL shortening
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

/**
 * Generate a random short ID
 * @param {number} length
 * @returns {string}
 */
function generateShortId(length = 6) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Handle URL shortening request
 * @param {Request} request
 * @param {Object} env
 */
async function handleShortenRequest(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { hash } = await request.json();
    if (!hash) {
      return new Response('Missing hash', { status: 400 });
    }

    // Check if we already have this hash stored (optional optimization, skip for now to keep it simple)
    // or just generate a new ID every time.

    let shortId = generateShortId();
    let retries = 0;
    while ((await env.URL_SHORTENER.get(shortId)) !== null && retries < 5) {
      shortId = generateShortId();
      retries++;
    }

    if (retries >= 5) {
      return new Response('Failed to generate short ID', { status: 500 });
    }

    // Store in KV (expire in 90 days?)
    await env.URL_SHORTENER.put(shortId, hash, {
      expirationTtl: 60 * 60 * 24 * 90, // 90 days
    });

    const url = new URL(request.url);
    const shortUrl = `${url.origin}/s/${shortId}`;

    return new Response(JSON.stringify({ shortUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Shorten error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle short URL redirect
 * @param {Request} request
 * @param {Object} env
 * @param {string} shortId
 */
async function handleRedirectRequest(request, env, shortId) {
  const hash = await env.URL_SHORTENER.get(shortId);

  if (!hash) {
    // If not found, redirect to home
    const url = new URL(request.url);
    return Response.redirect(`${url.origin}/`, 302);
  }

  const url = new URL(request.url);
  return Response.redirect(`${url.origin}/#${hash}`, 302);
}

/**
 * Inject environment variables into the HTML
 */
function injectEnvVars(html, env) {
  // Create a script that sets environment variables on window object
  const envScript = `
    <script>
      window.__ENV__ = {
        TFD_API_KEY: "${env.TFD_API_KEY || ''}",
        WORKER_API_KEY: "${env.WORKER_API_KEY || ''}",
        API_BASE_URL: "${env.API_BASE_URL || ''}",
        LANGUAGE_CODE: "${env.LANGUAGE_CODE || ''}"
      };
    </script>
  `;

  // Inject before closing </head> tag or at the beginning of <body>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${envScript}</head>`);
  } else if (html.includes('<body>')) {
    return html.replace('<body>', `<body>${envScript}`);
  }

  // Fallback: prepend to the HTML
  return envScript + html;
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // API: Shorten URL
      if (url.pathname === '/api/shorten') {
        return handleShortenRequest(request, env);
      }

      // API: Redirect short URL
      const match = url.pathname.match(/^\/s\/([a-zA-Z0-9]+)$/);
      if (match) {
        return handleRedirectRequest(request, env, match[1]);
      }

      // Get the asset from KV storage
      let response = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );

      // If it's the main HTML file, inject environment variables
      if (
        url.pathname === '/' ||
        url.pathname === '/index.html' ||
        response.headers.get('content-type')?.includes('text/html')
      ) {
        // Don't modify 304/204/205/101 responses (they cannot have a body)
        if ([101, 204, 205, 304].includes(response.status)) {
          return response;
        }

        // Clone the response so we can modify it
        response = new Response(response.body, response);

        // Get the HTML content
        let html = await response.text();

        // Inject environment variables
        html = injectEnvVars(html, env);

        // Return modified HTML with proper headers
        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers),
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300', // 5 minutes cache for HTML
          },
        });
      }

      // For other assets, add longer cache headers
      const headers = new Headers(response.headers);
      if (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/)) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
