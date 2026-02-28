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
7.  **Weapon rounds type resolution**: The Nexon API uses `weapon_rounds_type: "Enhanced Ammo"` for certain weapons, but the matching modules use `module_class: "Special Rounds"`. The `state.resolveModuleClassForRoundsType()` method handles this mismatch (including all 12 localized variants). Other rounds types (`General Rounds`, `Impact Rounds`, `High-Power Rounds`) match directly between weapons and modules.
8.  **Arche tuning slot-based mapping**: Each slot from the API maps by `slot_id` to a board slot (0-2). Nodes from ALL boards within a slot are merged. See the Arche Tuning System section below for details.
9.  Build data applied to state and all UI sections re-rendered.

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

#### High-Level Overview

Each build supports **3 independent arche tuning board slots** (Board 1, Board 2, Board 3). The `ArcheTuning` class manages these via a `boardSlots[3]` array, each containing `selectedNodes` (Set), `nodePositionMap` (object mapping `"row,col"` → `node_id`), and `currentBoard` (board metadata object).

- **Grid**: 21×21 hex-style grid with anchor points, adjacency-based selection, and a 40-point cost limit.
- **Responsive**: Horizontal scroll on mobile with auto-centering, floating tooltips (hover on desktop, long-press on mobile).

#### Board Composition (CRITICAL to understand)

The Nexon API and static metadata define boards at two levels:

1. **Base board** (e.g., `101400001`): A shared board with ~167 grid positions that is common to all descendants. This defines the "inner" hex grid.
2. **Descendant-specific board** (e.g., `101400601`, `101400901`): A **superset** board with ~211 positions (the base 167 + ~44 corner/edge positions unique to this descendant).

The descendant-specific board is the **complete** board — it contains ALL positions, not just the extras. The base board is a subset of it.

**Lookup chain**: `descendant.descendant_group_id` → `archeTuningBoardGroups[].descendant_group_id` → `arche_tuning_board_id` → the descendant-specific board in `archeTuningBoards[]`.

#### Nexon API Arche Tuning Response Format

When importing a build, the Nexon API returns arche tuning data grouped by **slot** and then by **source board**:

```json
{
  "arche_tuning": [
    {
      "slot_id": "0",
      "arche_tuning_board": [
        {
          "arche_tuning_board_id": "101400001",
          "node": [ { "node_id": "...", "position_row": "9", "position_column": "10" }, ... ]
        },
        {
          "arche_tuning_board_id": "101400601",
          "node": [ { "node_id": "...", "position_row": "0", "position_column": "10" }, ... ]
        }
      ]
    },
    {
      "slot_id": "1",
      "arche_tuning_board": [
        {
          "arche_tuning_board_id": "101400601",
          "node": [ ... ]
        }
      ]
    }
  ]
}
```

**Key insight**: Within a single slot, the `arche_tuning_board` array can contain MULTIPLE boards. The selected nodes are distributed across boards based on which board "owns" each grid position. Nodes on inner positions come from the base board; nodes on corner/edge positions come from the descendant-specific board. **All of these nodes belong to the same visual grid in the same slot** — they must be merged.

#### Build Importer Arche Tuning Logic (`build-importer.js`)

1. **Resolve the descendant-specific board** via `state.archeTuningBoardGroups` using the descendant's `descendant_group_id`.
2. **Map by `slot_id`** (not by iterating boards sequentially). `slot_id: "0"` → `archeTuning[0]`, `slot_id: "1"` → `archeTuning[1]`, etc.
3. **Use the descendant-specific board as the stored board object** (it has all grid positions). Fall back to the first board in the slot if the descendant-specific board can't be resolved.
4. **Merge selected nodes** from ALL boards within the slot using `flatMap` over the `arche_tuning_board[]` array.
5. Store as `{ board: boardObj, selectedNodes: [...] }` in the `archeTuning[slotIdx]` array.

#### `loadFromState()` Logic (`arche-tuning.js`)

When loading a build from state (e.g., from a shared URL or after import):

1. **Array format** (current v3): Iterates `archeTuning[0..2]`, populating each `boardSlot` with the stored board, building the `nodePositionMap`, and reconstructing the `selectedNodes` Set.
2. **Legacy format**: Falls back to single-board format for backward compatibility.
3. **`_buildNodePositionMap(board)`**: Builds the position map from the stored board. If the stored board is NOT the descendant-specific board (e.g., old URLs that stored base board `101400001`), it **also merges in** the descendant-specific board's positions. This ensures all grid positions are covered even for legacy serialized data.
4. **`_getDescendantSpecificBoard()`**: Reusable helper that resolves the descendant-specific board from `state.archeTuningBoardGroups`.

#### Grid Rendering & Invisible Spacers (`applyNodeClasses`)

The 21×21 grid template includes ALL possible positions. Some positions exist in the grid but have no node on a particular board. These render as **invisible spacers** (CSS `invisible` class) so the hex grid layout remains correct without showing empty outlines:

```javascript
// In applyNodeClasses():
if (!nodeInfo && !isAnchor) {
  classes.push('invisible'); // empty grid position — hide but preserve layout
}
```

This is important because the base board has ~167 positions while the descendant-specific board has ~211. Positions unique to the descendant-specific board would show as empty outlines on the base board without this logic.

#### State Sync Pattern

Active references (`this.selectedNodes`, `this.nodePositionMap`, `this.currentBoard`) must stay in sync with `boardSlots[currentSlotIndex]`. Key methods:

- **`_saveCurrentSlot()`**: Writes active references back to `boardSlots[currentSlotIndex]`.
- **`_loadSlot(index)`**: Reads from `boardSlots[index]` into active references.
- **`_loadDefaultBoard()`**: Resolves and loads the descendant-specific board, syncs to slot.
- **`reset()`**: Called by `initializeBuild()` when switching descendants or languages. Clears all 3 board slots.

#### Common Arche Tuning Mistakes to Avoid

- **DON'T map boards sequentially** across slots (e.g., iterating all boards with `boardSlotIdx++`). Each slot's boards are part of a SINGLE composite grid — they must be merged within the slot.
- **DON'T assume one board per slot**. A slot typically has 2 boards (base + descendant-specific) when nodes span both.
- **DON'T store the base board as the reference** if the descendant-specific board is available. The descendant-specific board is the superset with all positions.
- **DON'T modify `_loadDefaultBoard()` or `loadFromState()` without ensuring active `this.*` references stay in sync** with `boardSlots[currentSlotIndex]`.
- **DON'T remove the `invisible` class logic** from `applyNodeClasses` — it prevents empty position outlines on boards with fewer positions.

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
- **DO NOT** map arche tuning boards sequentially across slots (e.g., iterating all boards with `boardSlotIdx++`). A single slot can contain multiple boards — merge their nodes, don't split them into separate board slots. See the Arche Tuning System section for details.
- **DO NOT** assume weapon `weapon_rounds_type` matches `module_class` directly. "Enhanced Ammo" maps to "Special Rounds". Use `state.resolveModuleClassForRoundsType()`.
- **DO NOT** remove the `invisible` class logic from `applyNodeClasses` in `arche-tuning.js` — it prevents empty position outlines on boards with fewer grid positions.

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
