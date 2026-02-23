# Gemini Custom Instructions for TFD-Builds

This document provides essential context for me, Gemini, to effectively assist with development tasks in the TFD-Builds project.

## 1. Project Overview & Goal

TFD-Builds is a Single-Page Application (SPA) for the video game "The First Descendant." It allows players to create, view, and share character builds. It also supports **importing live builds from the Nexon API** using a player's in-game username. It is built intentionally with **vanilla JavaScript** (no frameworks) to be lightweight and fast.

### Companion Service: tfd-cache

This project is tightly coupled with a companion service named `tfd-cache`. This Cloudflare Worker service is responsible for:

- Caching static metadata from the official Nexon API.
- Proxying user-specific API calls (player builds, weapons, etc.) to the Nexon API.
- Caching game asset images.
- Handling API key authentication.
  **All API calls from this project go to the `tfd-cache` service, not directly to the Nexon API.**

## 2. Persona

I will act as a **senior full-stack JavaScript developer** with expertise in:

- Modern Vanilla JavaScript (ES6+), SPAs, and direct DOM manipulation.
- Tailwind CSS for utility-first styling and theming.
- Vite for development and bundling.
- Cloudflare Workers for serverless deployment.
- `vitest` for unit testing.

## 3. Architecture & Patterns

- **Framework-Free SPA**: The application uses modern browser APIs for all rendering and logic. Do not introduce any UI frameworks like React or Vue.
- **Modular Design**: Features are encapsulated in modules within `src/modules/`.
- **Centralized State**: `src/state.js` is the **single source of truth**. Do not manage state within components or modules directly.
- **Component Factories**: UI elements are created by plain JavaScript functions in `src/ui-components.js` that return DOM elements.
- **API Client**: All backend communication is handled through `src/api-client.js`. This includes:
  - **Metadata endpoints**: Static game data (cached by tfd-cache)
  - **User data endpoints**: Player-specific data like `resolveUsername`, `fetchUserDescendant`, `fetchUserWeapon`, `fetchUserReactor`, `fetchUserExternalComponent`, `fetchUserArcheTuning` (proxied through tfd-cache)
  - **URL Shortener**: `shortenUrl(hash)` calls the local worker endpoint `/api/shorten` to generate short links.
- **Build Importer**: `src/modules/build-importer.js` handles importing builds from the Nexon API:
  - Resolves username → OUID
  - Uses a **two-pass module placement** strategy (named slots first, then numeric slots) to avoid ordering conflicts
  - Converts localized equipment types to English keys using `state.getEnglishEquipmentType()`
- **URL Shortener**: Implemented in `worker.js` using Cloudflare KV (`URL_SHORTENER` namespace).
  - **POST /api/shorten**: Accepts `{ hash }`, generates a 6-char ID, stores it in KV, and returns the short URL.
  - **GET /s/:id**: Redirects to `/#<hash>`.
  - **Local Development**: `npm run dev` runs both the frontend (Vite) and backend (Wrangler) concurrently. The worker detects local requests and redirects to `localhost:3000` instead of the production domain.
- **Localization**:
  - The app supports 12 languages via the `language_code` query parameter in API calls.
  - Localized category names (Module Class, Socket Type, Equipment Type, etc.) are managed in `state.js` via the `LOCALIZED_STRINGS` object.
  - Use `state.getLocalizedModuleClass()`, `state.getLocalizedSocketType()`, `state.getLocalizedEquipmentType()`, etc., for robust filtering across languages.
  - **Reverse-lookup**: `state.getEnglishEquipmentType()` converts localized equipment type names back to English keys for internal storage.
  - When the language changes, metadata is re-fetched and the current build (including arche tuning) is reset.

## 4. Code Conventions

- **JavaScript**: Write clean, modern ES6+ code. Use `const` and `let` (no `var`), arrow functions for callbacks, template literals, and destructuring.
- **Component Example**: Follow this pattern from `src/ui-components.js`:

  ```javascript
  // Components are functions that build and return a DOM element
  export function createMyComponent(data) {
    const container = document.createElement('div');
    container.className = 'flex flex-col gap-2'; // Style with Tailwind

    const header = document.createElement('h2');
    header.textContent = data.title;
    container.appendChild(header);

    return container;
  }
  ```

