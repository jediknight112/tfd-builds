import { API_BASE_URL } from './config.js';
import { state } from './state.js';

// API Client for TFD Cache
class TFDApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async fetchMetadata(type) {
    try {
      const url = `${this.baseUrl}/tfd/metadata/${type}?language_code=${state.language}`;
      const { workerApiKey, nexonApiKey } = state.apiKeys;

      if (!workerApiKey || !nexonApiKey) {
        throw new Error(
          'API keys are not configured. Please contact the administrator.'
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        headers: {
          'x-worker-api-key': workerApiKey,
          'x-nxopen-api-key': nexonApiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `Failed to fetch ${type}:`,
          response.status,
          response.statusText
        );
        if (response.status === 401) {
          throw new Error(
            'Authentication failed. Please configure your API keys.'
          );
        }
        throw new Error(
          `Failed to fetch ${type}: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error(`Error in fetchMetadata(${type}):`, error);
      throw error;
    }
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
}

export const apiClient = new TFDApiClient();
