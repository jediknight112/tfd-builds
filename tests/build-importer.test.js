import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API client
vi.mock('../src/api-client.js', () => ({
  apiClient: {
    resolveUsername: vi.fn(),
    fetchUserDescendant: vi.fn(),
    fetchUserWeapon: vi.fn(),
    fetchUserReactor: vi.fn(),
    fetchUserExternalComponent: vi.fn(),
    fetchUserArcheTuning: vi.fn(),
  },
}));

// Mock the state module
vi.mock('../src/state.js', () => ({
  state: {
    descendants: [],
    modules: [],
    weapons: [],
    reactors: [],
    externalComponents: [],
    archeTuningBoards: [],
    archeTuningNodes: [],
    language: 'en',
    // Reverse-lookup: localized equipment type → English key
    getEnglishEquipmentType(localizedType) {
      const map = {
        'Auxiliary Power': 'Auxiliary Power',
        Sensor: 'Sensor',
        Memory: 'Memory',
        Processor: 'Processor',
        // German
        Hilfsenergie: 'Auxiliary Power',
        Speicher: 'Memory',
        Prozessor: 'Processor',
        // zh-TW
        輔助電源: 'Auxiliary Power',
        感應器: 'Sensor',
        儲存器: 'Memory',
        處理裝置: 'Processor',
      };
      return map[localizedType] || localizedType;
    },
  },
}));

import { BuildImporter } from '../src/modules/build-importer.js';
import { apiClient } from '../src/api-client.js';
import { state } from '../src/state.js';

