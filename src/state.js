import { getApiKeys } from './config.js';

// State Management
class AppState {
  constructor() {
    this.descendants = [];
    this.modules = [];
    this.weapons = [];
    this.reactors = [];
    this.externalComponents = [];
    this.fellows = [];
    this.vehicles = [];
    this.archeTuningNodes = [];
    this.archeTuningBoards = [];
    this.archeTuningBoardGroups = [];
    this.descendantGroups = [];
    this.weaponTypes = [];
    this.tiers = [];
    this.stats = [];
    this.coreSlots = [];
    this.coreTypes = [];
    this.statLookup = {}; // Map stat_id to stat_name
    this.weaponTypeNameLookup = {}; // Map weapon_type_name to weapon_type
    this.coreSlotLookup = {}; // Map core_slot_id to core slot data
    this.coreTypeLookup = {}; // Map core_type_id to core type data
    this.currentDescendant = null;
    this.currentBuild = {
      triggerModule: null,
      descendantModules: Array(12).fill(null),
      weapons: Array(3).fill(null).map(() => ({
        weapon: null,
        modules: Array(10).fill(null),
        customStats: [],
        coreType: null,
        coreStats: [] // Array of { option_id, stat_id, stat_value }
      })),
      reactor: null,
      reactorAdditionalStats: [
        { name: '', value: 0 },
        { name: '', value: 0 }
      ],
      externalComponents: {}, // { 'Auxiliary Power': { component, coreStats }, ... }
      archeTuning: null,
      fellow: null,
      vehicle: null,
      inversionReinforcement: null
    };
    this.currentTab = 'modules';
    this.apiKeys = getApiKeys();
    this.dataLoaded = false;
    this.currentModuleSlot = null; // Track which module slot is being filled
    this.currentWeaponSlot = null; // Track which weapon slot is being filled (weapon or module)
    this.currentExternalComponentCoreType = null; // Track which external component is being configured for cores
    this.selectedStatId = null; // Track selected stat in custom stat selector
  }

  setApiKeys(workerApiKey, nexonApiKey) {
    this.apiKeys = { workerApiKey, nexonApiKey };
    if (workerApiKey) localStorage.setItem('workerApiKey', workerApiKey);
    if (nexonApiKey) localStorage.setItem('nexonApiKey', nexonApiKey);
  }

  // Build stat lookup map
  buildStatLookup() {
    this.statLookup = {};
    if (this.stats && Array.isArray(this.stats)) {
      this.stats.forEach(stat => {
        if (stat.stat_id && stat.stat_name) {
          this.statLookup[stat.stat_id] = stat.stat_name;
        }
      });
    }
  }

  // Build weapon type lookup map
  buildWeaponTypeLookup() {
    this.weaponTypeNameLookup = {};
    if (this.weaponTypes && Array.isArray(this.weaponTypes)) {
      this.weaponTypes.forEach(weaponType => {
        if (weaponType.weapon_type_name && weaponType.weapon_type) {
          this.weaponTypeNameLookup[weaponType.weapon_type_name] = weaponType.weapon_type;
        }
      });
    }
  }

  // Build core slot lookup map
  buildCoreSlotLookup() {
    this.coreSlotLookup = {};
    if (this.coreSlots && Array.isArray(this.coreSlots)) {
      this.coreSlots.forEach(coreSlot => {
        if (coreSlot.core_slot_id) {
          this.coreSlotLookup[coreSlot.core_slot_id] = coreSlot;
        }
      });
    }
  }

  // Build core type lookup map
  buildCoreTypeLookup() {
    this.coreTypeLookup = {};
    if (this.coreTypes && Array.isArray(this.coreTypes)) {
      this.coreTypes.forEach(coreType => {
        if (coreType.core_type_id) {
          this.coreTypeLookup[coreType.core_type_id] = coreType;
        }
      });
    }
  }

  // Get stat name by ID
  getStatName(statId) {
    return this.statLookup[statId] || statId || 'Unknown Stat';
  }

  // Get weapon type code from weapon type name
  getWeaponTypeCode(weaponTypeName) {
    return this.weaponTypeNameLookup[weaponTypeName] || null;
  }

  // Get core slot by ID
  getCoreSlot(coreSlotId) {
    return this.coreSlotLookup[coreSlotId] || null;
  }

  // Get core type by ID
  getCoreType(coreTypeId) {
    return this.coreTypeLookup[coreTypeId] || null;
  }
}

export const state = new AppState();
