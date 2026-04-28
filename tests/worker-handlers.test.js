import { describe, it, expect, beforeEach, vi } from 'vitest';
import LZString from 'lz-string';
import {
  handleTfdProxy,
  handleShortenRequest,
  handleRedirectRequest,
  isValidBuildHash,
  isAllowedShortenOrigin,
  generateShortId,
  checkShortenRateLimit,
  MAX_HASH_BYTES,
  SHORTEN_RATE_LIMIT_PER_HOUR,
} from '../worker-handlers.js';

function makeKV(initial = {}) {
  const storage = new Map(Object.entries(initial));
  return {
    storage,
    async get(k) {
      return storage.has(k) ? storage.get(k) : null;
    },
    async put(k, v) {
      storage.set(k, v);
    },
    async delete(k) {
      storage.delete(k);
    },
  };
}

function req(url, init = {}) {
  return new Request(url, init);
}

const VALID_HASH = LZString.compressToEncodedURIComponent(
  JSON.stringify({ v: 3, d: 101 })
);

describe('handleTfdProxy', () => {
  it('returns 500 when keys are not configured', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleTfdProxy(
      req(
        'https://app.example.com/api/tfd/metadata/descendant?language_code=en'
      ),
      env
    );
    expect(res.status).toBe(500);
  });

  it('forwards request with auth headers and strips Set-Cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('[1,2,3]', {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Set-Cookie': 'leak=1', // upstream tries to set cookie; we should drop it
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const env = {
      WORKER_API_KEY: 'wk',
      TFD_API_KEY: 'nx',
      TFD_CACHE_URL: 'https://cache.example.com',
    };
    const res = await handleTfdProxy(
      req(
        'https://app.example.com/api/tfd/metadata/descendant?language_code=en'
      ),
      env
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toBeNull();
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const [calledUrl, opts] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(
      'https://cache.example.com/tfd/metadata/descendant?language_code=en'
    );
    expect(opts.headers.get('x-worker-api-key')).toBe('wk');
    expect(opts.headers.get('x-nxopen-api-key')).toBe('nx');

    vi.unstubAllGlobals();
  });

  it('rewrites /api/tfd to /tfd in the upstream URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const env = { WORKER_API_KEY: 'wk', TFD_API_KEY: 'nx' };
    await handleTfdProxy(
      req('https://app.example.com/api/tfd/v1/user/descendant?ouid=abc'),
      env
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://tfd-cache.jediknight112.com/tfd/v1/user/descendant?ouid=abc'
    );
    vi.unstubAllGlobals();
  });
});

describe('isValidBuildHash', () => {
  it('accepts a real serialized build', () => {
    expect(isValidBuildHash(VALID_HASH)).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidBuildHash('not-a-real-hash!!!')).toBe(false);
  });

  it('rejects valid JSON without v/d fields', () => {
    const bad = LZString.compressToEncodedURIComponent('{"foo":1}');
    expect(isValidBuildHash(bad)).toBe(false);
  });

  it('rejects when v is not a number', () => {
    const bad = LZString.compressToEncodedURIComponent(
      JSON.stringify({ v: 'three', d: 1 })
    );
    expect(isValidBuildHash(bad)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidBuildHash('')).toBe(false);
  });
});

