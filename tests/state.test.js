import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state, createDefaultBuild } from '../src/state.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('createDefaultBuild', () => {
  it('should return the correct structure', () => {
    const build = createDefaultBuild();

    expect(build.triggerModule).toBeNull();
    expect(build.descendantModules).toHaveLength(12);
    expect(build.descendantModules.every((m) => m === null)).toBe(true);

    expect(build.weapons).toHaveLength(3);
    build.weapons.forEach((w) => {
      expect(w.weapon).toBeNull();
      expect(w.modules).toHaveLength(10);
      expect(w.modules.every((m) => m === null)).toBe(true);
      expect(w.customStats).toEqual([]);
      expect(w.coreType).toBeNull();
      expect(w.coreStats).toEqual([]);
    });

    expect(build.reactor).toBeNull();
    expect(build.reactorAdditionalStats).toHaveLength(2);
    expect(build.reactorAdditionalStats[0]).toEqual({ name: '', value: 0 });
    expect(build.reactorAdditionalStats[1]).toEqual({ name: '', value: 0 });

    expect(build.externalComponents).toEqual({});
    expect(build.archeTuning).toBeNull();
  });

  it('should return independent copies with no shared references', () => {
    const build1 = createDefaultBuild();
    const build2 = createDefaultBuild();

    expect(build1).not.toBe(build2);
    expect(build1.descendantModules).not.toBe(build2.descendantModules);
    expect(build1.weapons).not.toBe(build2.weapons);
    expect(build1.weapons[0]).not.toBe(build2.weapons[0]);
    expect(build1.weapons[0].modules).not.toBe(build2.weapons[0].modules);
    expect(build1.reactorAdditionalStats).not.toBe(
      build2.reactorAdditionalStats
    );
    expect(build1.externalComponents).not.toBe(build2.externalComponents);

    // Mutating one should not affect the other
    build1.descendantModules[0] = { module_id: 'test' };
    expect(build2.descendantModules[0]).toBeNull();
  });
});

describe('AppState - Lookup Builders', () => {
  beforeEach(() => {
    localStorage.clear();
    state.setLanguage('en');
    state.stats = [];
    state.weaponTypes = [];
    state.coreSlots = [];
    state.coreTypes = [];
    state.tiers = [];
    state.statLookup = {};
    state.weaponTypeNameLookup = {};
    state.coreSlotLookup = {};
    state.coreTypeLookup = {};
    state.tierLookup = {};
  });

  describe('buildStatLookup', () => {
    it('should build map from stats array', () => {
      state.stats = [
        { stat_id: 'stat1', stat_name: 'Firearm ATK' },
        { stat_id: 'stat2', stat_name: 'Max HP' },
        { stat_id: 'stat3', stat_name: 'DEF' },
      ];

      state.buildStatLookup();

      expect(state.getStatName('stat1')).toBe('Firearm ATK');
      expect(state.getStatName('stat2')).toBe('Max HP');
      expect(state.getStatName('stat3')).toBe('DEF');
    });

    it('should handle empty stats array without crashing', () => {
      state.stats = [];
      state.buildStatLookup();

      expect(state.getStatName('unknown_id')).toBe('unknown_id');
    });

    it('should skip entries with missing stat_id or stat_name', () => {
      state.stats = [
        { stat_id: null, stat_name: 'No ID' },
        { stat_id: 'stat_ok', stat_name: '' },
        { stat_id: 'stat_good', stat_name: 'Valid Stat' },
      ];

      state.buildStatLookup();

      expect(state.getStatName('stat_good')).toBe('Valid Stat');
      expect(state.getStatName('stat_ok')).toBe('stat_ok');
    });
  });

  describe('buildWeaponTypeLookup', () => {
    it('should build map from weaponTypes array', () => {
      state.weaponTypes = [
        { weapon_type_name: 'Assault Rifle', weapon_type: 'AR' },
        { weapon_type_name: 'Handgun', weapon_type: 'HG' },
      ];

      state.buildWeaponTypeLookup();

      expect(state.getWeaponTypeCode('Assault Rifle')).toBe('AR');
      expect(state.getWeaponTypeCode('Handgun')).toBe('HG');
    });

    it('should return null for unknown weapon type name', () => {
      state.weaponTypes = [];
      state.buildWeaponTypeLookup();

      expect(state.getWeaponTypeCode('Unknown Weapon')).toBeNull();
    });
  });

  describe('buildCoreSlotLookup', () => {
    it('should build map from coreSlots array', () => {
      const slotData = {
        core_slot_id: 'cs1',
        available_core_type_id: ['ct1', 'ct2'],
      };
      state.coreSlots = [slotData];

      state.buildCoreSlotLookup();

      expect(state.getCoreSlot('cs1')).toBe(slotData);
    });

    it('should return null for unknown core_slot_id', () => {
      state.coreSlots = [];
      state.buildCoreSlotLookup();

      expect(state.getCoreSlot('unknown')).toBeNull();
    });
  });

  describe('buildCoreTypeLookup', () => {
    it('should build map from coreTypes array', () => {
      const typeData = {
        core_type_id: 'ct1',
        core_type: 'Free Augmentation',
      };
      state.coreTypes = [typeData];

      state.buildCoreTypeLookup();

      expect(state.getCoreType('ct1')).toBe(typeData);
    });

    it('should return null for unknown core_type_id', () => {
      state.coreTypes = [];
      state.buildCoreTypeLookup();

      expect(state.getCoreType('unknown')).toBeNull();
    });
  });

  describe('buildTierLookup', () => {
    it('should handle multiple tiers', () => {
      state.tiers = [
        { tier_id: 'Tier1', tier_name: 'Normal' },
        { tier_id: 'Tier2', tier_name: 'Rare' },
        { tier_id: 'Tier3', tier_name: 'Ultimate' },
        { tier_id: 'Tier4', tier_name: 'Transcendent' },
      ];

      state.buildTierLookup();

      expect(state.getTierDisplayName('Tier1')).toBe('Normal');
      expect(state.getTierDisplayName('Tier2')).toBe('Rare');
      expect(state.getTierDisplayName('Tier3')).toBe('Ultimate');
      expect(state.getTierDisplayName('Tier4')).toBe('Transcendent');
    });

    it('should return tier_id as fallback for unknown tier', () => {
      state.tiers = [];
      state.buildTierLookup();

      expect(state.getTierDisplayName('TierUnknown')).toBe('TierUnknown');
    });
  });

  describe('getStatName edge cases', () => {
    it('should return "Unknown Stat" for null or undefined stat_id', () => {
      state.buildStatLookup();

      expect(state.getStatName(null)).toBe('Unknown Stat');
      expect(state.getStatName(undefined)).toBe('Unknown Stat');
    });

    it('should return the stat_id itself for unrecognized IDs', () => {
      state.buildStatLookup();

      expect(state.getStatName('some_random_id')).toBe('some_random_id');
    });
  });
});
