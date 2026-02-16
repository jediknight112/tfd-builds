# Module Slot Position Preservation Fix

## Problem

Previously, the build serializer was filtering out null values when encoding descendant modules to URLs, which caused module slot positions to be lost. This was critical because:

- **Slot 0**: Skill modules only (special slot)
- **Slot 6**: Sub modules only (special slot)
- **Other slots**: Main modules only

When modules were serialized and deserialized, they would be placed in the wrong slots because the null values (empty slots) were removed, causing the indices to shift.

### Example of the Issue

**Before Fix:**
```javascript
// Original build state:
descendantModules = [
  ModuleA (Skill),  // Slot 0 - special
  null,             // Slot 1
  null,             // Slot 2
  ModuleB (Main),   // Slot 3
  null,             // Slot 4
  null,             // Slot 5
  ModuleC (Sub),    // Slot 6 - special
  ...
]

// After serialize (filtering nulls):
m: ['modA_id', 'modB_id', 'modC_id']

// After deserialize (sequential placement):
descendantModules = [
  ModuleA,          // Slot 0 ✗ (correct by chance)
  ModuleB,          // Slot 1 ✗ (should be slot 3!)
  ModuleC,          // Slot 2 ✗ (should be slot 6!)
  ...
]
```

## Solution

Changed the serialization format to preserve slot positions by storing modules as `[slot_index, module_id]` pairs instead of just module IDs.

### New Format

**After Fix:**
```javascript
// Serialize with slot indices:
m: [
  [0, 'modA_id'],   // Slot 0
  [3, 'modB_id'],   // Slot 3
  [6, 'modC_id'],   // Slot 6
]

// Deserialize correctly:
descendantModules = [
  ModuleA,          // Slot 0 ✓
  null,             // Slot 1 ✓
  null,             // Slot 2 ✓
  ModuleB,          // Slot 3 ✓
  null,             // Slot 4 ✓
  null,             // Slot 5 ✓
  ModuleC,          // Slot 6 ✓
  ...
]
```

## Changes Made

### 1. `serialize()` method
- Changed from filtering module IDs to creating `[index, module_id]` pairs
- Preserves slot positions while still excluding empty slots

### 2. `deserialize()` method
- Updated to handle the new `[index, module_id]` format
- Includes backward compatibility for legacy format (old URLs)
- Shows warning when legacy format is detected

### 3. `_convertV1ToV2()` method
- Updated v1 to v2 converter to use the new format
- Maintains slot positions when converting old builds

### 4. Documentation
- Updated JSDoc comments to reflect the new format
- Added note about critical slot position preservation

## Backward Compatibility

The deserializer includes fallback logic for old URLs:

```javascript
// Handle both new format [index, id] and legacy format (just id)
if (Array.isArray(entry)) {
  [slotIndex, moduleId] = entry;
} else {
  // Legacy format: assume sequential filling
  console.warn('Legacy module format detected - slot positions may be incorrect');
  // ... fallback logic
}
```

This ensures existing shared URLs continue to work, though slot positions may be incorrect for legacy URLs.

## Testing

Created comprehensive test suite in [tests/build-serializer.test.js](tests/build-serializer.test.js) covering:

- ✅ Slot position preservation during serialization
- ✅ Slot position restoration during deserialization  
- ✅ Empty slot handling
- ✅ Special slots 0 (Skill) and 6 (Sub) preservation
- ✅ Full 12-slot builds
- ✅ Legacy format handling
- ✅ V1 to V2 conversion
- ✅ Round-trip serialization/deserialization

All tests pass successfully.

## Impact

- **New URLs**: Will correctly preserve module slot positions
- **Existing URLs**: Will continue to work with legacy fallback (may have incorrect positions)
- **Build sharing**: Users can now reliably share builds with modules in specific slots
- **URL size**: Slightly larger due to storing indices, but still compressed with LZ-String

## Benefits

1. **Correct slot placement**: Modules always return to their intended slots
2. **Special slot compatibility**: Skill (slot 0) and Sub (slot 6) maintain restrictions
3. **Future-proof**: Format can handle any slot-specific requirements
4. **Backward compatible**: Old URLs still work (with warnings)
