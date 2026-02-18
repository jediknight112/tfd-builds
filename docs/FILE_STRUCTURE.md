# Project File Structure

```
tfd-builds/
│
├── Configuration
│   ├── package.json              # Dependencies and npm scripts
│   ├── vite.config.js            # Vite dev server & build config
│   ├── tailwind.config.js        # Custom Tailwind theme & colors
│   ├── wrangler.toml             # Cloudflare Workers deployment config
│   ├── .prettierrc               # Prettier code formatting config
│   ├── .prettierignore           # Files to exclude from formatting
│   ├── .gitignore                # Git ignore rules
│   ├── .env.example              # Environment variable template
│   └── Makefile                  # Build shortcuts (make dev, make build)
│
├── Deployment
│   ├── worker.js                 # Cloudflare Worker (serves assets, injects env vars)
│   └── .github/
│       ├── workflows/
│       │   ├── ci.yml            # CI workflow (test + build)
│       │   ├── deploy.yml        # Deploy to Cloudflare Workers
│       │   └── dependabot-auto-merge.yml
│       ├── dependabot.yml        # Dependency update config
│       └── pull_request_template.md
│
├── Documentation
│   ├── README.md
│   ├── CONTRIBUTING.md
│   ├── CODE_OF_CONDUCT.md
│   ├── SECURITY.md
│   ├── LICENSE
│   ├── CLAUDE.md                 # AI context (Claude)
│   ├── GEMINI.md                 # AI context (Gemini)
│   └── docs/
│       ├── QUICKSTART.md         # Quick setup guide
│       ├── DEVELOPMENT.md        # Developer guide & architecture
│       ├── DEPLOYMENT.md         # Deployment guide
│       ├── SECRETS_SETUP.md      # Cloudflare secrets guide
│       ├── API_KEYS_SETUP.md     # API key configuration
│       ├── PROJECT_SUMMARY.md    # Project overview
│       ├── FILE_STRUCTURE.md     # This file
│       ├── CI_SETUP.md           # CI/CD pipeline docs
│       ├── MODULE_SELECTOR_GUIDE.md
│       └── MODULE_SLOT_POSITION_FIX.md
│
├── Tests
│   └── tests/
│       ├── build-serializer.test.js
│       ├── build-serializer-extended.test.js
│       ├── state.test.js
│       ├── config.test.js
│       ├── localization.test.js
│       ├── arche-tuning-logic.test.js
│       └── build-importer.test.js
│
├── Application
│   ├── index.html                # Main HTML entry point
│   └── src/
│       ├── index.js              # Application entry point & orchestration
│       ├── state.js              # Centralized state management
│       ├── api-client.js         # TFD Cache API client
│       ├── config.js             # Configuration constants
│       ├── ui-components.js      # Reusable UI component factories
│       ├── build-serializer.js   # Build URL encoding/decoding (LZ-string)
│       ├── debug-image-loading.js # Image loading utilities
│       ├── modules/
│       │   ├── module-selector.js
│       │   ├── weapon-selector.js
│       │   ├── reactor-selector.js
│       │   ├── external-component-selector.js
│       │   ├── core-selector.js
│       │   ├── custom-stat-selector.js
│       │   ├── arche-tuning.js
│       │   └── build-importer.js
│       └── styles/
│           └── input.css         # Tailwind CSS with custom styles
│
└── Generated (not in repo)
    ├── node_modules/
    ├── dist/
    └── .env
```

## Key Entry Points

**Running locally:** Start with [QUICKSTART.md](QUICKSTART.md)

**Understanding the code:** Read [DEVELOPMENT.md](DEVELOPMENT.md), then explore `src/state.js` and `src/index.js`

**Deploying:** Follow [DEPLOYMENT.md](DEPLOYMENT.md) and [SECRETS_SETUP.md](SECRETS_SETUP.md)
