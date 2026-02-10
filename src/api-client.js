import { API_BASE_URL, LANGUAGE_CODE } from './config.js';
import { state } from './state.js';

// API Client for TFD Cache
class TFDApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.language = LANGUAGE_CODE;
    this.nexonImageBaseUrl = 'https://open.api.nexon.com/static/tfd/img/';
    this.cacheImageBaseUrl = `${this.baseUrl}/static/tfd/img/`;
  }

  /**
   * Rewrite Nexon image URLs to use the cache service
   * @param {string} imageUrl - Original Nexon image URL
   * @returns {string} - Rewritten cache URL
   */
  rewriteImageUrl(imageUrl) {
    if (!imageUrl) return imageUrl;
    
    // Check if this is a Nexon image URL
    if (imageUrl.startsWith(this.nexonImageBaseUrl)) {
      // Extract the image ID from the URL
      const imageId = imageUrl.replace(this.nexonImageBaseUrl, '');
      // Return the cache URL
      return `${this.cacheImageBaseUrl}${imageId}`;
    }
    
    return imageUrl;
  }

  /**
   * Process API response data to rewrite all image URLs
   * @param {any} data - API response data (object, array, or primitive)
   * @returns {any} - Data with rewritten image URLs
   */
  processImageUrls(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.processImageUrls(item));
    }
    
    if (data && typeof data === 'object') {
      const processed = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if this is an image URL field
        if (typeof value === 'string' && (key.includes('image_url') || key.includes('_image'))) {
          processed[key] = this.rewriteImageUrl(value);
        } else if (typeof value === 'object') {
          processed[key] = this.processImageUrls(value);
        } else {
          processed[key] = value;
        }
      }
      return processed;
    }
    
    return data;
  }

  async fetchMetadata(type) {
    try {
      const url = `${this.baseUrl}/tfd/metadata/${type}?language_code=${this.language}`;
      const { workerApiKey, nexonApiKey } = state.apiKeys;
      
      if (!workerApiKey || !nexonApiKey) {
        throw new Error('API keys are not configured. Please contact the administrator.');
      }

      const response = await fetch(url, {
        headers: {
          'x-worker-api-key': workerApiKey,
          'x-nxopen-api-key': nexonApiKey
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${type}:`, response.status, response.statusText);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please configure your API keys.');
        }
        throw new Error(`Failed to fetch ${type}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process all image URLs to use the cache service
      const processedData = this.processImageUrls(data);
      
      return processedData;
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

  async fetchFellows() {
    return this.fetchMetadata('fellow');
  }

  async fetchVehicles() {
    return this.fetchMetadata('vehicle');
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

  /**
   * Get image element with proper authentication headers using fetch
   * Note: For direct img src usage, the image URLs are already rewritten to cache URLs
   * For advanced usage with authentication in fetch requests:
   * @param {string} imageUrl - Image URL (can be Nexon or cache URL)
   * @returns {Promise<Blob>} - Image blob
   */
  async fetchImage(imageUrl) {
    const { workerApiKey, nexonApiKey } = state.apiKeys;
    
    // Rewrite URL if it's a Nexon URL
    const cacheUrl = this.rewriteImageUrl(imageUrl);
    
    if (!workerApiKey || !nexonApiKey) {
      throw new Error('API keys are not configured. Please contact the administrator.');
    }

    const response = await fetch(cacheUrl, {
      headers: {
        'x-worker-api-key': workerApiKey,
        'x-nxopen-api-key': nexonApiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    return await response.blob();
  }
}

export const apiClient = new TFDApiClient();

/**
 * Helper function to get cache-enabled image URL
 * Use this in templates when you need to display images
 */
export function getImageUrl(imageUrl) {
  return apiClient.rewriteImageUrl(imageUrl);
}
