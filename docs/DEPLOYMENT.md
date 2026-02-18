# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Cloudflare account with Workers enabled

## Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Test worker locally with built assets
npm run dev:worker
```

## Cloudflare Workers Deployment

### Initial Setup

This project is configured to deploy to Cloudflare Workers at `tfd-builds.jediknight112.com`.

### Required GitHub Secrets

Set up the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

1. **`CLOUDFLARE_API_TOKEN`** - Cloudflare API token with Workers permissions
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions: Account.Workers Scripts (Edit), Account.Workers KV Storage (Edit)

2. **`CLOUDFLARE_ACCOUNT_ID`** - Your Cloudflare account ID
   - Find at: https://dash.cloudflare.com/ (in the URL or sidebar)

### Required Cloudflare Worker Secrets

The application requires two environment variables that must be set as Cloudflare Worker secrets:

```bash
# Using Wrangler CLI (after installing dependencies)
npx wrangler secret put TFD_API_KEY
# Enter your TFD API key when prompted

npx wrangler secret put WORKER_API_KEY
# Enter your Worker API key when prompted
```

These secrets will be available to your application via `window.__ENV__` object in the browser.

### Automated Deployment (Recommended)

The project uses GitHub Actions for CI/CD:

1. **Push to main branch** - Triggers CI tests
2. **If tests pass** - Automatically deploys to Cloudflare Workers
3. **Live at** - `https://tfd-builds.jediknight112.com`

The deployment workflow:

- Runs after successful CI tests
- Builds the Vite project
- Deploys to Cloudflare Workers with custom domain
- Injects environment variables into the HTML

### Manual Deployment

```bash
# Build and deploy
npm run deploy

# Or separately
npm run build
npx wrangler deploy
```

### Deployment Architecture

The project uses Cloudflare Workers to serve static assets with the following features:

1. **Static Asset Serving** - All Vite-built files are served from Workers
2. **Environment Variable Injection** - Server-side injection of secrets into HTML
3. **Smart Caching** - Different cache policies for HTML vs. static assets
4. **Custom Domain** - Configured for `tfd-builds.jediknight112.com`

### Configuration Files

- **`wrangler.toml`** - Cloudflare Workers configuration
- **`worker.js`** - Worker script for serving assets and injecting env vars
- **`.github/workflows/deploy.yml`** - Deployment workflow
- **`.github/workflows/ci.yml`** - CI testing workflow

## Troubleshooting

**Build Errors**

```bash
rm -rf node_modules dist
npm install
npm run build
```

**API CORS Errors**

- Verify API base URL is correct in `wrangler.toml`
- Check that the tfd-cache worker allows requests from your domain

**Environment Variables Not Available**

1. Verify Worker secrets are set: `npx wrangler secret list`
2. Check browser console: `window.__ENV__` should contain your keys
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Rollback**

Cloudflare Workers keeps previous deployments. You can also rollback via git:

```bash
git revert HEAD
git push origin main
```

## Forking This Project

If you fork this repository and want to deploy your own instance:

1. Set up a Cloudflare account with Workers enabled
2. Update `wrangler.toml` with your own domain and zone
3. Update `src/config.js` with your API base URL
4. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to your GitHub repo secrets
5. Set Worker secrets: `npx wrangler secret put TFD_API_KEY` and `WORKER_API_KEY`

For local development, copy `.env.example` to `.env` and add your API keys.
