# TFD Build Planner

[![CI](https://github.com/jediknight112/tfd-builds/actions/workflows/ci.yml/badge.svg)](https://github.com/jediknight112/tfd-builds/actions/workflows/ci.yml)
[![Deploy](https://github.com/jediknight112/tfd-builds/actions/workflows/deploy.yml/badge.svg)](https://github.com/jediknight112/tfd-builds/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

A web application for creating, viewing, and sharing character builds for **The First Descendant**.

**Live site**: [tfd-builds.jediknight112.com](https://tfd-builds.jediknight112.com)

## Features

- **Descendant Selection** - Browse and select from all available descendants
- **Module Management** - Configure 12 descendant modules with filtering by tier, class, and socket type
- **Weapon Loadouts** - Equip 3 weapons, each with 10 module slots, 4 custom stats, and 5 core stats
- **Reactor Configuration** - Select reactor and configure additional stats
- **External Components** - Manage 4 component types (Auxiliary Power, Sensor, Memory, Processor) with core stats
- **Arche Tuning** - Configure up to 3 independent tuning boards per build with a hex-grid node selector
- **Build Import** - Import your current in-game build by entering your Nexon username
- **Build Sharing** - Share builds via **short links** (e.g., `/s/AbCdEf`)
- **Multi-language** - Supports 12 languages (EN, DE, ES, FR, IT, JA, KO, PL, PT, RU, ZH-CN, ZH-TW)
- **Mobile Responsive** - Full-screen modals, bottom action bar, and touch-friendly controls on mobile

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+) -- no frameworks
- **Styling**: Tailwind CSS v4 with a custom gaming theme
- **Build Tool**: Vite
- **Testing**: Vitest
- **Deployment**: Cloudflare Workers
- **Backend**: [tfd-cache](https://github.com/jediknight112/tfd-cache) (Cloudflare Workers API proxy/cache)

## Getting Started

### Prerequisites

- Node.js 18+
- API keys (set as Worker secrets, NOT in the browser):
  - **Nexon API Key** from [openapi.nexon.com](https://openapi.nexon.com/)
  - **Worker API Key** from your [tfd-cache](https://github.com/jediknight112/tfd-cache) deployment

### Setup

```bash
npm install
npm run dev
```

The browser never sees the keys. The deployed Worker proxies `/api/tfd/*` to tfd-cache and adds the auth headers server-side. Set the secrets with:

```bash
npx wrangler secret put TFD_API_KEY
npx wrangler secret put WORKER_API_KEY
```

For local dev, put the same values in `.dev.vars` (gitignored). See [docs/API_KEYS_SETUP.md](docs/API_KEYS_SETUP.md) for detailed instructions.

## Scripts

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start dev server with hot reload       |
| `npm run build`  | Build for production                   |
| `npm test`       | Run tests                              |
| `npm run format` | Auto-format code with Prettier         |
| `npm run deploy` | Build and deploy to Cloudflare Workers |

## Project Structure

```
tfd-builds/
├── index.html              # Main HTML file (no inline event handlers — uses data-action)
├── worker.js               # Cloudflare Worker entry: serves SPA, injects CSP nonce
├── worker-handlers.js      # Pure handler logic (proxy / shorten / redirect) — unit-testable
├── wrangler.toml           # Cloudflare deployment config
├── scripts/
│   └── ensure-dist.js      # predev: builds dist/ on first clone so wrangler dev starts cleanly
├── tests/                  # Test files (Vitest)
├── docs/                   # Documentation
└── src/
    ├── index.js            # Application entry + global event delegation for data-action
    ├── state.js            # Centralized state management
    ├── api-client.js       # API client (calls /api/tfd/* on this Worker, no auth headers)
    ├── config.js           # Configuration and constants
    ├── ui-components.js    # Reusable UI component factories
    ├── build-serializer.js # Build URL encoding/decoding (LZ-string, with size + shape caps)
    └── modules/
        ├── module-selector.js
        ├── weapon-selector.js
        ├── reactor-selector.js
        ├── external-component-selector.js
        ├── core-selector.js
        ├── custom-stat-selector.js
        ├── arche-tuning.js
        └── build-importer.js
```

## Deployment

Pushes to `main` trigger automatic deployment via GitHub Actions:

1. CI runs tests and build
2. On success, deploys to Cloudflare Workers

For manual deployment: `npm run deploy`

Cloudflare Worker secrets (one-time setup — required, not optional):

```bash
npx wrangler secret put TFD_API_KEY
npx wrangler secret put WORKER_API_KEY
```

The Worker uses these to proxy `/api/tfd/*` requests to tfd-cache. Without them, the SPA gets 500 errors from its own backend and shows no game data.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full details.

## Related Projects

- **[tfd-cache](https://github.com/jediknight112/tfd-cache)** - Cloudflare Workers API proxy and cache for Nexon TFD data
- **[jedishell-tools](https://github.com/jediknight112/jedishell-tools)** - Go CLI tools including a TFD API client

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Acknowledgments

- Game data provided by [Nexon's The First Descendant API](https://openapi.nexon.com/)
- Built for the TFD community

## Support

If you find this project useful, consider buying me a coffee!

<a href="https://buymeacoffee.com/jediknight112" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="180"></a>
