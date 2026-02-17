# Claude Context Guide for TFD-Builds

This document provides essential context for Claude to effectively assist with development tasks in the TFD-Builds project.

## Project Overview

**TFD-Builds** is a modern web application for creating, viewing, and sharing character builds for "The First Descendant" video game. It's a single-page application (SPA) built with vanilla JavaScript that allows players to:

- Select descendants (playable characters)
- Configure descendant modules (12 slots)
- Equip and customize weapons (3 weapons, each with 10 modules + stats)
- Configure reactors with additional stats
- Add external components with core stats
- Set up Arche Tuning boards and nodes (up to 3 boards per build)
- Share builds via compressed URL parameters
- **Import builds from the Nexon API** using an in-game username

### Companion Service

This project relies on **tfd-cache** (a separate repository in this workspace) which is a Cloudflare Workers-based caching service that:

- Proxies and caches data from the Nexon API (both static metadata and user-specific data)
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
- **[src/api-client.js](src/api-client.js)**: API communication layer with tfd-cache service (metadata + user data endpoints)
- **[src/config.js](src/config.js)**: Configuration constants and API settings
- **[src/ui-components.js](src/ui-components.js)**: Factory functions for reusable UI elements
- **[src/build-serializer.js](src/build-serializer.js)**: Build encoding/decoding with compression (v3 format with multi-board arche tuning)
- **[src/debug-image-loading.js](src/debug-image-loading.js)**: Image loading utilities

### Feature Modules (`src/modules/`)

Each module is self-contained and handles a specific feature:

- **[module-selector.js](src/modules/module-selector.js)**: Descendant module selection (12 slots)
- **[weapon-selector.js](src/modules/weapon-selector.js)**: Weapon selection and configuration
- **[reactor-selector.js](src/modules/reactor-selector.js)**: Reactor configuration
- **[external-component-selector.js](src/modules/external-component-selector.js)**: External components (4 types)
- **[core-selector.js](src/modules/core-selector.js)**: Core stat selection UI
- **[custom-stat-selector.js](src/modules/custom-stat-selector.js)**: Custom stat configuration
- **[arche-tuning.js](src/modules/arche-tuning.js)**: Multi-board arche tuning (3 boards per build)
- **[build-importer.js](src/modules/build-importer.js)**: Import builds from the Nexon API via username lookup

### Configuration

- **[tailwind.config.js](tailwind.config.js)**: Custom gaming theme colors (`tfd-primary`, `tfd-secondary`, etc.)
- **[vite.config.js](vite.config.js)**: Vite dev server and build configuration
- **[package.json](package.json)**: Dependencies and build scripts

### Documentation

- **[docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)**: Comprehensive project overview
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**: Developer guide and architecture
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Deployment instructions
- **[docs/API_KEYS_SETUP.md](docs/API_KEYS_SETUP.md)**: API key configuration guide

### Localization System

- **Multi-language Support**: Supports 12 languages (en, de, es, fr, it, ja, ko, pl, pt, ru, zh-CN, zh-TW).
- **Localized Metadata**: API calls include `language_code` to fetch translated game data.
- **Internal Translation Map**: `LOCALIZED_STRINGS` in `state.js` provides a mapping for static game categories (e.g., "Socket Type", "Module Class", "Equipment Type") used in filtering logic.
- **Reverse-Lookup**: `state.getEnglishEquipmentType()` converts localized equipment type names back to English keys for internal storage consistency.
- **Language Switching**: Changing the language triggers a full metadata re-fetch and resets the current build (including arche tuning) to ensure data consistency.
- **Helper Methods**: Use `state.getLocalized*` methods to get the correct string for the current active language.

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
- **Mobile Actions**: Update mobile-specific UI states (like the share button enabled/disabled state) using `UIComponents.updateMobileShareButton()`.

### Styling

