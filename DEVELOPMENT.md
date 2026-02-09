# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Architecture Overview

### State Management
The app uses a simple class-based state management system:
- `AppState` class holds all application state
- State includes descendants, modules, weapons, and current build
- No external state management library required

### API Client
- `TFDApiClient` class handles all API requests
- Connects to TFD Cache API at `tfd-cache.jeffistotallyawesome.space`
- Fetches metadata for descendants, modules, weapons, etc.

### UI Components
- `UIComponents` class provides static methods for creating UI elements
- Components include module slots, weapon cards, descendant cards
- All components are vanilla JavaScript DOM manipulation

### Application Flow
1. App initializes and loads descendant data
2. User selects a descendant
3. Build interface appears with tabs for different sections
4. User can configure modules, weapons, and other equipment
5. Build data is stored in memory (localStorage planned for future)

## File Structure

```
src/
├── index.js              # Main application logic
│   ├── AppState         # State management class
│   ├── TFDApiClient     # API client class
│   ├── UIComponents     # UI component factory
│   └── Application      # Main app logic
└── styles/
    └── input.css        # Tailwind CSS with custom styles
```

## Key Classes

### AppState
Manages all application state including:
- Descendants list
- Current descendant selection
- Build configuration (modules, weapons, etc.)
- Current active tab

### TFDApiClient
Handles API communication:
- `fetchMetadata(type)` - Generic metadata fetcher
- `getDescendants()` - Fetch descendant data
- `getModules()` - Fetch module data
- `getWeapons()` - Fetch weapon data

### UIComponents
Static factory methods for creating UI elements:
- `createModuleSlot(index, module)` - Module slot with click handler
- `createWeaponCard(weaponIndex)` - Weapon card with stats
- `createDescendantCard(descendant)` - Descendant selection card

### Application
Main application logic:
- `init()` - Initialize app and load data
- `selectDescendant(descendant)` - Handle descendant selection
- `switchTab(tabName)` - Tab navigation
- `renderModules()`, `renderWeapons()` - Render build sections

## Adding New Features

### Adding a New Tab
1. Add tab button in `index.html`:
```html
<button class="tab" data-tab="mytab" onclick="app.switchTab('mytab')">My Tab</button>
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

### Manual Testing
1. Start dev server: `npm run dev`
2. Open browser console for debugging
3. Test descendant selection
4. Test tab navigation
5. Test module slot interactions

### Testing API Integration
```javascript
// In browser console
await apiClient.getDescendants()
await apiClient.getModules()
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

### Deployment Options
- **GitHub Pages**: Deploy `dist/` folder
- **Netlify**: Connect repo, build command: `npm run build`
- **Vercel**: Auto-detect Vite project
- **Cloudflare Pages**: Connect repo, build: `npm run build`, output: `dist`

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

## Future Enhancements

Priority features to add:
1. **Module/Weapon Selectors** - Modal dialogs for selecting items
2. **Build Persistence** - Save builds to localStorage
3. **Build Sharing** - URL-based build sharing
4. **Stat Calculations** - Real-time stat calculations
5. **Build Comparison** - Compare multiple builds
6. **Mobile Responsive** - Better mobile UX
7. **Dark/Light Theme** - Theme toggle
8. **Search & Filter** - Search descendants, modules, weapons

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TFD API Documentation](https://openapi.nexon.com/game/tfd/)
- [MDN Web Docs](https://developer.mozilla.org/)
