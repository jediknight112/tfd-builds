/**
 * Debug Helper for Image Loading
 * Open browser console and run: debugImageLoading()
 */

import { state } from './state.js';

window.debugImageLoading = function() {
  console.group('🔍 Image Loading Debug Info');
  
  // Check API keys
  console.log('API Keys Status:');
  console.log('- Worker API Key:', state.apiKeys.workerApiKey ? '✅ Set' : '❌ Missing');
  console.log('- Nexon API Key:', state.apiKeys.nexonApiKey ? '✅ Set' : '❌ Missing');
  
  if (state.apiKeys.workerApiKey) {
    console.log('- Worker Key (first 10 chars):', state.apiKeys.workerApiKey.substring(0, 10) + '...');
  }
  if (state.apiKeys.nexonApiKey) {
    console.log('- Nexon Key (first 10 chars):', state.apiKeys.nexonApiKey.substring(0, 10) + '...');
  }
  
  // Check images on page
  const allImages = document.querySelectorAll('img');
  const cacheImages = Array.from(allImages).filter(img => {
    const src = img.getAttribute('src') || '';
    return src.includes('tfd-cache') || src.includes('open.api.nexon.com');
  });
  
  console.log('\nImages on page:');
  console.log('- Total images:', allImages.length);
  console.log('- Cache images:', cacheImages.length);
  
  if (cacheImages.length > 0) {
    console.log('\nCache images details:');
    cacheImages.forEach((img, i) => {
      const src = img.getAttribute('src') || '';
      const originalUrl = img.dataset.originalUrl || '';
      const processed = img.dataset.processed || '';
      const isBlob = src.startsWith('blob:');
      
      console.log(`\nImage ${i + 1}:`);
      console.log('- Current src:', src.substring(0, 80) + '...');
      console.log('- Original URL:', originalUrl.substring(0, 80) + '...');
      console.log('- Processed:', processed === 'true' ? '✅' : '❌');
      console.log('- Using blob URL:', isBlob ? '✅' : '❌');
      console.log('- Has loading class:', img.classList.contains('loading-image'));
      console.log('- Has loaded class:', img.classList.contains('loaded-image'));
    });
  }
  
  console.groupEnd();
  
  return {
    hasWorkerKey: !!state.apiKeys.workerApiKey,
    hasNexonKey: !!state.apiKeys.nexonApiKey,
    totalImages: allImages.length,
    cacheImages: cacheImages.length,
    images: cacheImages
  };
};

// Auto-run on load
console.log('💡 Image loading debug helper loaded. Run debugImageLoading() in console for details.');
