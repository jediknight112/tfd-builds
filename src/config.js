// Helper to get environment variables safely
const getEnv = () => (typeof window !== 'undefined' && window.__ENV__ ? window.__ENV__ : {});

// API Configuration
export const API_BASE_URL = 
  getEnv().API_BASE_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  'https://tfd-cache.jediknight112.com';
export const LANGUAGE_CODE = 'en';

// Tier name mapping - API uses Tier#, UI displays friendly names
export const TIER_NAMES = {
  Tier1: 'Normal',
  Tier2: 'Rare',
  Tier3: 'Ultimate',
  Tier4: 'Transcendent',
};

// Convert API tier ID to display name
export const getTierDisplayName = (tierId) => {
  return TIER_NAMES[tierId] || tierId;
};

// Get API keys from environment or localStorage
export const getApiKeys = () => {
  const serverEnv = getEnv();

  const workerApiKey =
    serverEnv.WORKER_API_KEY ||
    import.meta.env.VITE_WORKER_API_KEY ||
    localStorage.getItem('workerApiKey');

  const nexonApiKey =
    serverEnv.TFD_API_KEY ||
    import.meta.env.VITE_NEXON_API_KEY ||
    localStorage.getItem('nexonApiKey');

  return { workerApiKey, nexonApiKey };
};