- Use **Tailwind CSS utility classes exclusively**
- Reference custom theme colors: `tfd-primary`, `tfd-secondary`, `tfd-accent`, `tfd-neutral`
- Gaming theme: use neon effects, borders, shadows from Tailwind config
- **Responsive design**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`).
  - **Mobile-First**: Primary navigation and actions (Share, New Build) use a fixed bottom action bar on mobile.
  - **Full-Screen Modals**: On mobile, modals occupy the full viewport and use tighter internal spacing.
  - **Touch Targets**: Use `min-height: 44px` for buttons and interactive slots.

### API Interactions

- All API calls go through `src/api-client.js`
- API client handles authentication (API keys in headers)
- **Two types of API calls**:
  - **Metadata**: Static game data (descendants, modules, weapons, etc.) - cached by tfd-cache
  - **User data**: Player-specific data (current build, weapons, etc.) - proxied through tfd-cache but not cached long-term
- User API endpoints require additional parameters: `language_code` for localized responses, `descendant_group_id` for arche tuning
- Error handling at the API client level with `AbortController` timeouts
- Loading states managed in state.js
- **UI Notifications**: Use `UIComponents.showSuccess()`, `showWarning()`, or `showError()` instead of browser `alert()`. Toasts appear at the bottom-center on mobile.

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
- Current test files:
  - `tests/build-serializer.test.js` - Core serialization/deserialization with slot positions
  - `tests/build-serializer-extended.test.js` - Extended coverage including v3 multi-board format
  - `tests/state.test.js` - State management and default build creation
  - `tests/config.test.js` - Configuration loading (env vars, localStorage)
  - `tests/localization.test.js` - Localization helpers and reverse-lookup
  - `tests/arche-tuning-logic.test.js` - Multi-board arche tuning logic
  - `tests/build-importer.test.js` - Build import mapping and orchestration

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
   - Arche tuning boards, nodes, and board groups
   - Descendant groups
4. Data stored in `state.js`
5. UI rendered based on loaded data

### Build Import (from Nexon API)

1. User enters an in-game username (e.g., `Player#1234`)
2. `BuildImporter` resolves username → OUID via `/tfd/v1/id`
3. Fetches descendant data → identifies the active descendant and its `descendant_group_id`
4. Parallel fetches: weapons, reactor, external components, arche tuning (with `language_code` and `descendant_group_id` params)
5. **Two-pass module placement**: Named slots (`Main 3`, `Skill 1`) placed first, then numeric-only slots (`"9"`) placed into remaining empties based on `available_module_slot_type`
6. **Localized equipment type handling**: External component equipment types are converted from localized strings to English keys via `state.getEnglishEquipmentType()` for internal consistency
7. Build data populated into state and UI re-rendered

### Build Serialization

- Builds are serialized to URL hash parameters
- LZ-String compression keeps URLs manageable
- **Format v3** (current): Supports multi-board arche tuning as `[[board_id, [[node_id, row, col]]], ...]`
- **Backward compatible**: v2 single-board and v1 legacy formats are auto-detected and upgraded on deserialization
- **Module slot positions are preserved** using `[slot_index, module_id]` pairs
  - Critical for Skill (slot 0) and Sub (slot 6) special slots
  - See [docs/MODULE_SLOT_POSITION_FIX.md](docs/MODULE_SLOT_POSITION_FIX.md) for details

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
  - **Slot 0 (Slot 1 in UI)**: Skill modules only - special slot with teal border (`#549E94`)
  - **Slot 6 (Slot 7 in UI)**: Sub modules only - special slot with tan border (`#A98163`)
  - **Trigger slot**: Separate trigger module slot with gold border (`#EAD590`)
  - **Other slots**: Main modules only
- 3 weapons with 10 modules each
- 4 base stats per weapon (customizable)
- 5 core stats per weapon (predefined options)
- 4 external component types (Auxiliary Power, Sensor, Memory, Processor) - stored internally with English keys
- **3 Arche Tuning boards per build** - each independently configurable with up to 40 tuning points
- **Mobile Share Button**: The mobile share button is disabled (greyed out) until a descendant is selected.

### Arche Tuning System

