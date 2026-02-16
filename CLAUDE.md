# Claude Context Guide for TFD-Builds

This document provides essential context for Claude to effectively assist with development tasks in the TFD-Builds project.

## Project Overview

**TFD-Builds** is a modern web application for creating, viewing, and sharing character builds for "The First Descendant" video game. It's a single-page application (SPA) built with vanilla JavaScript that allows players to:

- Select descendants (playable characters)
- Configure descendant modules (12 slots)
- Equip and customize weapons (3 weapons, each with 10 modules + stats)
- Configure reactors with additional stats
- Add external components with core stats
- Set up Arche Tuning boards and nodes
- Share builds via compressed URL parameters

### Companion Service

This project relies on **tfd-cache** (a separate repository in this workspace) which is a Cloudflare Workers-based caching service that:

- Proxies and caches data from the Nexon API
- Caches game asset images
- Requires API authentication (Worker API Key + Nexon API Key)

## Tech Stack & Architecture

### Core Technologies

- **Vanilla JavaScript (ES6+)**: No frameworks - intentionally uses modern browser APIs
- **Vite**: Development server and build tool
- **Tailwind CSS v4**: Utility-first styling with custom gaming theme
- **Vitest**: Unit testing framework
- **Cloudflare Workers**: Deployment platform (Pages)
- **LZ-String**: URL compression for build sharing

### Architecture Pattern

- **Modular SPA**: Feature-based modules in `src/modules/`
- **Centralized State**: All state managed in `src/state.js`
- **Component Factory**: UI components created via functions in `src/ui-components.js`
- **API Client**: All backend communication through `src/api-client.js`
- **No Virtual DOM**: Direct DOM manipulation using modern browser APIs

## File Structure & Key Files

### Entry Points

- **[index.html](index.html)**: Main HTML with gaming-themed structure
- **[src/index.js](src/index.js)**: Application bootstrap and orchestration

### Core Application Files

- **[src/state.js](src/state.js)**: Global state management - THE source of truth for all application data
- **[src/api-client.js](src/api-client.js)**: API communication layer with tfd-cache service
- **[src/config.js](src/config.js)**: Configuration constants and API settings
- **[src/ui-components.js](src/ui-components.js)**: Factory functions for reusable UI elements
- **[src/build-serializer.js](src/build-serializer.js)**: Build encoding/decoding with compression
- **[src/debug-image-loading.js](src/debug-image-loading.js)**: Image loading utilities

### Feature Modules (`src/modules/`)

Each module is self-contained and handles a specific feature:

- **[module-selector.js](src/modules/module-selector.js)**: Descendant module selection (12 slots)
- **[weapon-selector.js](src/modules/weapon-selector.js)**: Weapon selection and configuration
- **[reactor-selector.js](src/modules/reactor-selector.js)**: Reactor configuration
- **[external-component-selector.js](src/modules/external-component-selector.js)**: External components (4 types)
- **[core-selector.js](src/modules/core-selector.js)**: Core stat selection UI
- **[custom-stat-selector.js](src/modules/custom-stat-selector.js)**: Custom stat configuration
- **[arche-tuning.js](src/modules/arche-tuning.js)**: Arche tuning board and node selection

### Configuration

- **[tailwind.config.js](tailwind.config.js)**: Custom gaming theme colors (`tfd-primary`, `tfd-secondary`, etc.)
- **[vite.config.js](vite.config.js)**: Vite dev server and build configuration
- **[package.json](package.json)**: Dependencies and build scripts

### Documentation

- **[docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)**: Comprehensive project overview
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**: Developer guide and architecture
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Deployment instructions
- **[docs/API_KEYS_SETUP.md](docs/API_KEYS_SETUP.md)**: API key configuration guide

## Code Conventions & Patterns

### JavaScript Style

- Write clean, modern ES6+ code
- Use ES modules (`import`/`export`)
- NO jQuery or frameworks - stick to vanilla JavaScript
- Use `const` and `let` (never `var`)
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Destructure objects and arrays where appropriate

### Component Pattern

Components are factory functions that return DOM elements:

```javascript
export function createMyComponent(data) {
  const container = document.createElement('div');
  container.className = 'flex flex-col gap-2';

  // Build component structure
  const header = document.createElement('h2');
  header.textContent = data.title;
  container.appendChild(header);

  return container;
}
```

### State Management

- ALL application state lives in `src/state.js`
- State is a plain JavaScript object
- Components read from state but don't directly mutate it
- Use state update functions when modifying state
- Components re-render when state changes

### Styling

