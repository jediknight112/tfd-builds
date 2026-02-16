import { describe, it, expect, beforeEach } from 'vitest';
import { BuildSerializer } from '../src/build-serializer.js';

describe('BuildSerializer - Module Slot Position Preservation', () => {
  let serializer;
  let mockState;

  beforeEach(() => {
    // Create mock state with test data
    mockState = {
      descendants: [
        { descendant_id: 'desc1', descendant_name: 'Test Descendant' },
      ],
      modules: [
        { module_id: 'mod_skill', module_name: 'Skill Module', module_type: 'Skill' },
        { module_id: 'mod_sub', module_name: 'Sub Module', module_type: 'Sub' },
        { module_id: 'mod_main1', module_name: 'Main Module 1', module_type: 'Main' },
        { module_id: 'mod_main2', module_name: 'Main Module 2', module_type: 'Main' },
      ],
      weapons: [],
      reactors: [],
      externalComponents: [],
      archeTuningNodes: [],
      archeTuningBoards: [],
      coreTypes: [],
      currentDescendant: { descendant_id: 'desc1' },
      currentBuild: {
        triggerModule: null,
        descendantModules: Array(12).fill(null),
        weapons: Array(3).fill(null).map(() => ({
          weapon: null,
          modules: Array(10).fill(null),
          customStats: [],
          coreType: null,
          coreStats: [],
        })),
        reactor: null,
        reactorAdditionalStats: [
          { name: '', value: 0 },
          { name: '', value: 0 },
        ],
        externalComponents: {},
        archeTuning: null,
      },
    };

    serializer = new BuildSerializer(mockState);
  });

  it('should preserve module slot positions when serializing', () => {
    // Setup build with modules in specific slots
    // Slot 0 = Skill module (special slot)
    // Slot 3 = Main module
    // Slot 6 = Sub module (special slot)
    // Slot 10 = Main module
    mockState.currentBuild.descendantModules[0] = mockState.modules[0]; // Skill
    mockState.currentBuild.descendantModules[3] = mockState.modules[2]; // Main
    mockState.currentBuild.descendantModules[6] = mockState.modules[1]; // Sub
    mockState.currentBuild.descendantModules[10] = mockState.modules[3]; // Main

    const serialized = serializer.serialize();

    // Should have module data with slot indices
    expect(serialized.m).toBeDefined();
    expect(Array.isArray(serialized.m)).toBe(true);
    expect(serialized.m.length).toBe(4);

    // Verify the format is [slot_index, module_id]
    expect(serialized.m[0]).toEqual([0, 'mod_skill']);
    expect(serialized.m[1]).toEqual([3, 'mod_main1']);
    expect(serialized.m[2]).toEqual([6, 'mod_sub']);
    expect(serialized.m[3]).toEqual([10, 'mod_main2']);
  });

  it('should restore module slot positions when deserializing', () => {
    // Create serialized data with modules in specific slots
    const buildData = {
      v: 2,
      d: 'desc1',
      m: [
        [0, 'mod_skill'],    // Slot 0 (Skill)
        [3, 'mod_main1'],    // Slot 3
        [6, 'mod_sub'],      // Slot 6 (Sub)
        [10, 'mod_main2'],   // Slot 10
      ],
    };

    const result = serializer.deserialize(buildData);

    expect(result.valid).toBe(true);
    expect(result.build.descendantModules[0]).toBeDefined();
    expect(result.build.descendantModules[0].module_id).toBe('mod_skill');
    expect(result.build.descendantModules[1]).toBeNull(); // Empty slot
    expect(result.build.descendantModules[2]).toBeNull(); // Empty slot
    expect(result.build.descendantModules[3]).toBeDefined();
    expect(result.build.descendantModules[3].module_id).toBe('mod_main1');
    expect(result.build.descendantModules[6]).toBeDefined();
    expect(result.build.descendantModules[6].module_id).toBe('mod_sub');
    expect(result.build.descendantModules[10]).toBeDefined();
    expect(result.build.descendantModules[10].module_id).toBe('mod_main2');
  });

  it('should handle empty module slots correctly', () => {
    // Only add a module to slot 6 (Sub slot)
    mockState.currentBuild.descendantModules[6] = mockState.modules[1]; // Sub

    const serialized = serializer.serialize();

    expect(serialized.m).toBeDefined();
    expect(serialized.m.length).toBe(1);
    expect(serialized.m[0]).toEqual([6, 'mod_sub']);
  });

  it('should maintain slot 0 (Skill) and slot 6 (Sub) positions', () => {
    // This is the critical test - ensure special slots maintain their positions
    mockState.currentBuild.descendantModules[0] = mockState.modules[0]; // Skill in slot 0
    mockState.currentBuild.descendantModules[6] = mockState.modules[1]; // Sub in slot 6

    const serialized = serializer.serialize();
    const compressed = serializer.compress(serialized);
    const decompressed = serializer.decompress(compressed);
    const result = serializer.deserialize(decompressed);

    expect(result.valid).toBe(true);
    expect(result.build.descendantModules[0]).toBeDefined();
    expect(result.build.descendantModules[0].module_id).toBe('mod_skill');
    expect(result.build.descendantModules[6]).toBeDefined();
    expect(result.build.descendantModules[6].module_id).toBe('mod_sub');

    // Verify other slots are empty
    for (let i = 1; i < 12; i++) {
      if (i !== 6) {
        expect(result.build.descendantModules[i]).toBeNull();
      }
    }
  });

  it('should handle legacy format gracefully', () => {
    // Old format without slot indices (just module IDs)
    const legacyBuildData = {
      v: 2,
      d: 'desc1',
      m: ['mod_skill', 'mod_main1', 'mod_sub'], // No indices
    };

    const result = serializer.deserialize(legacyBuildData);

    expect(result.valid).toBe(true);
    // Legacy format will fill sequentially (not ideal but won't crash)
    expect(result.build.descendantModules[0]).toBeDefined();
    expect(result.build.descendantModules[1]).toBeDefined();
    expect(result.build.descendantModules[2]).toBeDefined();
  });

  it('should preserve all module positions in a full build', () => {
    // Fill all 12 slots
    for (let i = 0; i < 12; i++) {
      // Alternate between different modules
      mockState.currentBuild.descendantModules[i] = 
        mockState.modules[i % mockState.modules.length];
    }

    const serialized = serializer.serialize();
    const result = serializer.deserialize(serialized);

    expect(result.valid).toBe(true);
    expect(result.build.descendantModules.length).toBe(12);
    
    // Verify each module is in the correct slot
    for (let i = 0; i < 12; i++) {
      expect(result.build.descendantModules[i]).toBeDefined();
      expect(result.build.descendantModules[i].module_id).toBe(
        mockState.currentBuild.descendantModules[i].module_id
      );
    }
  });

  it('should handle v1 to v2 conversion with slot positions', () => {
    // Create a v1 format build
    const v1BuildData = {
      version: '1.0',
      descendant_id: 'desc1',
      descendant_module_ids: [
        'mod_skill',  // Index 0
        null,         // Index 1
        null,         // Index 2
        'mod_main1',  // Index 3
        null,         // Index 4
        null,         // Index 5
        'mod_sub',    // Index 6
        null,         // Index 7
        null,         // Index 8
        null,         // Index 9
        'mod_main2',  // Index 10
        null,         // Index 11
      ],
    };

    const result = serializer.deserialize(v1BuildData);

    expect(result.valid).toBe(true);
    expect(result.build.descendantModules[0]).toBeDefined();
    expect(result.build.descendantModules[0].module_id).toBe('mod_skill');
    expect(result.build.descendantModules[3]).toBeDefined();
    expect(result.build.descendantModules[3].module_id).toBe('mod_main1');
    expect(result.build.descendantModules[6]).toBeDefined();
    expect(result.build.descendantModules[6].module_id).toBe('mod_sub');
    expect(result.build.descendantModules[10]).toBeDefined();
    expect(result.build.descendantModules[10].module_id).toBe('mod_main2');
  });
});
