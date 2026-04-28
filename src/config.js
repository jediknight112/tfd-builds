// API Configuration
// All TFD API calls go through the tfd-builds Worker's /api/tfd/* proxy.
// The proxy adds the worker + Nexon API keys server-side, so the browser
// never sees them.
//
// Base URL is "/api" so the api-client can keep the cache's native
// "/tfd/..." path prefix unchanged (api-client builds e.g.
// `${baseUrl}/tfd/metadata/descendant`). The Worker rewrites
// /api/tfd → /tfd before forwarding upstream. Override VITE_API_BASE_URL
// only when intentionally bypassing the proxy for direct-to-cache testing
// (e.g. VITE_API_BASE_URL=https://tfd-cache.jediknight112.com).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
  { code: 'ja', name: '日本語' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'it', name: 'Italiano' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
];

// Safe localStorage read — Node 22 ships a partial localStorage stub without
// getItem unless --localstorage-file is set, so always guard.
const safeLocalStorageGet = (key) => {
  try {
    if (
      typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem === 'function'
    ) {
      return localStorage.getItem(key);
    }
  } catch {
    // localStorage may be unavailable or sandboxed
  }
  return null;
};

export const getLanguage = () => {
  return (
    import.meta.env.VITE_LANGUAGE_CODE ||
    safeLocalStorageGet('languageCode') ||
    'en'
  );
};

export const getTheme = () => {
  const stored = safeLocalStorageGet('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  try {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.matchMedia?.('(prefers-color-scheme: light)')?.matches
    ) {
      return 'light';
    }
  } catch {
    // matchMedia may be unavailable
  }
  return 'dark';
};