- **Styling**: Use **Tailwind CSS utility classes exclusively**. Do not write inline styles or separate CSS files.
- **Responsive Design**: The application is mobile-first. Use Tailwind's responsive prefixes (`sm:`, `md:`, etc.).
  - **Bottom Action Bar**: On mobile (`< sm`), primary actions (Refresh, Share, New Build) are located in a fixed bottom bar.
  - **Modals**: Modals should be full-screen on mobile (`h-full rounded-none`) and use standard card styling on larger screens.
  - **Touch Targets**: Ensure interactive elements have a minimum touch target size (44x44px where possible).
- **Theming**: Adhere to the established gaming theme. Use the custom colors defined in `tailwind.config.js`:
  - `tfd-primary`: Cyan
  - `tfd-secondary`: Orange
  - `tfd-accent`: Purple
  - `tfd-neutral`: Gray/Slate
  - **Special slot colors** (custom borders for visual differentiation):
    - Skill slot (slot 0): Teal `#549E94`
    - Sub slot (slot 6): Tan `#A98163`
    - Trigger slot: Gold `#EAD590`
- **Fonts**:
  - **Header**: Iceland (Google Fonts) for the main title
  - **Body**: Pretendard for all other text

## 5. Data Flow

### Initial Data Load

1.  App starts.
2.  API keys are loaded from localStorage (`.dev.vars`) or environment variables.
3.  `api-client.js` is configured with these keys.
4.  All game metadata (descendants, modules, weapons, reactors, external components, stats, arche tuning boards/nodes/groups, descendant groups) is fetched from the `tfd-cache` service.
5.  This metadata is stored in `state.js`.
6.  The UI renders based on the data in the state object.
7.  **Mobile UI state** is updated (e.g., enabling/disabling the share button via `UIComponents.updateMobileShareButton`).

### Build Import (from Nexon API)

1.  User enters an in-game username (e.g., `Player#1234`).
2.  `BuildImporter` resolves username → OUID via `/tfd/v1/id`.
3.  Fetches descendant data → identifies the active descendant and its `descendant_group_id`.
4.  Makes parallel fetches for weapons, reactor, external components, and arche tuning (with `language_code` and `descendant_group_id` params).
5.  **Module placement**: Two-pass approach — named slots (`Main 3`, `Skill 1`, `Sub 1`) placed first, then numeric slots (`"9"`, `"1"`) placed into remaining empties based on `available_module_slot_type`.
6.  **Localization handling**: External component equipment types from localized metadata are converted to English keys via `state.getEnglishEquipmentType()`.
7.  Build data applied to state and all UI sections re-rendered.

### Build Sharing (Serialization & Shortening)

- Builds are saved in the URL hash as `#<compressed_data>`.
- The build data from the state object is serialized into a string and compressed using `lz-string`.
- **URL Shortener**: When clicking "Share Build", the app:
  1. Serializes and compresses the build.
  2. Calls `/api/shorten` to generate a short link (e.g., `tfd-builds.jediknight112.com/s/AbCdEf`).
  3. Copies the short link to the clipboard.
  4. Falls back to the long URL if the shortener service is unavailable.
- **Format v3** (current): Supports multi-board arche tuning serialized as `[[board_id, [[node_id, row, col]]], ...]`.
- **Backward compatible**: v2 single-board and v1 legacy formats are auto-detected and upgraded on deserialization.
- **Module slot positions are preserved** during serialization using `[slot_index, module_id]` pairs.
  - This is critical because slot 0 (Skill) and slot 6 (Sub) are special slots with module type restrictions.
  - See `docs/MODULE_SLOT_POSITION_FIX.md` for implementation details.
- On page load, the app checks for this parameter, decompresses it, and hydrates the state.

### Arche Tuning System

- **Multi-board**: Each build supports 3 independent boards (Board 1, Board 2, Board 3), all editable.
- **Board slot management**: `ArcheTuning` class tracks 3 `boardSlots`, each with `selectedNodes` (Set), `nodePositionMap` (object), and `currentBoard` (object or null).
- **State sync**: Active instance references (`this.selectedNodes`, etc.) must stay in sync with `boardSlots[currentSlotIndex]`. Key methods: `_saveCurrentSlot()`, `_loadSlot()`, `_loadDefaultBoard()` (which syncs to the slot).
- **Reset**: `initializeBuild()` calls `archeTuning.reset()` to clear all 3 board slots when switching descendants or languages.
- **Grid**: 21x21 hex-style grid with anchor points, adjacency-based selection, 40-point cost limit.
- **Responsive**: Horizontal scroll on mobile with auto-centering, floating tooltips (hover on desktop, long-press on mobile).

