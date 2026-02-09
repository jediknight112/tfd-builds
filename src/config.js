// API Configuration
export const API_BASE_URL = 'https://tfd-cache.jediknight112.com';
export const LANGUAGE_CODE = 'en';

// Get API keys from environment or localStorage
export const getApiKeys = () => {
  const workerApiKey = import.meta.env.VITE_WORKER_API_KEY || localStorage.getItem('workerApiKey');
  const nexonApiKey = import.meta.env.VITE_NEXON_API_KEY || localStorage.getItem('nexonApiKey');
  return { workerApiKey, nexonApiKey };
};
