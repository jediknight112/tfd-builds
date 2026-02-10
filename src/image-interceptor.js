/**
 * Image Interceptor
 * Automatically intercepts and authenticates image requests
 * This script should be loaded early in your application
 */

import { state } from './state.js';
import { API_BASE_URL } from './config.js';

const NEXON_IMAGE_BASE = 'https://open.api.nexon.com/static/tfd/img/';
const CACHE_IMAGE_BASE = `${API_BASE_URL}/static/tfd/img/`;

// Store for blob URLs to prevent memory leaks
const blobUrlCache = new Map();

/**
 * Rewrite image URL to use cache service
 */
function rewriteImageUrl(url) {
  if (!url) return url;
  if (url.startsWith(NEXON_IMAGE_BASE)) {
    const imageId = url.replace(NEXON_IMAGE_BASE, '');
    return `${CACHE_IMAGE_BASE}${imageId}`;
  }
  return url;
}

/**
 * Fetch image with authentication headers
 */
async function fetchAuthenticatedImage(url) {
  const { workerApiKey, nexonApiKey } = state.apiKeys;

  if (!workerApiKey || !nexonApiKey) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'x-worker-api-key': workerApiKey,
        'x-nxopen-api-key': nexonApiKey,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  } catch (error) {
    console.error('Image loading error:', error.message);
    return null;
  }
}

/**
 * Process an image element to use authenticated loading
 */
async function processImage(img) {
  const originalSrc = img.getAttribute('src') || img.dataset.originalUrl;
  if (!originalSrc) return;

  // Skip if already processed
  if (img.dataset.processed) return;
  img.dataset.processed = 'true';

  // Check if it's a cache URL that needs authentication
  const needsAuth = originalSrc.includes('tfd-cache') || originalSrc.includes('open.api.nexon.com');
  if (!needsAuth) return;

  const cacheUrl = rewriteImageUrl(originalSrc);

  // Store original src
  if (!img.dataset.originalUrl) {
    img.dataset.originalUrl = originalSrc;
  }

  // Check cache first
  if (blobUrlCache.has(cacheUrl)) {
    img.src = blobUrlCache.get(cacheUrl);
    return;
  }

  // Clear src to prevent unauthorized loading
  img.removeAttribute('src');
  
  // Add loading state
  img.classList.add('loading-image');
  img.alt = img.alt || 'Loading...';

  // Fetch with authentication
  const blobUrl = await fetchAuthenticatedImage(cacheUrl);

  if (blobUrl) {
    blobUrlCache.set(cacheUrl, blobUrl);
    img.src = blobUrl;
    img.classList.remove('loading-image');
    img.classList.add('loaded-image');
  } else {
    // Fallback: try without auth (might work if cache allows it)
    img.src = cacheUrl;
    img.classList.remove('loading-image');
  }
}

/**
 * Initialize image interceptor
 * Watches for new images and processes them
 */
export function initImageInterceptor() {
  // Process existing images
  document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && (src.includes('tfd-cache') || src.includes('open.api.nexon.com'))) {
      processImage(img);
    }
  });

  // Watch for new images using MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check for added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'IMG') {
          const src = node.getAttribute('src');
          if (src && (src.includes('tfd-cache') || src.includes('open.api.nexon.com'))) {
            processImage(node);
          }
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && (src.includes('tfd-cache') || src.includes('open.api.nexon.com'))) {
              processImage(img);
            }
          });
        }
      });

      // Check for attribute changes on img elements
      if (mutation.type === 'attributes' && mutation.target.nodeName === 'IMG') {
        if (mutation.attributeName === 'src') {
          const src = mutation.target.getAttribute('src');
          if (src && (src.includes('tfd-cache') || src.includes('open.api.nexon.com'))) {
            // Reset processed flag if src changed
            mutation.target.dataset.processed = '';
            processImage(mutation.target);
          }
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  // Return cleanup function
  return () => {
    observer.disconnect();
    // Revoke all blob URLs
    for (const blobUrl of blobUrlCache.values()) {
      URL.revokeObjectURL(blobUrl);
    }
    blobUrlCache.clear();
  };
}

/**
 * Manually process images (useful after dynamic content load)
 */
export function processImages() {
  document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && (src.includes('tfd-cache') || src.includes('open.api.nexon.com'))) {
      processImage(img);
    }
  });
}

/**
 * Helper function to get rewritten image URL for templates
 */
export function getCachedImageUrl(url) {
  return rewriteImageUrl(url);
}
