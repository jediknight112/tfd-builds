# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development environment (Frontend + Backend)
npm run dev
```

Visit `http://localhost:3000` to see the app. The backend worker runs concurrently on port 8787.

## Architecture Overview

### Modular Design

The app uses a modular class-based architecture with separation of concerns:

- **state.js** - Centralized global state management
- **api-client.js** - API communication layer
- **ui-components.js** - Reusable UI component factory
- **build-serializer.js** - Build save/load/share with LZ-string compression
- **modules/** - Feature-specific modules for each section
- **index.js** - Main application orchestration
- **worker.js** - Cloudflare Worker (backend logic + URL shortener)

### State Management

The `state` object (from state.js) holds all application state:

```javascript
export const state = {
  // API Configuration
  apiKeys: { workerApiKey, nexonApiKey },

  // Game Data
  descendants: [],
  modules: [],
  weapons: [],
  reactors: [],
  externalComponents: [],
  archeTuningNodes: [],
  archeTuningBoards: [],
  // ... more metadata arrays

  // Current State
  currentDescendant: null,
  currentBuild: {
    descendantModules: [],
    triggerModule: null,
    weapons: [],
    reactor: null,
    reactorAdditionalStats: [],
    externalComponents: {},
    archeTuning: null,
  },
  currentTab: 'modules',
};
```

### API Client

- `apiClient` (TFDApiClient class) handles all API requests
- Connects to TFD Cache API at `https://tfd-cache.jediknight112.com`
- Fetches metadata for descendants, modules, weapons, etc.
- Handles authentication with Worker API Key and Nexon API Key

### Feature Modules

Each major feature has its own module in `src/modules/`:

- **ModuleSelector** - Descendant module selection (12 slots with Skill/Sub/Main restrictions)
- **WeaponSelector** - Weapon selection and configuration
- **ReactorSelector** - Reactor selection
- **ExternalComponentSelector** - External component management (4 types)
- **CoreSelector** - Core stat selection system
- **CustomStatSelector** - Custom stat configuration
- **ArcheTuning** - Multi-board arche tuning (3 boards per build, hex grid)
- **BuildImporter** - Import builds from Nexon API via username lookup

### UI Components

- `UIComponents` class provides static factory methods for UI elements
- Components include cards, slots, modals, and interactive elements
- All components are vanilla JavaScript DOM manipulation

### Build Serialization

- `BuildSerializer` class handles encoding/decoding builds
- Uses LZ-string compression for URL-safe sharing
- Stores minimal IDs (not full objects) for efficiency
- Automatic localStorage backup

### Application Flow

1. App initializes and loads all metadata in parallel
2. User selects a descendant
3. Build interface appears with tabs for different sections
4. User configures modules, weapons, reactor, etc.
5. Build auto-saves to localStorage
6. User can share build via URL (compressed)
7. Build can be loaded from URL parameters

## File Structure

```
src/
├── index.js                  # Main application entry point & orchestration
├── state.js                  # Centralized state management
├── api-client.js             # TFD Cache API client
├── config.js                 # Configuration constants
├── ui-components.js          # Reusable UI component factory
├── build-serializer.js       # Build encoding/decoding with compression
├── debug-image-loading.js    # Image loading utilities
├── modules/                  # Feature modules
│   ├── module-selector.js    # Descendant module selection
│   ├── weapon-selector.js    # Weapon selection
│   ├── reactor-selector.js   # Reactor configuration
│   ├── external-component-selector.js
│   ├── core-selector.js      # Core stat selection
│   ├── custom-stat-selector.js
│   ├── arche-tuning.js       # Multi-board arche tuning
│   └── build-importer.js     # Import builds from Nexon API
└── styles/
    └── input.css             # Tailwind CSS with custom styles
```

## Key Classes and Modules

### state (state.js)

Centralized state object managing all application state:

- Game metadata (descendants, modules, weapons, etc.)
- Current descendant and build configuration
- API keys and settings
- Helper methods: `buildStatLookup()`, `buildWeaponTypeLookup()`, etc.

### apiClient (api-client.js)

Handles API communication:

- `fetchMetadata(type)` - Generic metadata fetcher with auth headers
- `fetchDescendants()` - Fetch descendant data
- `fetchModules()` - Fetch module data
- `fetchWeapons()` - Fetch weapon data
- Includes authentication with API keys

### UIComponents (ui-components.js)

Static factory methods for creating UI elements:

- `showLoading()`, `hideLoading()` - Loading state management
- `showError(message)` - Error display
- `createModal()` - Modal dialog factory
- Component rendering helpers

### BuildSerializer (build-serializer.js)

Handles build persistence and sharing:

- `serialize()` - Convert build to minimal JSON (IDs only)
- `compress(buildData)` - LZ-string compression for URL sharing
- `decompress(compressedString)` - Decompress from URL
- `deserialize(buildData)` - Reconstruct build from IDs
- `saveToLocalStorage()` - Automatic backup
- `loadFromLocalStorage()` - Restore last build

### Application (index.js)

Main application orchestration:

- `init()` - Initialize app, load all metadata, check for URL builds
- `createNewBuild()` - Reset to new build
- Feature module instances (ModuleSelector, WeaponSelector, etc.)

## Adding New Features

### Adding a New Tab

1. Add tab button in `index.html`:

```html
<button class="tab" data-tab="mytab" onclick="app.switchTab('mytab')">
  My Tab
</button>
```

2. Add tab content section:

```html
<div id="tab-mytab" class="tab-content hidden">
  <!-- Your content here -->
</div>
```

3. Add rendering logic in `Application` class:

```javascript
renderMyTab() {
  const container = document.getElementById('mytab-content');
  // Render your content
}
```

### Adding a New API Endpoint

1. Add method to `TFDApiClient`:

```javascript
async getMyData() {
  return this.fetchMetadata('my-data-type');
}
```

2. Add data to `AppState`:

```javascript
this.myData = [];
```

3. Load data in `Application.init()`:

```javascript
const myData = await apiClient.getMyData();
state.myData = myData;
```

## Styling

### Tailwind CSS

The app uses Tailwind CSS with custom configurations:

- Custom color palette in `tailwind.config.js`
- Gaming-themed colors (cyan, orange, purple)
- Neon glow effects with custom shadow utilities

### Custom Components

Pre-defined component classes in `input.css`:

- `.card` - Standard card component
- `.module-slot` - Module slot styling
- `.weapon-card` - Weapon card styling
- `.btn-primary`, `.btn-secondary` - Button styles

### Adding Custom Styles

Add new utilities in the `@layer utilities` section of `input.css`:

```css
@layer utilities {
  .my-custom-class {
    @apply bg-tfd-dark border border-tfd-primary;
  }
}
```

## Testing

### Unit Tests (Vitest)

The project uses Vitest for unit testing:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Tests are located in `tests/` directory.

### Code Formatting (Prettier)

```bash
# Check code formatting
npm run lint

# Auto-fix formatting issues
npm run format
```

### CI/CD

GitHub Actions automatically runs tests on:

- Pull requests to main
- Pushes to main branch

Workflow file: `.github/workflows/ci.yml`

### Manual Testing

1. Start dev server: `npm run dev`
2. Open browser console for debugging
3. Test descendant selection
4. Test module/weapon selectors
5. Test build save/load from URL
6. Test API key configuration

### Testing API Integration

```javascript
// In browser console
await apiClient.fetchDescendants();
await apiClient.fetchModules();

// Test build serialization
app.buildSerializer.serialize();
```

## Build & Deploy

### Production Build

```bash
npm run build
```

Output goes to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deployment

The app deploys to **Cloudflare Workers** via GitHub Actions. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

```bash
npm run deploy
```

## Common Tasks

### Update Dependencies

```bash
npm update
```

### Add New Dependency

```bash
npm install package-name
```

### Clear Cache & Rebuild

```bash
rm -rf node_modules dist
npm install
npm run build
```

## Troubleshooting

### Tailwind CSS Not Updating

1. Kill dev server
2. Delete `src/styles/output.css` if it exists
3. Restart dev server

### API Errors

- Check browser console for error messages
- Verify API endpoint is accessible
- Check CORS headers if testing locally

### Build Errors

- Clear `node_modules` and reinstall
- Check Node.js version (need 18+)
- Verify all imports are correct

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TFD API Documentation](https://openapi.nexon.com/game/tfd/)
- [MDN Web Docs](https://developer.mozilla.org/)
