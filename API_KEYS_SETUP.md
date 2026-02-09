# API Keys Setup Guide

## Quick Fix for 401 Errors

The TFD Build Viewer now requires API keys to authenticate with the TFD Cache API. Follow these steps:

## Option 1: Use the Settings Modal (Easiest)

1. Open the app at `http://localhost:3000`
2. Click the **Settings** button in the top navigation
3. Enter your API keys:
   - **Worker API Key**: From your tfd-cache deployment
   - **Nexon API Key**: From Nexon Open API portal
4. Click **Save & Reload**

Keys are saved in your browser's localStorage.

## Option 2: Environment Variables

Create a `.env` file in the project root:

```env
VITE_WORKER_API_KEY=your_worker_api_key
VITE_NEXON_API_KEY=your_nexon_api_key
```

Then restart the dev server:
```bash
npm run dev
```

## Where to Get API Keys

### 1. Nexon API Key

1. Visit [Nexon Open API Portal](https://openapi.nexon.com/)
2. Sign up or log in
3. Create a new application
4. Copy your API key

### 2. Worker API Key

This is the authentication key for your `tfd-cache` Cloudflare Worker.

**Check your tfd-cache deployment:**

1. Look in your `tfd-cache` repository
2. Check `wrangler.toml` for any API key configuration
3. Or check your Cloudflare Workers dashboard for environment variables

**If you don't have a worker API key set:**

You may need to configure one in your tfd-cache worker. The worker expects the `x-worker-api-key` header.

### Alternative: Public Access

If you control the tfd-cache worker, you could modify it to allow public access (not recommended for production):

In your `tfd-cache/src/index.js`, you could add a bypass for certain endpoints or remove the authentication requirement.

## Testing Your Keys

Once you've added your keys, open the browser console (F12) and you should see:
- ✅ Descendant data loading successfully
- ✅ No 401 errors

If you still get errors:
- Verify your Nexon API key is valid
- Check that your worker API key matches what's expected by tfd-cache
- Look at the browser Network tab to see the request headers

## Environment File (.env)

The `.env` file has been created for you. Edit it with your keys:

```bash
# Edit the .env file
nano .env

# Or with your favorite editor
code .env
```

Add your actual keys:
```env
VITE_WORKER_API_KEY=abc123...
VITE_NEXON_API_KEY=xyz789...
```

**Important**: The `.env` file is already in `.gitignore` so your keys won't be committed to git.

## Troubleshooting

### Still Getting 401 Errors?

1. **Check browser console** - Look for the actual error message
2. **Verify keys are loaded** - In console, type:
   ```javascript
   console.log(state.apiKeys)
   ```
3. **Check Network tab** - Verify headers are being sent
4. **Clear localStorage** - If keys seem stuck:
   ```javascript
   localStorage.clear()
   ```

### Worker API Key Not Set?

If you don't have a worker API key configured in tfd-cache, you may need to:

1. Update your tfd-cache worker to accept a specific key
2. Or modify the authentication logic
3. Or make certain endpoints public

### Need Help?

Check:
- [tfd-cache README](../tfd-cache/README.md) - Worker documentation
- Browser console for detailed error messages
- Network tab to inspect request/response

## Quick Test

After configuring keys, test in browser console:

```javascript
// Check if keys are set
state.apiKeys

// Try loading descendants
await app.loadDescendants()

// Should see descendants array
state.descendants
```

Success! You should see descendant data loading without 401 errors. 🎉
