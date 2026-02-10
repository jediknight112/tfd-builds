# Image Loading Troubleshooting Guide

## Issue: 401 Errors on Image Requests

### Symptoms
- Images not loading
- 401 errors in Network tab
- Missing authentication headers

### Root Cause
Browsers **cannot send custom headers** with `<img>` tag requests. This is a security limitation.

### Solution
The image interceptor now:
1. ✅ Removes the `src` attribute before the browser tries to load
2. ✅ Fetches the image with authentication headers via `fetch()`
3. ✅ Converts to a blob URL
4. ✅ Sets the blob URL as the image source

## How to Test

### 1. Open the App
```
http://localhost:3001
```

### 2. Configure API Keys
- Click **Settings**
- Enter both API keys
- Click **Save & Reload**

### 3. Check Console
You should see:
```
Initializing image interceptor...
Image interceptor initialized
Image interceptor started
💡 Image loading debug helper loaded. Run debugImageLoading() in console for details.
```

### 4. Run Debug Helper
Open browser console and type:
```javascript
debugImageLoading()
```

Expected output:
```
🔍 Image Loading Debug Info
API Keys Status:
- Worker API Key: ✅ Set
- Nexon API Key: ✅ Set
- Worker Key (first 10 chars): abc1234567...
- Nexon Key (first 10 chars): xyz9876543...

Images on page:
- Total images: 5
- Cache images: 3

Cache images details:
Image 1:
- Current src: blob:http://localhost:3001/abc-123...
- Original URL: https://tfd-cache.jediknight112.com/static/tfd/img/abc123...
- Processed: ✅
- Using blob URL: ✅
```

### 5. Check Network Tab

Open DevTools → Network tab → Filter by "Fetch/XHR"

You should see requests to:
```
tfd-cache.jediknight112.com/static/tfd/img/...
```

With request headers:
```
x-worker-api-key: [your-key]
x-nxopen-api-key: [your-key]
```

And response headers:
```
X-Cache: HIT or MISS
Content-Type: image/png
```

### 6. Load a Descendant

Select any descendant from the list. Watch the console:

```
Fetching authenticated image: https://tfd-cache.jediknight112.com/static/tfd/img/abc123
Image fetch response: {
  url: "https://tfd-cache.jediknight112.com/static/tfd/img/abc123",
  status: 200,
  cacheHeader: "MISS",
  contentType: "image/png"
}
Image loaded successfully: { url: "...", blobUrl: "blob:..." }
```

## Common Issues

### Issue: "API keys not configured"
**Fix:** Make sure both keys are set in Settings

### Issue: Images still showing 401
**Possible causes:**
1. API keys are incorrect
2. API keys not saved properly
3. Cache service requires different authentication

**Debug:**
```javascript
// Check if keys are set
console.log(state.apiKeys);

// Try fetching an image manually
fetch('https://tfd-cache.jediknight112.com/static/tfd/img/test', {
  headers: {
    'x-worker-api-key': state.apiKeys.workerApiKey,
    'x-nxopen-api-key': state.apiKeys.nexonApiKey
  }
}).then(r => console.log('Status:', r.status, 'Headers:', r.headers));
```

### Issue: Images load but very slowly
**Cause:** First load (cache miss) takes longer

**Expected:**
- First load: 200-500ms (fetching from origin)
- Second load: 10-50ms (from cache)

### Issue: Some images work, others don't
**Check:**
1. Are all images going through the cache URL?
2. Check console for specific errors
3. Run `debugImageLoading()` to see which images are processed

## Manual Testing

### Test 1: API Keys
```javascript
// In browser console
console.log('Worker Key:', state.apiKeys.workerApiKey?.substring(0, 10));
console.log('Nexon Key:', state.apiKeys.nexonApiKey?.substring(0, 10));
```

### Test 2: Manual Image Load
```javascript
// Test fetching with authentication
const url = 'https://tfd-cache.jediknight112.com/static/tfd/img/d72fa90551e23916f18a81dbd4030d8f';
const response = await fetch(url, {
  headers: {
    'x-worker-api-key': state.apiKeys.workerApiKey,
    'x-nxopen-api-key': state.apiKeys.nexonApiKey
  }
});
console.log('Status:', response.status);
console.log('Cache:', response.headers.get('x-cache'));
console.log('Type:', response.headers.get('content-type'));
```

### Test 3: Check Interceptor
```javascript
// Check if interceptor is catching images
document.querySelectorAll('img[data-processed="true"]').length
// Should return number of processed images
```

## What to Look For

### ✅ Working Correctly
- Console: "Image loaded successfully"
- Network: 200 status on fetch requests (not img requests)
- Images: Using blob URLs (blob:http://...)
- Headers: Present in fetch requests

### ❌ Not Working
- Console: "Failed to fetch image: 401"
- Network: 401 errors
- Images: Still using cache URLs directly
- Headers: Missing in requests

## Next Steps

If still having issues:

1. **Verify cache service is working:**
   ```bash
   curl -I "https://tfd-cache.jediknight112.com/" \
     -H "x-worker-api-key: YOUR_KEY"
   ```

2. **Check if CORS is configured:**
   The cache service should return:
   ```
   Access-Control-Allow-Origin: *
   ```

3. **Verify API keys are correct:**
   - Worker key should be from your tfd-cache deployment
   - Nexon key should be from openapi.nexon.com

4. **Check browser console for errors:**
   - Look for any JavaScript errors
   - Check for CORS errors
   - Look for authentication errors