describe('isAllowedShortenOrigin', () => {
  it('accepts the production domain', () => {
    const r = req('https://x', {
      headers: { Origin: 'https://tfd-builds.jediknight112.com' },
    });
    expect(isAllowedShortenOrigin(r, {})).toBe(true);
  });

  it('accepts localhost', () => {
    const r = req('https://x', {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(isAllowedShortenOrigin(r, {})).toBe(true);
  });

  it('rejects unknown origins', () => {
    const r = req('https://x', {
      headers: { Origin: 'https://attacker.example' },
    });
    expect(isAllowedShortenOrigin(r, {})).toBe(false);
  });

  it('rejects missing Origin', () => {
    const r = req('https://x');
    expect(isAllowedShortenOrigin(r, {})).toBe(false);
  });

  it('honors ALLOWED_SHORTEN_ORIGIN env var for self-hosters', () => {
    const r = req('https://x', {
      headers: { Origin: 'https://my-fork.example' },
    });
    expect(
      isAllowedShortenOrigin(r, {
        ALLOWED_SHORTEN_ORIGIN: 'https://my-fork.example',
      })
    ).toBe(true);
  });
});

describe('checkShortenRateLimit', () => {
  it('allows under the per-hour limit and increments', async () => {
    const env = { URL_SHORTENER: makeKV() };
    for (let i = 0; i < SHORTEN_RATE_LIMIT_PER_HOUR; i++) {
      const r = await checkShortenRateLimit(env, '1.2.3.4');
      expect(r.allowed).toBe(true);
    }
    expect(env.URL_SHORTENER.storage.get('ratelimit:shorten:1.2.3.4')).toBe(
      String(SHORTEN_RATE_LIMIT_PER_HOUR)
    );
  });

  it('blocks past the per-hour limit', async () => {
    const env = {
      URL_SHORTENER: makeKV({
        'ratelimit:shorten:1.2.3.4': String(SHORTEN_RATE_LIMIT_PER_HOUR),
      }),
    };
    const r = await checkShortenRateLimit(env, '1.2.3.4');
    expect(r.allowed).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  it('passes through when no IP is available', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const r = await checkShortenRateLimit(env, '');
    expect(r.allowed).toBe(true);
  });
});

describe('handleShortenRequest', () => {
  function shortenReq(
    body,
    {
      origin = 'https://tfd-builds.jediknight112.com',
      ip = '1.2.3.4',
      method = 'POST',
    } = {}
  ) {
    const headers = { 'Content-Type': 'application/json', Origin: origin };
    if (ip) headers['CF-Connecting-IP'] = ip;
    const init = { method, headers };
    if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return req('https://tfd-builds.jediknight112.com/api/shorten', init);
  }

  it('rejects non-POST', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleShortenRequest(
      shortenReq(undefined, { method: 'GET' }),
      env
    );
    expect(res.status).toBe(405);
  });

  it('rejects disallowed origins', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleShortenRequest(
      shortenReq({ hash: VALID_HASH }, { origin: 'https://attacker.example' }),
      env
    );
    expect(res.status).toBe(403);
  });

  it('rejects oversized payloads with 413', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const huge = 'a'.repeat(MAX_HASH_BYTES + 1);
    const res = await handleShortenRequest(shortenReq({ hash: huge }), env);
    expect(res.status).toBe(413);
  });

  it('rejects payloads that are not valid serialized builds', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleShortenRequest(
      shortenReq({ hash: 'definitely-not-a-build' }),
      env
    );
    expect(res.status).toBe(400);
  });

  it('rejects when hash field is missing', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleShortenRequest(shortenReq({}), env);
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON body', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleShortenRequest(shortenReq('not-json'), env);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate-limited', async () => {
    const env = {
      URL_SHORTENER: makeKV({
        'ratelimit:shorten:1.2.3.4': String(SHORTEN_RATE_LIMIT_PER_HOUR),
      }),
    };
    const res = await handleShortenRequest(
      shortenReq({ hash: VALID_HASH }),
      env
    );
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });

  it('happy path stores hash and returns shortUrl', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleShortenRequest(
      shortenReq({ hash: VALID_HASH }),
      env
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.shortUrl).toMatch(
      /^https:\/\/tfd-builds\.jediknight112\.com\/s\/[A-Za-z0-9]{6}$/
    );
    // The stored hash should be exactly what was sent
    const storedKeys = [...env.URL_SHORTENER.storage.keys()].filter(
      (k) => !k.startsWith('ratelimit:')
    );
    expect(storedKeys).toHaveLength(1);
    expect(env.URL_SHORTENER.storage.get(storedKeys[0])).toBe(VALID_HASH);
  });
});

describe('handleRedirectRequest', () => {
  it('redirects to /#hash when short ID exists', async () => {
    const env = { URL_SHORTENER: makeKV({ AbCdEf: VALID_HASH }) };
    const res = await handleRedirectRequest(
      req('https://tfd-builds.jediknight112.com/s/AbCdEf'),
      env,
      'AbCdEf'
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(
      `https://tfd-builds.jediknight112.com/#${VALID_HASH}`
    );
  });

  it('redirects to home when short ID is unknown', async () => {
    const env = { URL_SHORTENER: makeKV() };
    const res = await handleRedirectRequest(
      req('https://tfd-builds.jediknight112.com/s/missing'),
      env,
      'missing'
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(
      'https://tfd-builds.jediknight112.com/'
    );
  });
});

describe('generateShortId', () => {
  it('returns a string of the requested length', () => {
    expect(generateShortId(6)).toHaveLength(6);
    expect(generateShortId(10)).toHaveLength(10);
  });

  it('uses only the allowed alphabet', () => {
    const id = generateShortId(64);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('produces different IDs across calls (overwhelmingly likely)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(generateShortId());
    expect(ids.size).toBeGreaterThan(95);
  });
});
