/**
 * Image Loader Utility
 * Handles loading images through the cache service with proper authentication
 */

import { state } from './state.js';
import { API_BASE_URL } from './config.js';

class ImageLoader {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.nexonImageBaseUrl = 'https://open.api.nexon.com/static/tfd/img/';
    this.cacheImageBaseUrl = `${this.baseUrl}/static/tfd/img/`;
    this.imageCache = new Map(); // In-memory cache for blob URLs
  }

  /**
   * Rewrite Nexon image URLs to use the cache service
   * @param {string} imageUrl - Original image URL
   * @returns {string} - Cache service URL
   */
  rewriteImageUrl(imageUrl) {
    if (!imageUrl) return imageUrl;
    
    if (imageUrl.startsWith(this.nexonImageBaseUrl)) {
      const imageId = imageUrl.replace(this.nexonImageBaseUrl, '');
      return `${this.cacheImageBaseUrl}${imageId}`;
    }
    
    return imageUrl;
  }

  /**
   * Load an image with authentication headers
   * @param {string} imageUrl - Image URL to load
   * @returns {Promise<string>} - Blob URL for the image
   */
  async loadImage(imageUrl) {
    if (!imageUrl) return null;

    // Check in-memory cache first
    if (this.imageCache.has(imageUrl)) {
      return this.imageCache.get(imageUrl);
    }

    const cacheUrl = this.rewriteImageUrl(imageUrl);
    const { workerApiKey, nexonApiKey } = state.apiKeys;

    if (!workerApiKey || !nexonApiKey) {
      console.warn('API keys not set, falling back to direct URL');
      return cacheUrl;
    }

    try {
      const response = await fetch(cacheUrl, {
        headers: {
          'x-worker-api-key': workerApiKey,
          'x-nxopen-api-key': nexonApiKey,
        },
      });

      if (!response.ok) {
        console.error(`Failed to load image: ${response.status}`);
        return cacheUrl; // Fallback to direct URL
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Store in cache
      this.imageCache.set(imageUrl, blobUrl);

      return blobUrl;
    } catch (error) {
      console.error('Error loading image:', error);
      return cacheUrl; // Fallback to direct URL
    }
  }

  /**
   * Set image source with authentication
   * @param {HTMLImageElement} imgElement - Image element to set
   * @param {string} imageUrl - Image URL to load
   * @param {string} alt - Alt text for the image
   */
  async setImageSrc(imgElement, imageUrl, alt = '') {
    if (!imgElement || !imageUrl) return;

    imgElement.alt = alt;
    imgElement.classList.add('loading');

    try {
      const blobUrl = await this.loadImage(imageUrl);
      imgElement.src = blobUrl;
      imgElement.classList.remove('loading');
      
      // Clean up blob URL when image is removed from DOM
      imgElement.addEventListener('load', () => {
        imgElement.classList.add('loaded');
      });
    } catch (error) {
      console.error('Error setting image source:', error);
      imgElement.classList.remove('loading');
      imgElement.classList.add('error');
    }
  }

  /**
   * Create an authenticated image element
   * @param {string} imageUrl - Image URL
   * @param {string} alt - Alt text
   * @param {string} className - CSS classes
   * @returns {Promise<HTMLImageElement>} - Image element with blob URL
   */
  async createImage(imageUrl, alt = '', className = '') {
    const img = document.createElement('img');
    img.alt = alt;
    if (className) {
      img.className = className;
    }

    const blobUrl = await this.loadImage(imageUrl);
    img.src = blobUrl;

    return img;
  }

  /**
   * Preload multiple images
   * @param {string[]} imageUrls - Array of image URLs to preload
   */
  async preloadImages(imageUrls) {
    const promises = imageUrls
      .filter(url => url && !this.imageCache.has(url))
      .map(url => this.loadImage(url));

    await Promise.allSettled(promises);
  }

  /**
   * Clear the image cache
   */
  clearCache() {
    // Revoke all blob URLs to free memory
    for (const blobUrl of this.imageCache.values()) {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    }
    this.imageCache.clear();
  }

  /**
   * Get a direct cache URL (for use in img src when authentication isn't required)
   * Note: This will only work if your cache service allows unauthenticated access
   * @param {string} imageUrl - Original image URL
   * @returns {string} - Cache service URL
   */
  getCacheUrl(imageUrl) {
    return this.rewriteImageUrl(imageUrl);
  }
}

// Export singleton instance
export const imageLoader = new ImageLoader();

/**
 * Helper function for template strings
 * Returns a cache-enabled image URL
 */
export function getImageUrl(imageUrl) {
  return imageLoader.getCacheUrl(imageUrl);
}

/**
 * Helper to create img tag HTML with loading support
 * @param {string} imageUrl - Image URL
 * @param {string} alt - Alt text
 * @param {string} className - CSS classes
 * @returns {string} - HTML string for img tag
 */
export function createImageTag(imageUrl, alt = '', className = '') {
  if (!imageUrl) return '';
  
  const cacheUrl = imageLoader.getCacheUrl(imageUrl);
  return `<img 
    src="${cacheUrl}" 
    alt="${alt}" 
    class="${className} lazy-image"
    loading="lazy"
    data-original-url="${imageUrl}"
  >`;
}
