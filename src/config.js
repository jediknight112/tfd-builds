// Helper to get environment variables safely
const getEnv = () =>
  typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__ : {};

// API Configuration
export const API_BASE_URL =
  getEnv().API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://tfd-cache.jediknight112.com';

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

export const getLanguage = () => {
  return (
    getEnv().LANGUAGE_CODE ||
    import.meta.env.VITE_LANGUAGE_CODE ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('languageCode')
      : null) ||
    'en'
  );
};
// Helper to get API keys from environment or localStorage
export const getApiKeys = () => {
  const serverEnv = getEnv();

  const workerApiKey =
    serverEnv.WORKER_API_KEY ||
    import.meta.env.VITE_WORKER_API_KEY ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('workerApiKey')
      : null);

  const nexonApiKey =
    serverEnv.TFD_API_KEY ||
    import.meta.env.VITE_NEXON_API_KEY ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('nexonApiKey')
      : null);

  return { workerApiKey, nexonApiKey };
};
