import { API_BASE_URL } from './config.js';
import { state } from './state.js';

// API Client for TFD Cache.
// All upstream auth (worker API key + Nexon API key) is added by the
// tfd-builds Worker's /api/tfd/* proxy. The browser never sees the keys.
class TFDApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async _fetchJson(url, errorContext) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out for ${errorContext}`);
      }
      throw error;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('User not found. Please check the username.');
      }
      if (response.status === 401 || response.status === 500) {
        throw new Error(
          'TFD backend is misconfigured. Please contact the administrator.'
        );
      }
      throw new Error(
        `Failed to fetch ${errorContext}: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async fetchMetadata(type) {
    const url = `${this.baseUrl}/tfd/metadata/${type}?language_code=${state.language}`;
    return this._fetchJson(url, type);
  }

  async fetchDescendants() {
    return this.fetchMetadata('descendant');
  }

  async fetchModules() {
    return this.fetchMetadata('module');
  }

  async fetchWeapons() {
    return this.fetchMetadata('weapon');
  }

  async fetchReactors() {
    return this.fetchMetadata('reactor');
  }

  async fetchExternalComponents() {
    return this.fetchMetadata('external-component');
  }

  async fetchArcheTuningNodes() {
    return this.fetchMetadata('arche-tuning-node');
  }

  async fetchArcheTuningBoards() {
    return this.fetchMetadata('arche-tuning-board');
  }

  async fetchArcheTuningBoardGroups() {
    return this.fetchMetadata('arche-tuning-board-group');
  }

  async fetchDescendantGroups() {
    return this.fetchMetadata('descendant-group');
  }

  async fetchWeaponTypes() {
    return this.fetchMetadata('weapon-type');
  }

  async fetchTiers() {
    return this.fetchMetadata('tier');
  }

  async fetchStats() {
    return this.fetchMetadata('stat');
  }

  async fetchCoreSlots() {
    return this.fetchMetadata('core-slot');
  }

  async fetchCoreTypes() {
    return this.fetchMetadata('core-type');
  }

  // --- User API methods (proxied through tfd-cache, not cached long-term) ---

  async fetchUserData(endpoint, params = {}) {
    const queryString = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&');
    const url = `${this.baseUrl}/tfd/v1/${endpoint}${queryString ? `?${queryString}` : ''}`;
    return this._fetchJson(url, endpoint);
  }

  async resolveUsername(username) {
    return this.fetchUserData('id', { user_name: username });
  }

  async fetchUserDescendant(ouid) {
    return this.fetchUserData('user/descendant', { ouid });
  }

  async fetchUserWeapon(ouid, languageCode) {
    return this.fetchUserData('user/weapon', {
      ouid,
      language_code: languageCode,
    });
  }

  async fetchUserReactor(ouid, languageCode) {
    return this.fetchUserData('user/reactor', {
      ouid,
      language_code: languageCode,
    });
  }

  async fetchUserExternalComponent(ouid, languageCode) {
    return this.fetchUserData('user/external-component', {
      ouid,
      language_code: languageCode,
    });
  }

  async fetchUserArcheTuning(ouid, descendantGroupId) {
    return this.fetchUserData('user/arche-tuning', {
      ouid,
      descendant_group_id: descendantGroupId,
    });
  }

  async shortenUrl(hash) {
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash }),
      });

      if (!response.ok) {
        throw new Error('Failed to shorten URL');
      }

      const data = await response.json();
      return data.shortUrl;
    } catch (error) {
      console.error('Error shortening URL:', error);
      throw error;
    }
  }
}

export const apiClient = new TFDApiClient();
