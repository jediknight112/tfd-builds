/**
 * TFD Builds Cloudflare Worker
 * Serves the Vite-built static site, proxies TFD API calls server-side
 * (so API keys never reach the browser), and handles URL shortening.
 *
 * Pure handler logic lives in worker-handlers.js so it's unit-testable
 * without the wrangler-injected __STATIC_CONTENT_MANIFEST.
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import {
  handleTfdProxy,
  handleShortenRequest,
  handleRedirectRequest,
} from './worker-handlers.js';

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith('/api/tfd/')) {
        return handleTfdProxy(request, env);
      }

      if (url.pathname === '/api/shorten') {
        return handleShortenRequest(request, env);
      }

      const match = url.pathname.match(/^\/s\/([a-zA-Z0-9]+)$/);
      if (match) {
        return handleRedirectRequest(request, env, match[1]);
      }

      let response;
      try {
        response = await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        );
      } catch (e) {
        if (
          e.message.includes('could not find') ||
          e.name === 'NotFoundError' ||
          e.status === 404
        ) {
          return new Response('Not Found', { status: 404 });
        }
        throw e;
      }

      const headers = new Headers(response.headers);
      const isHtml =
        url.pathname === '/' ||
        url.pathname === '/index.html' ||
        response.headers.get('content-type')?.includes('text/html');

      if (isHtml) {
        if ([101, 204, 205, 304].includes(response.status)) {
          return response;
        }
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cache-Control', 'public, max-age=300');

        // Inject a per-request CSP nonce so the small <script> blocks for
        // theme bootstrap and GTM work without 'unsafe-inline'.
        const nonce = btoa(
          String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))
        );
        let html = await response.text();
        html = html.replaceAll('__CSP_NONCE__', nonce);

        headers.set(
          'Content-Security-Policy',
          [
            "default-src 'self'",
            // Nonces unlock the two inline <script> blocks (theme bootstrap +
            // GTM init); the host allowlist covers external scripts. Note we
            // do NOT use 'strict-dynamic' — that would *replace* the host
            // allowlist with nonce-only enforcement, blocking GTM/Nexon
            // analytics tags (which Vite emits without nonces) and the
            // Vite-built /assets/index-*.js entry chunk.
            `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://openapi.nexon.com https://www.google-analytics.com https://static.cloudflareinsights.com`,
            // Inline style attributes are emitted via innerHTML in several modules,
            // so we need 'unsafe-inline' here. Tightening this would require a
            // larger refactor of ui-components.js.
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
            "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ')
        );
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');

        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

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
