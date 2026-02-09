# Module Selector Implementation Guide

## Overview
The module selector allows users to add modules to their descendant build while respecting slot restrictions based on The First Descendant game mechanics.

## Module Classification

### Module Types
Modules are categorized by their usage:
- **Descendant**: Modules for descendant characters
- **Firearm**: Modules for firearm weapons
- **Melee Weapon**: Modules for melee weapons

### Module Classes (by Type)

#### Descendant Module Classes
- **Standard**: General purpose modules
- **Skill**: Skill-specific modules (Slot 1 only)
- **Sub**: Sub-skill modules (Slot 7 only)
- **Trigger**: Special trigger modules (separate slot)
- **Ancestors**: Powerful ancestor modules

#### Firearm Module Classes
- General Rounds
- Special Rounds
- Impact Rounds
- High-Power Rounds

#### Melee Weapon Module Classes
- Impact Rounds
- High-Power Rounds

### Module Socket Types
- Almandine
- Malachite
- Cerulean
- Xantic
- Rutile

### Module Tiers
- Normal
- Rare
- Ultimate
- Transcendent

**Note**: The descendant module selector only displays modules with `module_type: "Descendant"` to prevent weapon modules from appearing in descendant slots.

## Slot Structure

### Trigger Module
- **Location**: Separate dedicated slot above the 12 regular module slots
- **Allowed Modules**: Trigger modules only
- **Visual Indicator**: Red badge with "Trigger" label

### Regular Module Slots (12 total)

#### Slot 1 - Skill Slot
- **Allowed Modules**: Skill modules only
- **Visual Indicator**: Yellow badge with "Skill" label
- **Restriction**: Only accepts modules with `module_class: "Skill"`

#### Slot 7 - Sub Slot
- **Allowed Modules**: Sub modules only
- **Visual Indicator**: Blue badge with "Sub" label
- **Restriction**: Only accepts modules with `module_class: "Sub"`

#### Slots 2-6 and 8-12 - Standard/Ancestors Slots
- **Allowed Modules**: Standard OR Ancestors modules
- **Visual Indicators**: 
  - Gray badge for Standard modules
  - Purple badge for Ancestors modules
- **Restriction**: Only accepts modules with `module_class: "Standard"` or `module_class: "Ancestors"`

## User Flow

1. **Opening the Selector**
   - Click on any module slot (trigger or 1-12)
   - Modal opens with filtered modules based on slot type
   - Header shows which slot is being filled and restrictions

2. **Searching/Filtering**
   - **Search Bar**: Type to filter modules by name
   - **Filter Buttons**: Click to filter by module class (All, Skill, Sub, Standard, Ancestors, Trigger)
   - Filters automatically respect slot restrictions (e.g., clicking "Skill" in a Sub slot will show no results)

3. **Selecting a Module**
   - Click on any module card to assign it to the current slot
   - Modal automatically closes
   - Module view refreshes to show the assigned module

4. **Closing Without Selection**
   - Click the X button in the top right
   - No changes are made to the build

## Technical Implementation

### Key Functions

#### `openModuleSelector(slotIndex, slotType)`
- **Parameters**:
  - `slotIndex`: 0-11 for regular slots, -1 for trigger slot
  - `slotType`: 'trigger', 'skill', 'sub', or 'standard'
- **Purpose**: Opens modal and filters modules based on slot type

#### `renderModuleSelectorGrid(slotType, searchQuery, filterType)`
- **Purpose**: Renders available modules respecting slot restrictions
- **Filtering Logic**:
  - First filters by `module_type: "Descendant"` to exclude weapon modules
  - Then filters by slot type restrictions (Skill, Sub, Standard/Ancestors, Trigger)
  - Then applies search query
  - Finally applies selected filter button

#### `selectModule(moduleId)`
- **Purpose**: Assigns module to the current slot and closes modal
- **Updates**: `state.currentBuild.triggerModule` or `state.currentBuild.descendantModules[index]`

#### `filterModules()`
- **Purpose**: Re-renders the grid based on current search and filter state

#### `filterModulesByType(type)`
- **Purpose**: Updates active filter button and triggers re-render

### State Management

The `AppState` class tracks:
```javascript
{
  currentModuleSlot: {
    index: -1 | 0-11,  // -1 for trigger, 0-11 for regular slots
    type: 'trigger' | 'skill' | 'sub' | 'standard'
  },
  currentBuild: {
    triggerModule: null | ModuleObject,
    descendantModules: [null, ...] // Array of 12 module objects
  }
}
```

## Visual Design

### Empty Slot
- Shows a "+" icon
- Displays slot label (e.g., "Skill Slot", "Module Slot 3")
- Shows allowed module types
- Hover effect: cursor changes to pointer

### Filled Slot
- Shows module image
- Displays module name and tier
- Badge indicating module class
- Gradient overlay for readability
- Hover effect: scales up slightly

### Module Cards in Selector
- Module image at top
- Module class badge in corner
- Module name, tier, socket type, and type information
- Grid layout (2-5 columns depending on screen size)
- Hover effect: scales up
- Click to select

## CSS Classes

- `.module-slot`: Empty or filled module slot container
- `.module-filter-btn`: Filter button styling
- `.module-filter-btn.active`: Active filter button state
- `.module-card`: Individual module in selector grid

## Next Steps

1. Add right-click context menu to remove modules from slots
2. Add drag-and-drop support for rearranging modules
3. Add module comparison tooltips
4. Implement build validation (checking if all required slots are filled)
5. Add module stat summaries (total bonuses from all equipped modules)
