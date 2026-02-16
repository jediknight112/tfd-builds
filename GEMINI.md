# Gemini Custom Instructions for TFD-Builds

This document provides essential context for me, Gemini, to effectively assist with development tasks in the TFD-Builds project.

## 1. Project Overview & Goal

TFD-Builds is a Single-Page Application (SPA) for the video game "The First Descendant." It allows players to create, view, and share character builds. It is built intentionally with **vanilla JavaScript** (no frameworks) to be lightweight and fast.

### Companion Service: tfd-cache

This project is tightly coupled with a companion service named `tfd-cache`. This Cloudflare Worker service is responsible for:

- Caching data from the official Nexon API.
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
- **API Client**: All backend communication is handled through `src/api-client.js`.

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
- **Theming**: Adhere to the established gaming theme. Use the custom colors defined in `tailwind.config.js`:
  - `tfd-primary`: Cyan
  - `tfd-secondary`: Orange
  - `tfd-accent`: Purple
  - `tfd-neutral`: Gray/Slate
  - **Special slot colors** (custom borders for visual differentiation):
    - Skill slot (slot 0): Teal `#549E94`
    - Sub slot (slot 6): Tan `#A98163`
    - Trigger slot: Gold `#EAD590`

## 5. Data Flow

### Initial Data Load

1.  App starts.
2.  API keys are loaded from localStorage (`.dev.vars`) or environment variables.
3.  `api-client.js` is configured with these keys.
4.  All game metadata (descendants, modules, weapons, etc.) is fetched from the `tfd-cache` service.
5.  This metadata is stored in `state.js`.
6.  The UI renders based on the data in the state object.

### Build Sharing (Serialization)

- Builds are saved in the URL using the `?build=` query parameter or `#<compressed_data>` hash format.
- The build data from the state object is serialized into a string and compressed using `lz-string`.
- **Module slot positions are preserved** during serialization using `[slot_index, module_id]` pairs.
  - This is critical because slot 0 (Skill) and slot 6 (Sub) are special slots with module type restrictions.
  - See `docs/MODULE_SLOT_POSITION_FIX.md` for implementation details.
- On page load, the app checks for this parameter, decompresses it, and hydrates the state.

## 6. Development Workflow

1.  **Understand First**: Before coding, review `src/state.js` to understand the data structure, `src/ui-components.js` for reusable elements, and the relevant module in `src/modules/`.
2.  **Modify State Logic**: If adding a feature, update `src/state.js` first.
3.  **Implement UI**: Create or modify components in `src/ui-components.js` or the relevant module file, following the factory pattern.
4.  **Add Tests**: Add or update unit tests in the `tests/` directory for any new or changed business logic (especially in `state.js` or `build-serializer.js`).
5.  **Verify**: Run `npm test` to ensure all tests pass.
6.  **Format**: Run `npm run format` before finalizing your work.

## 7. Common Pitfalls to Avoid

- **DO NOT** introduce frameworks (React, Vue, Svelte, etc.) or jQuery.
- **DO NOT** manipulate application state outside of the functions in `state.js`.
- **DO NOT** write inline `style` attributes or custom CSS. Use Tailwind utility classes.
- **DO NOT** bypass the `api-client.js`. All external calls must go through it.
- **DO NOT** forget to add tests for new logic.
- **DO NOT** assume the app is working if the API keys are missing. It is fundamental for data loading.

## 8. Quick Reference

### Key Files

- `src/index.js`: Main application entry point.
- `src/state.js`: **Single source of truth for all data.**
- `src/ui-components.js`: Reusable UI element factories.
- `src/api-client.js`: Handles all API communication with `tfd-cache`.
- `src/build-serializer.js`: Handles URL build compression/decompression with slot position preservation.
- `docs/`: Detailed project documentation.

### Descendant Module Slots (Important Constraints)

- **12 total module slots** with special restrictions:
  - **Slot 0 (displayed as Slot 1)**: Skill modules only (teal border)
  - **Slot 6 (displayed as Slot 7)**: Sub modules only (tan border)
  - **Trigger slot**: Separate trigger module slot (gold border)
  - **Other slots**: Main modules only
- Slot positions must be preserved during serialization (handled automatically by `build-serializer.js`).

### Core Commands

- `npm run dev`: Start the local development server.
- `npm test`: Run the unit tests with Vitest.
- `npm run format`: Format all code with Prettier.
- `npm run build`: Create a production build.
- `npm run deploy`: Deploy the application to Cloudflare Workers.
