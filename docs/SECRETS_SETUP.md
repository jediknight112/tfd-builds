# Cloudflare Workers Secrets Setup

## Required Secrets

The tfd-builds Worker requires two secrets to be configured in Cloudflare Workers:

### 1. TFD_API_KEY

Your Nexon TFD API key for accessing The First Descendant API.

### 2. WORKER_API_KEY

Your Worker API key for accessing the tfd-cache worker API.

## Setting Secrets

You need to set these secrets **once** using the Wrangler CLI:

```bash
# Navigate to the project directory
cd tfd-builds

# Install dependencies (if not already done)
npm install

# Set TFD_API_KEY secret
npx wrangler secret put TFD_API_KEY
# When prompted, paste your TFD API key and press Enter

# Set WORKER_API_KEY secret
npx wrangler secret put WORKER_API_KEY
# When prompted, paste your Worker API key and press Enter
```

## Verifying Secrets

To list all configured secrets (without showing their values):

```bash
npx wrangler secret list
```

## Updating Secrets

To update a secret, simply run the `put` command again with the same name:

```bash
npx wrangler secret put TFD_API_KEY
# Enter new value
```

## Deleting Secrets

To remove a secret:

```bash
npx wrangler secret delete TFD_API_KEY
```

## How Secrets Work

1. **Server-side**: Secrets are stored securely in Cloudflare and available to the Worker via `env.TFD_API_KEY` and `env.WORKER_API_KEY`

2. **Client-side**: The Worker injects these secrets into the HTML as `window.__ENV__` object, making them available to your JavaScript code

3. **Priority**: The application checks for secrets in this order:
   - Server-injected `window.__ENV__` (production)
   - Vite environment variables `import.meta.env.VITE_*` (development)
   - localStorage (fallback for manual entry)

## Security Notes

- ✅ Secrets are encrypted and never stored in Git
- ✅ Secrets are only accessible to your Cloudflare Worker
- ✅ GitHub Actions doesn't need these secrets (they're managed by Cloudflare)
- ⚠️ Secrets are exposed to the browser in production - only use API keys that are safe for client-side usage

## GitHub Secrets (Different from Worker Secrets)

The GitHub Actions workflow requires these secrets (already configured in your repository settings):

- `CLOUDFLARE_API_TOKEN` - For deploying to Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

These are **separate** from the Worker secrets and are used for deployment automation, not runtime configuration.