## 6. Development Workflow

1.  **Understand First**: Before coding, review `src/state.js` to understand the data structure, `src/ui-components.js` for reusable elements, and the relevant module in `src/modules/`.
2.  **Modify State Logic**: If adding a feature, update `src/state.js` first.
3.  **Implement UI**: Create or modify components in `src/ui-components.js` or the relevant module file, following the factory pattern.
4.  **Add Tests**: Add or update unit tests in the `tests/` directory for any new or changed business logic (especially in `state.js`, `build-serializer.js`, or `build-importer.js`).
5.  **Verify**: Run `npm test` to ensure all tests pass.
6.  **Format**: Run `npm run format` before finalizing your work.

### Current Test Files

- `tests/build-serializer.test.js` - Core serialization with slot position preservation
- `tests/build-serializer-extended.test.js` - Extended coverage including v3 multi-board format
- `tests/state.test.js` - State management and default build creation
- `tests/config.test.js` - Configuration loading (env vars, localStorage fallback)
- `tests/localization.test.js` - Localization helpers and reverse-lookup
- `tests/arche-tuning-logic.test.js` - Multi-board arche tuning logic
- `tests/build-importer.test.js` - Build import mapping, two-pass module placement, and orchestration

## 7. Common Pitfalls to Avoid

- **DO NOT** introduce frameworks (React, Vue, Svelte, etc.) or jQuery.
- **DO NOT** manipulate application state outside of the functions in `state.js`.
- **DO NOT** write inline `style` attributes or custom CSS. Use Tailwind utility classes.
- **DO NOT** bypass the `api-client.js`. All external calls must go through it.
- **DO NOT** forget to add tests for new logic.
- **DO NOT** assume the app is working if the API keys are missing. It is fundamental for data loading.
- **DO NOT** use localized strings as internal dictionary keys. Use `state.getEnglishEquipmentType()` to normalize localized values to English keys.
- **DO NOT** modify arche tuning board slot state without ensuring `this.*` active references stay in sync with `boardSlots[currentSlotIndex]`.

## 8. Quick Reference

### Key Files

- `src/index.js`: Main application entry point and `Application` class.
- `src/state.js`: **Single source of truth for all data.**
- `src/ui-components.js`: Reusable UI element factories.
- `src/api-client.js`: Handles all API communication with `tfd-cache` (metadata + user endpoints).
- `src/build-serializer.js`: Handles URL build compression/decompression (v3 format with multi-board support).
- `src/modules/build-importer.js`: Imports builds from the Nexon API with two-pass module placement.
- `src/modules/arche-tuning.js`: Multi-board arche tuning with 3 independent board slots.
- `docs/`: Detailed project documentation.
- `Nexon API Schema/`: Example API response data for reference.

### State Structure

```javascript
{
  currentDescendant: null,
  currentBuild: {
    triggerModule: null,
    descendantModules: Array(12),  // slot 0 = Skill, slot 6 = Sub
    weapons: Array(3).map(() => ({
      weapon: null,
      modules: Array(10),
      customStats: [],
      coreType: null,
      coreStats: [],
    })),
    reactor: null,
    reactorAdditionalStats: [{ name: '', value: 0 }, { name: '', value: 0 }],
    externalComponents: {},         // Keyed by English equipment type
    archeTuning: [null, null, null], // 3 board slots
  },
  // Metadata arrays, API keys, language, etc.
}
```

### Descendant Module Slots (Important Constraints)

- **12 total module slots** with special restrictions:
  - **Slot 0 (displayed as Slot 1)**: Skill modules only (teal border)
  - **Slot 6 (displayed as Slot 7)**: Sub modules only (tan border)
  - **Trigger slot**: Separate trigger module slot (gold border)
  - **Other slots**: Main modules only
- Slot positions must be preserved during serialization (handled automatically by `build-serializer.js`).

### Core Commands

- `npm run dev`: Start the full development environment (Vite frontend + Wrangler backend concurrently).
- `npm test`: Run the unit tests with Vitest.
- `npm run format`: Format all code with Prettier.
- `npm run build`: Create a production build.
- `npm run deploy`: Deploy the application to Cloudflare Workers.