describe('BuildImporter', () => {
  let importer;

  beforeEach(() => {
    importer = new BuildImporter();
    vi.clearAllMocks();

    // Set up basic metadata
    state.descendants = [
      {
        descendant_id: 'desc_001',
        descendant_name: 'Bunny',
        descendant_group_id: 'dg1',
      },
    ];

    state.modules = [
      {
        module_id: 'mod_skill_1',
        module_name: 'Electric Shock',
        module_class: 'Descendant',
        module_type: 'Skill',
      },
      {
        module_id: 'mod_sub_1',
        module_name: 'Sub Module A',
        module_class: 'Descendant',
        module_type: 'Sub',
      },
      {
        module_id: 'mod_main_1',
        module_name: 'Main Module 1',
        module_class: 'Descendant',
        module_type: 'Main',
      },
      {
        module_id: 'mod_main_2',
        module_name: 'Main Module 2',
        module_class: 'Descendant',
        module_type: 'Main',
      },
      {
        module_id: 'mod_trigger_1',
        module_name: 'Trigger X',
        module_class: 'Descendant',
        module_type: 'Trigger',
        available_module_slot_type: ['Trigger'],
      },
      {
        module_id: 'mod_ancestors_1',
        module_name: 'Ancestors Module',
        module_class: 'Descendant',
        module_type: 'Ancestors',
        available_module_slot_type: ['Main'],
      },
      {
        module_id: 'wmod_1',
        module_name: 'Weapon Mod 1',
        module_class: 'Weapon',
        module_type: 'Main',
      },
      {
        module_id: 'wmod_2',
        module_name: 'Weapon Mod 2',
        module_class: 'Weapon',
        module_type: 'Main',
      },
    ];

    state.weapons = [
      { weapon_id: 'wpn_001', weapon_name: 'Thunder Cage' },
      { weapon_id: 'wpn_002', weapon_name: 'Enduring Legacy' },
    ];

    state.reactors = [
      { reactor_id: 'reactor_001', reactor_name: 'Materialized Mechanics' },
    ];

    state.externalComponents = [
      {
        external_component_id: 'ec_001',
        external_component_name: 'Sensor A',
        external_component_equipment_type: 'Sensor',
      },
      {
        external_component_id: 'ec_002',
        external_component_name: 'Memory B',
        external_component_equipment_type: 'Memory',
      },
    ];

    state.archeTuningBoards = [
      {
        arche_tuning_board_id: 'board_001',
        board_name: 'Bunny Board',
        node: [
          { node_id: 'anode_1', position_row: 9, position_column: 10 },
          { node_id: 'anode_2', position_row: 8, position_column: 10 },
        ],
      },
    ];

    state.archeTuningNodes = [
      {
        node_id: 'anode_1',
        node_name: 'Node Alpha',
        required_tuning_point: 2,
      },
      {
        node_id: 'anode_2',
        node_name: 'Node Beta',
        required_tuning_point: 3,
      },
    ];
  });

  describe('importBuild - username resolution', () => {
    it('should throw when username cannot be resolved', async () => {
      apiClient.resolveUsername.mockResolvedValue(null);

      await expect(importer.importBuild('BadUser#0000')).rejects.toThrow(
        'Could not resolve username'
      );
    });

    it('should throw when ouid is missing from response', async () => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: null });

      await expect(importer.importBuild('BadUser#0000')).rejects.toThrow(
        'Could not resolve username'
      );
    });
  });

  describe('importBuild - descendant mapping', () => {
    it('should throw when descendant is not found in metadata', async () => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'unknown_desc',
        module: [],
      });
      apiClient.fetchUserWeapon.mockResolvedValue({ weapon: [] });
      apiClient.fetchUserReactor.mockResolvedValue({});
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [],
      });
      apiClient.fetchUserArcheTuning.mockResolvedValue({});

      await expect(importer.importBuild('User#1234')).rejects.toThrow(
        'Descendant not found in metadata'
      );
    });
  });

  describe('importBuild - module slot mapping', () => {
    beforeEach(() => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserWeapon.mockResolvedValue({ weapon: [] });
      apiClient.fetchUserReactor.mockResolvedValue({});
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [],
      });
      apiClient.fetchUserArcheTuning.mockResolvedValue({});
    });

    it('should map Skill slot to index 0', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [{ module_slot_id: 'Skill 1', module_id: 'mod_skill_1' }],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.descendantModules[0]).not.toBeNull();
      expect(result.build.descendantModules[0].module_id).toBe('mod_skill_1');
    });

    it('should map Sub slot to index 6', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [{ module_slot_id: 'Sub 1', module_id: 'mod_sub_1' }],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.descendantModules[6]).not.toBeNull();
      expect(result.build.descendantModules[6].module_id).toBe('mod_sub_1');
    });

    it('should map Main 1-5 to slots 1-5', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [
          { module_slot_id: 'Main 1', module_id: 'mod_main_1' },
          { module_slot_id: 'Main 3', module_id: 'mod_main_2' },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.descendantModules[1].module_id).toBe('mod_main_1');
      expect(result.build.descendantModules[3].module_id).toBe('mod_main_2');
    });

    it('should map Main 6-10 to slots 7-11', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [{ module_slot_id: 'Main 6', module_id: 'mod_main_1' }],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.descendantModules[7].module_id).toBe('mod_main_1');
    });

    it('should detect trigger modules from numeric slot IDs', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [{ module_slot_id: '9', module_id: 'mod_trigger_1' }],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.triggerModule).not.toBeNull();
      expect(result.build.triggerModule.module_id).toBe('mod_trigger_1');
    });

    it('should place Main-type modules from numeric slots into first empty Main slot', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [
          { module_slot_id: 'Main 1', module_id: 'mod_main_1' },
          { module_slot_id: '9', module_id: 'mod_ancestors_1' },
        ],
      });

      const result = await importer.importBuild('User#1234');

      // Main 1 fills slot 1, Ancestors module fills first empty Main slot (slot 2)
      expect(result.build.descendantModules[1].module_id).toBe('mod_main_1');
      expect(result.build.descendantModules[2].module_id).toBe(
        'mod_ancestors_1'
      );
      expect(result.warnings).toHaveLength(0);
    });

    it('should use two-pass approach so numeric slots do not conflict with later named slots', async () => {
      // Simulates: "9" appears BEFORE "Main 2" in API order.
      // Without two-pass, "9" would fill slot 2, then "Main 2" would overwrite it.
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [
          { module_slot_id: 'Main 1', module_id: 'mod_main_1' },
          { module_slot_id: '9', module_id: 'mod_ancestors_1' },
          { module_slot_id: 'Main 2', module_id: 'mod_main_2' },
        ],
      });

      const result = await importer.importBuild('User#1234');

      // Named slots placed first: Main 1 → slot 1, Main 2 → slot 2
      // Then numeric: Ancestors → first empty Main slot = slot 3
      expect(result.build.descendantModules[1].module_id).toBe('mod_main_1');
      expect(result.build.descendantModules[2].module_id).toBe('mod_main_2');
      expect(result.build.descendantModules[3].module_id).toBe(
        'mod_ancestors_1'
      );
      expect(result.warnings).toHaveLength(0);
    });

    it('should generate warning for unknown module_id', async () => {
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [{ module_slot_id: 'Skill 1', module_id: 'unknown_mod' }],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.warnings.some((w) => w.includes('Module not found'))).toBe(
        true
      );
    });
  });

  describe('importBuild - weapon mapping', () => {
    beforeEach(() => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [],
      });
      apiClient.fetchUserReactor.mockResolvedValue({});
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [],
      });
      apiClient.fetchUserArcheTuning.mockResolvedValue({});
    });

    it('should map weapons to correct slot indices', async () => {
      apiClient.fetchUserWeapon.mockResolvedValue({
        weapon: [
          { weapon_slot_id: '1', weapon_id: 'wpn_001', module: [] },
          { weapon_slot_id: '2', weapon_id: 'wpn_002', module: [] },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.weapons[0].weapon.weapon_id).toBe('wpn_001');
      expect(result.build.weapons[1].weapon.weapon_id).toBe('wpn_002');
      expect(result.build.weapons[2].weapon).toBeNull();
    });

    it('should map weapon modules to correct indices', async () => {
      apiClient.fetchUserWeapon.mockResolvedValue({
        weapon: [
          {
            weapon_slot_id: '1',
            weapon_id: 'wpn_001',
            module: [
              { module_slot_id: '1', module_id: 'wmod_1' },
              { module_slot_id: '3', module_id: 'wmod_2' },
            ],
          },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.weapons[0].modules[0].module_id).toBe('wmod_1');
      expect(result.build.weapons[0].modules[1]).toBeNull();
      expect(result.build.weapons[0].modules[2].module_id).toBe('wmod_2');
    });

    it('should map weapon additional stats to customStats', async () => {
      apiClient.fetchUserWeapon.mockResolvedValue({
        weapon: [
          {
            weapon_slot_id: '1',
            weapon_id: 'wpn_001',
            module: [],
            weapon_additional_stat: [
              {
                additional_stat_name: 'Firearm ATK',
                additional_stat_value: '1500',
              },
            ],
          },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.weapons[0].customStats).toHaveLength(1);
      expect(result.build.weapons[0].customStats[0].stat_id).toBe(
        'Firearm ATK'
      );
      expect(result.build.weapons[0].customStats[0].stat_value).toBe(1500);
    });
  });

  describe('importBuild - reactor mapping', () => {
    beforeEach(() => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [],
      });
      apiClient.fetchUserWeapon.mockResolvedValue({ weapon: [] });
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [],
      });
      apiClient.fetchUserArcheTuning.mockResolvedValue({});
    });

    it('should map reactor and additional stats', async () => {
      apiClient.fetchUserReactor.mockResolvedValue({
        reactor_id: 'reactor_001',
        reactor_additional_stat: [
          { additional_stat_name: 'ATK', additional_stat_value: '1500' },
          { additional_stat_name: 'DEF', additional_stat_value: '800' },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.reactor.reactor_id).toBe('reactor_001');
      expect(result.build.reactorAdditionalStats).toHaveLength(2);
      expect(result.build.reactorAdditionalStats[0]).toEqual({
        name: 'ATK',
        value: 1500,
      });
    });

    it('should default to 2 empty stats when none provided', async () => {
      apiClient.fetchUserReactor.mockResolvedValue({
        reactor_id: 'reactor_001',
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.reactorAdditionalStats).toHaveLength(2);
      expect(result.build.reactorAdditionalStats[0]).toEqual({
        name: '',
        value: 0,
      });
    });
  });

  describe('importBuild - external component mapping', () => {
    beforeEach(() => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [],
      });
      apiClient.fetchUserWeapon.mockResolvedValue({ weapon: [] });
      apiClient.fetchUserReactor.mockResolvedValue({});
      apiClient.fetchUserArcheTuning.mockResolvedValue({});
    });

    it('should map external components by equipment type', async () => {
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [
          {
            external_component_id: 'ec_001',
            core: [
              {
                core_slot_id: 'cs1',
                core_option_name: 'Max HP',
                core_option_value: '5000',
              },
            ],
          },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.externalComponents.Sensor).toBeDefined();
      expect(
        result.build.externalComponents.Sensor.component.external_component_id
      ).toBe('ec_001');
      expect(result.build.externalComponents.Sensor.coreStats).toHaveLength(1);
      expect(
        result.build.externalComponents.Sensor.coreStats[0].stat_value
      ).toBe(5000);
    });

    it('should warn for unknown external component IDs', async () => {
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [{ external_component_id: 'unknown_ec', core: [] }],
      });

      const result = await importer.importBuild('User#1234');

      expect(
        result.warnings.some((w) => w.includes('External component not found'))
      ).toBe(true);
    });

    it('should convert localized equipment types to English keys', async () => {
      // Simulate zh-TW metadata where equipment type is localized
      state.externalComponents = [
        {
          external_component_id: 'ec_zh_001',
          external_component_name: '感應器 A',
          external_component_equipment_type: '感應器', // zh-TW for "Sensor"
        },
        {
          external_component_id: 'ec_zh_002',
          external_component_name: '儲存器 B',
          external_component_equipment_type: '儲存器', // zh-TW for "Memory"
        },
      ];

      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [
          { external_component_id: 'ec_zh_001', core: [] },
          { external_component_id: 'ec_zh_002', core: [] },
        ],
      });

      const result = await importer.importBuild('User#1234');

      // Should be stored under English keys, not localized ones
      expect(result.build.externalComponents.Sensor).toBeDefined();
      expect(result.build.externalComponents.Memory).toBeDefined();
      expect(result.build.externalComponents['感應器']).toBeUndefined();
      expect(result.build.externalComponents['儲存器']).toBeUndefined();
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('importBuild - arche tuning mapping', () => {
    beforeEach(() => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        module: [],
      });
      apiClient.fetchUserWeapon.mockResolvedValue({ weapon: [] });
      apiClient.fetchUserReactor.mockResolvedValue({});
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [],
      });
    });

    it('should map arche tuning boards to correct slot indices', async () => {
      apiClient.fetchUserArcheTuning.mockResolvedValue({
        arche_tuning: [
          {
            slot_id: '0',
            arche_tuning_board: [
              {
                arche_tuning_board_id: 'board_001',
                node: [
                  {
                    node_id: 'anode_1',
                    position_row: '9',
                    position_column: '10',
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.archeTuning[0]).not.toBeNull();
      expect(result.build.archeTuning[0].board.arche_tuning_board_id).toBe(
        'board_001'
      );
      expect(result.build.archeTuning[0].selectedNodes).toHaveLength(1);
      expect(result.build.archeTuning[0].selectedNodes[0].node_id).toBe(
        'anode_1'
      );
      expect(result.build.archeTuning[0].selectedNodes[0].position_row).toBe(9);
      expect(result.build.archeTuning[0].selectedNodes[0].position_column).toBe(
        10
      );
      expect(result.build.archeTuning[1]).toBeNull();
      expect(result.build.archeTuning[2]).toBeNull();
    });

    it('should handle multiple board slots', async () => {
      apiClient.fetchUserArcheTuning.mockResolvedValue({
        arche_tuning: [
          {
            slot_id: '0',
            arche_tuning_board: [
              {
                arche_tuning_board_id: 'board_001',
                node: [
                  {
                    node_id: 'anode_1',
                    position_row: '9',
                    position_column: '10',
                  },
                ],
              },
            ],
          },
          {
            slot_id: '2',
            arche_tuning_board: [
              {
                arche_tuning_board_id: 'board_001',
                node: [
                  {
                    node_id: 'anode_2',
                    position_row: '8',
                    position_column: '10',
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(result.build.archeTuning[0]).not.toBeNull();
      expect(result.build.archeTuning[1]).toBeNull();
      expect(result.build.archeTuning[2]).not.toBeNull();
      expect(result.build.archeTuning[2].selectedNodes[0].node_id).toBe(
        'anode_2'
      );
    });

    it('should handle no arche tuning data', async () => {
      apiClient.fetchUserArcheTuning.mockResolvedValue({});

      const result = await importer.importBuild('User#1234');

      expect(result.build.archeTuning).toEqual([null, null, null]);
    });

    it('should warn for unknown arche tuning board', async () => {
      apiClient.fetchUserArcheTuning.mockResolvedValue({
        arche_tuning: [
          {
            slot_id: '0',
            arche_tuning_board: [
              {
                arche_tuning_board_id: 'unknown_board',
                node: [],
              },
            ],
          },
        ],
      });

      const result = await importer.importBuild('User#1234');

      expect(
        result.warnings.some((w) => w.includes('Arche tuning board not found'))
      ).toBe(true);
    });
  });

  describe('importBuild - full integration', () => {
    it('should return a complete build with all mapped data', async () => {
      apiClient.resolveUsername.mockResolvedValue({ ouid: 'test-ouid' });
      apiClient.fetchUserDescendant.mockResolvedValue({
        descendant_id: 'desc_001',
        user_name: 'TestPlayer#1234',
        module: [
          { module_slot_id: 'Skill 1', module_id: 'mod_skill_1' },
          { module_slot_id: 'Main 1', module_id: 'mod_main_1' },
          { module_slot_id: 'Sub 1', module_id: 'mod_sub_1' },
        ],
      });
      apiClient.fetchUserWeapon.mockResolvedValue({
        weapon: [{ weapon_slot_id: '1', weapon_id: 'wpn_001', module: [] }],
      });
      apiClient.fetchUserReactor.mockResolvedValue({
        reactor_id: 'reactor_001',
      });
      apiClient.fetchUserExternalComponent.mockResolvedValue({
        external_component: [{ external_component_id: 'ec_001', core: [] }],
      });
      apiClient.fetchUserArcheTuning.mockResolvedValue({});

      const result = await importer.importBuild('TestPlayer#1234');

      expect(result.descendant.descendant_id).toBe('desc_001');
      expect(result.userName).toBe('TestPlayer#1234');
      expect(result.build.descendantModules[0].module_id).toBe('mod_skill_1');
      expect(result.build.descendantModules[1].module_id).toBe('mod_main_1');
      expect(result.build.descendantModules[6].module_id).toBe('mod_sub_1');
      expect(result.build.weapons[0].weapon.weapon_id).toBe('wpn_001');
      expect(result.build.reactor.reactor_id).toBe('reactor_001');
      expect(result.build.externalComponents.Sensor).toBeDefined();
      expect(result.warnings).toHaveLength(0);
    });
  });
});
