# Image Caching Integration

## Overview

The TFD Builds app automatically caches all images from the Nexon API through the TFD Cache service. This provides faster load times, reduced API calls, and better performance.

## How It Works

### 1. Automatic URL Rewriting

All image URLs from the Nexon API are automatically rewritten:

**Original URL:**
```
https://open.api.nexon.com/static/tfd/img/d72fa90551e23916f18a81dbd4030d8f
```

**Rewritten to:**
```
https://tfd-cache.jediknight112.com/static/tfd/img/d72fa90551e23916f18a81dbd4030d8f
```

### 2. Authentication

Images are loaded with proper authentication headers:
- `x-worker-api-key`: Your worker API key
- `x-nxopen-api-key`: Your Nexon API key

This happens automatically for all images in the application.

### 3. Components

#### API Client (`src/api-client.js`)

The API client automatically processes all API responses and rewrites image URLs:

```javascript
// Before processing
{
  "descendant_name": "Viessa",
  "descendant_image_url": "https://open.api.nexon.com/static/tfd/img/abc123"
}

// After processing
{
  "descendant_name": "Viessa",
  "descendant_image_url": "https://tfd-cache.jediknight112.com/static/tfd/img/abc123"
}
```

#### Image Interceptor (`src/image-interceptor.js`)

The image interceptor automatically detects and processes images:

1. **Watches for new images** - Uses MutationObserver to detect new `<img>` elements
2. **Fetches with authentication** - Loads images via fetch with API keys
3. **Converts to blob URLs** - Creates blob URLs for secure image display
4. **Caches in memory** - Prevents redundant fetches

### 4. Cache Benefits

**First Request:**
- Fetches from Nexon API
- Caches for 7 days
- Returns: `X-Cache: MISS`
- ~200-500ms load time

**Subsequent Requests:**
- Serves from Cloudflare KV
- Returns: `X-Cache: HIT`  
- ~10-50ms load time ⚡

## Usage in Templates

Images work automatically in all templates:

```javascript
// In your template strings
const html = `
  <img src="${descendant.descendant_image_url}" 
       alt="${descendant.descendant_name}" 
       class="w-full h-full object-cover">
`;
```

The image interceptor will:
1. Detect the image element
2. Fetch with authentication
3. Convert to blob URL
4. Update the image source

## Manual Image Loading

For advanced use cases, you can manually load images:

```javascript
import { imageLoader } from './image-loader.js';

// Load a single image
const blobUrl = await imageLoader.loadImage(imageUrl);
img.src = blobUrl;

// Create an authenticated image element
const img = await imageLoader.createImage(
  imageUrl,
  'Alt text',
  'css-classes'
);
document.body.appendChild(img);

// Preload multiple images
await imageLoader.preloadImages([url1, url2, url3]);
```

## Configuration

Image caching is configured in `src/config.js`:

```javascript
export const API_BASE_URL = 'https://tfd-cache.jediknight112.com';
```

To use a different cache service, update the `API_BASE_URL`.

## Performance

### Before Image Caching
- Every image request → Nexon API
- Multiple images → Multiple API calls
- Slower load times
- API rate limits

### After Image Caching
- First request → Cache service → Nexon API → Cache
- Subsequent requests → Cache service (instant)
- Much faster load times
- Reduced API calls

### Expected Performance

| Metric | Without Cache | With Cache (Miss) | With Cache (Hit) |
|--------|---------------|-------------------|------------------|
| Load Time | 500-1000ms | 200-500ms | 10-50ms |
| API Calls | Every request | First request only | None |
| Data Transfer | Full image | Full image | From edge |

## Troubleshooting

### Images Not Loading

**Check API Keys:**
```javascript
// Open browser console
console.log(state.apiKeys);
```

Make sure both `workerApiKey` and `nexonApiKey` are set.

**Check Network Tab:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "Img"
4. Look for failed requests

### Images Load Slowly

**Cache Miss:**
First load is always slower. Subsequent loads should be fast.

**Check Cache Headers:**
```bash
curl -I "https://tfd-cache.jediknight112.com/static/tfd/img/abc123" \
  -H "x-worker-api-key: YOUR_KEY" \
  -H "x-nxopen-api-key: YOUR_KEY"
```

Look for `X-Cache: HIT` or `X-Cache: MISS`.

### Memory Leaks

The image interceptor automatically manages blob URLs. If you manually create blob URLs:

```javascript
// Always revoke when done
const blobUrl = URL.createObjectURL(blob);
img.src = blobUrl;

// Clean up when image is removed
img.addEventListener('load', () => {
  URL.revokeObjectURL(blobUrl);
});
```

## Architecture

```
┌─────────────────┐
│  TFD Builds App │
└────────┬────────┘
         │
         │ 1. Request image
         │
    ┌────▼──────────────┐
    │ Image Interceptor │
    └────┬──────────────┘
         │
         │ 2. Fetch with auth headers
         │
    ┌────▼──────────────┐
    │  TFD Cache Worker │
    └────┬──────────────┘
         │
         ├─► Cache Hit? → Return from KV
         │
         └─► Cache Miss → Fetch from Nexon
                          ↓
                     Cache in KV
                          ↓
                    Return to app
```

## Files

- `src/api-client.js` - URL rewriting in API responses
- `src/image-interceptor.js` - Automatic image loading with auth
- `src/image-loader.js` - Manual image loading utilities
- `src/config.js` - Configuration

## See Also

- [TFD Cache Image Caching Guide](../../tfd-cache/docs/IMAGE_CACHING.md)
- [API Keys Setup](API_KEYS_SETUP.md)
- [Development Guide](DEVELOPMENT.md)
