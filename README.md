# TFD Build Viewer

A modern web application for viewing and planning character builds for **The First Descendant** video game.

## Features

- 🎮 **Descendant Selection** - Choose from all available descendants with visual cards
- 🔧 **Module Management** - Configure up to 12 descendant modules with interactive selectors
- ⚔️ **Weapon Loadouts** - Equip and configure 3 weapons with:
  - 10 module slots per weapon
  - 4 customizable base stats
  - 5 core stats with selectable options
- ⚡ **Reactor Configuration** - Select reactor and configure additional stats
- 🎯 **External Components** - Add and manage 4 external component types with core stats
- 🔬 **Arche Tuning** - Configure Arche tuning boards and node selections
- 🔗 **Build Sharing** - Share builds via compressed URL parameters
- 💾 **Build Serialization** - Automatic save/load with LZ-string compression
- 📊 **Complete Data Loading** - Loads all game metadata (descendants, modules, weapons, reactors, etc.)
- 🖼️ **Image Caching** - Automatic image caching through TFD Cache service with authentication
- 🔐 **API Key Management** - Configurable API keys via UI or environment variables

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS v4 with custom gaming theme
- **Build Tool**: Vite
- **API**: TFD Cache API (Cloudflare Workers)
- **Icons**: Heroicons (inline SVG)

## Project Structure

```
tfd-builds/
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── .prettierrc             # Prettier code formatting config
├── tests/                  # Test files (Vitest)
├── docs/                   # Project documentation
└── src/
    ├── index.js            # Main application entry point
    ├── state.js            # Global state management
    ├── api-client.js       # API client for TFD Cache
    ├── config.js           # Configuration and constants
    ├── ui-components.js    # Reusable UI components
    ├── build-serializer.js # Build URL encoding/decoding
    ├── debug-image-loading.js # Image loading utilities
    ├── modules/            # Feature modules
    │   ├── module-selector.js
    │   ├── weapon-selector.js
    │   ├── reactor-selector.js
    │   ├── external-component-selector.js
    │   ├── core-selector.js
    │   ├── custom-stat-selector.js
    │   └── arche-tuning.js
    └── styles/
        └── input.css       # Tailwind CSS input file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **API Keys** (Required for data access):
  - Nexon API Key from [openapi.nexon.com](https://openapi.nexon.com/)
  - Worker API Key from your tfd-cache deployment

### Installation

1. Navigate to the project directory:

```bash
cd tfd-builds
```

2. Install dependencies:

```bash
npm install
```

3. **Configure API Keys** (Choose one method):

   **Method A: Using the Settings UI** (Easiest)
   - Start the app: `npm run dev`
   - Click **Settings** button in the top navigation
   - Enter your API keys
   - Click **Save & Reload**

   **Method B: Using Environment Variables**
   - Copy `.env.example` to `.env`
   - Edit `.env` and add your actual API keys:
     ```env
     VITE_WORKER_API_KEY=your_worker_api_key
     VITE_NEXON_API_KEY=your_nexon_api_key
     ```

4. Start the development server:

```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`

**See [docs/API_KEYS_SETUP.md](docs/API_KEYS_SETUP.md) for detailed instructions on obtaining API keys.**

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:worker` - Test Cloudflare Worker locally (after building)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Check code formatting
- `npm run format` - Auto-format code with Prettier
- `make install` - Install dependencies (alternative)
- `make dev` - Start dev server (alternative)

## Deployment

The app is automatically deployed to **Cloudflare Workers** at:

- **Production URL**: `https://tfd-builds.jediknight112.com`

### Automated Deployment

The project uses GitHub Actions for continuous deployment:

1. Push changes to `main` branch
2. CI tests run automatically
3. If tests pass, deployment triggers automatically
4. Site is live within minutes

### Manual Deployment

```bash
# Build and deploy
npm run deploy

# Or use wrangler directly
npx wrangler deploy
```

### Secrets Setup

The application requires two secrets to be configured in Cloudflare Workers:

```bash
# Set secrets (one-time setup)
npx wrangler secret put TFD_API_KEY
npx wrangler secret put WORKER_API_KEY
```

**See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) for complete deployment instructions.**

## Data Structure

### Descendant Build

Each descendant build consists of:

- **12 Module Slots** - Enhance descendant abilities
- **3 Weapon Slots** - Each weapon has:
  - 10 module slots
  - 4 base stats
  - 5 core stats
- **1 Reactor** - Power source configuration
- **External Components** - Additional equipment
- **Arche Tuning** - Special ability modifications
- **Fellow** - Companion configuration
- **Vehicle** - Transportation setup
- **Inversion Reinforcement** - Advanced modifications

## API Integration

This app connects to the TFD Cache API:

- **Base URL**: `https://tfd-cache.jediknight112.com`
- **Endpoints**:
  - `/tfd/metadata/descendant` - Get descendant data
  - `/tfd/metadata/module` - Get module data
  - `/tfd/metadata/weapon` - Get weapon data
  - `/tfd/metadata/reactor` - Get reactor data
  - `/tfd/metadata/external-component` - Get external component data

## Customization

### Theme Colors

Edit tailwind.config.js to customize the color scheme:

- `tfd-primary`: Main accent color (cyan)
- `tfd-secondary`: Secondary accent (orange)
- `tfd-dark`: Dark background
- `tfd-accent`: Purple accent

### API Configuration

Edit the API base URL in [src/config.js](src/config.js):

```javascript
export const API_BASE_URL = 'https://your-api-url.com';
```

## Development Roadmap

- [x] Basic project setup with Vite + Tailwind
- [x] Descendant selection UI
- [x] Module slot system
- [x] Weapon cards with stats
- [x] Tab navigation
- [x] Module selector modal
- [x] Weapon selector modal
- [x] Reactor selector
- [x] External component selector
- [x] Core selector system
- [x] Custom stat selector
- [x] Arche Tuning configuration
- [x] Build serialization (save/load)
- [x] Build sharing (URL-based with compression)
- [x] CI/CD with GitHub Actions
- [x] Testing infrastructure (Vitest)
- [x] Code formatting (Prettier)
- [ ] Build comparison
- [ ] Stat calculations and totals
- [ ] Build templates/presets
- [ ] Mobile responsive improvements
- [ ] Dark/light theme toggle

## Related Projects

- **[tfd-cache](https://github.com/jediknight112/tfd-cache)** - Cloudflare Workers cache for TFD API data
- **[jedishell-tools/tfd](https://github.com/jediknight112/jedishell-tools)** - Go CLI tool for TFD API

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Acknowledgments

- Data provided by Nexon's The First Descendant API
- Built with ❤️ for the TFD community