- Use **Tailwind CSS utility classes exclusively**
- Reference custom theme colors: `tfd-primary`, `tfd-secondary`, `tfd-accent`, `tfd-neutral`
- Gaming theme: use neon effects, borders, shadows from Tailwind config
- Responsive design: use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`)

### API Interactions

- All API calls go through `src/api-client.js`
- API client handles authentication (API keys in headers)
- Error handling at the API client level
- Loading states managed in state.js

## Development Workflow

### Before Making Changes

1. **Understand the feature**: Read relevant module files
2. **Check state management**: Review `src/state.js` for affected state
3. **Review UI components**: Check `src/ui-components.js` for reusable elements
4. **Check existing patterns**: Look at similar features for consistency

### Making Changes

1. **Update state**: If adding features, update `src/state.js` first
2. **Follow patterns**: Match existing code style and architecture
3. **Use Tailwind**: Style with utility classes, reference theme colors
4. **Add tests**: Write or update tests in `tests/` directory
5. **Format code**: Run `npm run format` before finishing

### Testing

- Run tests: `npm test`
- Add tests for business logic (serializers, state management, etc.)
- Test file naming: `*.test.js` in `tests/` directory
- Use Vitest for testing framework

### Common Tasks

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `npm test`
- **Format**: `npm run format`
- **Deploy**: `npm run deploy`

## Data Flow & API Integration

### Data Loading

1. Application starts → API keys loaded from localStorage or env vars
2. API client configured with keys
3. Metadata loaded from tfd-cache service:
   - Descendants list
   - Modules list
   - Weapons list
   - Reactors list
   - External components list
   - Stats reference data
4. Data stored in `state.js`
5. UI rendered based on loaded data

### Build Serialization

- Builds are serialized to URL parameters
- LZ-String compression keeps URLs manageable
- Format: `?build=<compressed_data>`
- Deserialization happens on page load

### Image Loading

- All game images loaded through tfd-cache service
- Images are cached by the service
- Authentication required (Worker API Key header)
- Debug utilities in `debug-image-loading.js`

## Important Context

### API Keys Required

The app requires TWO API keys:

1. **Worker API Key**: For tfd-cache service authentication
2. **Nexon API Key**: Passed through to Nexon's official API

Keys can be configured via:

- Settings UI in the app
- Environment variables (`VITE_WORKER_API_KEY`, `VITE_NEXON_API_KEY`)

### Build Constraints

- 12 descendant modules maximum
- 3 weapons with 10 modules each
- 4 base stats per weapon (customizable)
- 5 core stats per weapon (predefined options)
- 4 external component types
- Arche tuning boards with multiple nodes

### Gaming Theme

- Color scheme: Cyan (primary), Orange (secondary), Purple (accent)
- Neon effects and glows
- Dark theme (slate/gray backgrounds)
- Card-based layouts
- Hover effects and transitions

## Common Pitfalls to Avoid

1. **Don't introduce frameworks**: Keep it vanilla JavaScript
2. **Don't bypass state.js**: All state modifications should go through state management
3. **Don't inline styles**: Always use Tailwind utilities
4. **Don't skip tests**: Add tests for new logic
5. **Don't guess API shapes**: Check API responses and type definitions in `src/types.d.ts`
6. **Don't forget API keys**: The app won't work without proper authentication

## Related Repositories

### tfd-cache

The companion Cloudflare Workers service that provides:

- Nexon API proxy with caching
- Image caching with CDN distribution
- API authentication layer

Located at: `/Users/jeffrey.crane/GitHub/tfd-cache`

## Quick Reference

### State Structure

```javascript
{
  descendant: null,          // Selected descendant
  modules: Array(12),        // Descendant modules
  weapons: Array(3),         // Weapon configurations
  reactor: null,             // Reactor selection
  externalComponents: {},    // External components by type
  archeTuning: {},          // Arche tuning configuration
  metadata: {               // API metadata
    descendants: [],
    modules: [],
    weapons: [],
    reactors: [],
    externalComponents: [],
    stats: []
  }
}
```

### Tailwind Theme Colors

- `tfd-primary`: Cyan tones (50-950)
- `tfd-secondary`: Orange tones (50-950)
- `tfd-accent`: Purple tones (50-950)
- `tfd-neutral`: Gray tones (50-950)

### Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests
npm run format   # Format code with Prettier
npm run deploy   # Deploy to Cloudflare
```

## Getting Help

When working on this project:

1. Check the `docs/` directory for detailed documentation
2. Review similar existing features for patterns
3. Read `src/state.js` to understand data structures
4. Check `tailwind.config.js` for available theme utilities
5. Look at existing tests for testing patterns

## Summary

This is a vanilla JavaScript SPA for game build planning with a modular architecture, centralized state management, and Tailwind CSS styling. It's deployed on Cloudflare Workers and relies on a companion caching service. Follow the existing patterns, keep it framework-free, and always update tests when modifying logic.
