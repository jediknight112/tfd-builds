/**
 * TFD Builds Cloudflare Worker
 * Serves the Vite-built static site with environment variable injection
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

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