- **Multi-board**: Each build supports 3 independent boards (Board 1, Board 2, Board 3)
- **Board slot management**: `ArcheTuning` class tracks 3 `boardSlots`, each with its own `selectedNodes`, `nodePositionMap`, and `currentBoard`
- **Default board loading**: When switching to an empty board slot, the descendant's default board is auto-loaded via `_loadDefaultBoard()` which syncs to the slot
- **State sync pattern**: Active references (`this.selectedNodes`, `this.nodePositionMap`, `this.currentBoard`) must stay in sync with `boardSlots[currentSlotIndex]`. Key methods: `_saveCurrentSlot()`, `_loadSlot()`, `_loadDefaultBoard()`
- **Reset behavior**: `initializeBuild()` calls `archeTuning.reset()` to clear all board slots when switching descendants or languages
- **Grid**: 21x21 hex-style grid with anchor points, adjacency-based selection, and cost system (40 points max)
- **Responsive**: Horizontal scroll on mobile with auto-centering, floating tooltips (hover on desktop, long-press on mobile)

### Gaming Theme

- Color scheme: Cyan (primary), Orange (secondary), Purple (accent)
- **Header font**: Iceland (Google Fonts)
- **Body font**: Pretendard
- Neon effects and glows
- Dark theme (slate/gray backgrounds)
- Card-based layouts
- Hover effects and transitions
- **Special slot colors** for visual differentiation:
  - Skill slot (slot 0): Teal `#549E94`
  - Sub slot (slot 6): Tan `#A98163`
  - Trigger slot: Gold `#EAD590`

## Common Pitfalls to Avoid

1. **Don't introduce frameworks**: Keep it vanilla JavaScript
2. **Don't bypass state.js**: All state modifications should go through state management
3. **Don't inline styles**: Always use Tailwind utilities
4. **Don't skip tests**: Add tests for new logic
5. **Don't guess API shapes**: Check API responses and type definitions in `src/types.d.ts`, or reference example data in `Nexon API Schema/`
6. **Don't forget API keys**: The app won't work without proper authentication
7. **Don't use English-only keys for localized data**: Use `state.getEnglishEquipmentType()` to normalize localized values back to English keys for internal storage
8. **Don't forget to sync arche tuning board slots**: When modifying `_loadDefaultBoard()` or `loadFromState()`, ensure active `this.*` references stay in sync with `boardSlots[currentSlotIndex]`

## Related Repositories

### tfd-cache

The companion Cloudflare Workers service that provides:

- Nexon API proxy with caching (both static metadata and user-specific endpoints)
- Image caching with CDN distribution
- API authentication layer

(See companion repository `tfd-cache`)

## Quick Reference

### State Structure

```javascript
{
  currentDescendant: null,       // Selected descendant
  currentBuild: {
    triggerModule: null,         // Trigger module
    descendantModules: Array(12), // Descendant modules (slot 0 = Skill, slot 6 = Sub)
    weapons: Array(3).map(() => ({
      weapon: null,
      modules: Array(10),
      customStats: [],
      coreType: null,
      coreStats: [],
    })),
    reactor: null,
    reactorAdditionalStats: [
      { name: '', value: 0 },
      { name: '', value: 0 },
    ],
    externalComponents: {},      // Keyed by English equipment type
    archeTuning: [null, null, null], // 3 board slots
  },
  // Metadata (from API)
  descendants: [],
  modules: [],
  weapons: [],
  reactors: [],
  externalComponents: [],
  archeTuningBoards: [],
  archeTuningNodes: [],
  archeTuningBoardGroups: [],
  descendantGroups: [],
  stats: [],
  // API keys
  apiKeys: { workerApiKey, nexonApiKey },
  language: 'en',
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
6. Reference `Nexon API Schema/` directory for API response shapes

## Summary

This is a vanilla JavaScript SPA for game build planning with a modular architecture, centralized state management, and Tailwind CSS styling. It supports importing builds from the Nexon API, multi-board arche tuning, and 12-language localization. It's deployed on Cloudflare Workers and relies on a companion caching service. Follow the existing patterns, keep it framework-free, and always update tests when modifying logic.
