import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple localStorage mock (no vi.fn wrappers needed — just functionality)
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('config.js', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Clear Vite env vars that take priority over localStorage in the fallback chain
    vi.stubEnv('VITE_LANGUAGE_CODE', '');
    vi.stubEnv('VITE_WORKER_API_KEY', '');
    vi.stubEnv('VITE_NEXON_API_KEY', '');
    vi.resetModules();
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should have all 12 supported languages', async () => {
      const { SUPPORTED_LANGUAGES } = await import('../src/config.js');

      expect(SUPPORTED_LANGUAGES).toHaveLength(12);

      const codes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
      expect(codes).toContain('en');
      expect(codes).toContain('ko');
      expect(codes).toContain('ja');
      expect(codes).toContain('de');
      expect(codes).toContain('fr');
      expect(codes).toContain('zh-TW');
      expect(codes).toContain('zh-CN');
      expect(codes).toContain('it');
      expect(codes).toContain('pl');
      expect(codes).toContain('pt');
      expect(codes).toContain('ru');
      expect(codes).toContain('es');
    });

    it('should have both code and name for every language', async () => {
      const { SUPPORTED_LANGUAGES } = await import('../src/config.js');

      SUPPORTED_LANGUAGES.forEach((lang) => {
        expect(lang.code).toBeDefined();
        expect(typeof lang.code).toBe('string');
        expect(lang.code.length).toBeGreaterThan(0);
        expect(lang.name).toBeDefined();
        expect(typeof lang.name).toBe('string');
        expect(lang.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getLanguage', () => {
    it('should return localStorage value when available', async () => {
      localStorageMock.setItem('languageCode', 'ko');

      const { getLanguage } = await import('../src/config.js');
      expect(getLanguage()).toBe('ko');
    });

    it('should default to "en" when nothing is set', async () => {
      const { getLanguage } = await import('../src/config.js');
      expect(getLanguage()).toBe('en');
    });
  });

  describe('getTheme', () => {
    it('should return "dark" by default when nothing is stored', async () => {
      const { getTheme } = await import('../src/config.js');
      expect(getTheme()).toBe('dark');
    });

    it('should return localStorage value when set to "light"', async () => {
      localStorageMock.setItem('theme', 'light');
      const { getTheme } = await import('../src/config.js');
      expect(getTheme()).toBe('light');
    });

    it('should return localStorage value when set to "dark"', async () => {
      localStorageMock.setItem('theme', 'dark');
      const { getTheme } = await import('../src/config.js');
      expect(getTheme()).toBe('dark');
    });

    it('should ignore invalid localStorage values and fall back to "dark"', async () => {
      localStorageMock.setItem('theme', 'blue');
      const { getTheme } = await import('../src/config.js');
      expect(getTheme()).toBe('dark');
    });

    it('should respect prefers-color-scheme: light when no localStorage value', async () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query) => ({
          matches: query === '(prefers-color-scheme: light)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const { getTheme } = await import('../src/config.js');
      expect(getTheme()).toBe('light');
    });
  });

  describe('getApiKeys', () => {
    it('should return keys from localStorage', async () => {
      localStorageMock.setItem('workerApiKey', 'test-worker-key');
      localStorageMock.setItem('nexonApiKey', 'test-nexon-key');

      const { getApiKeys } = await import('../src/config.js');
      const keys = getApiKeys();

      expect(keys.workerApiKey).toBe('test-worker-key');
      expect(keys.nexonApiKey).toBe('test-nexon-key');
    });

    it('should return null values when no keys are configured', async () => {
      const { getApiKeys } = await import('../src/config.js');
      const keys = getApiKeys();

      expect(keys.workerApiKey).toBeNull();
      expect(keys.nexonApiKey).toBeNull();
    });
  });
});
