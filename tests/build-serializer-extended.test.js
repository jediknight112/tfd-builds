import { describe, it, expect, beforeEach } from 'vitest';
import { BuildSerializer } from '../src/build-serializer.js';

describe('BuildSerializer - Extended Coverage', () => {
  let serializer;
  let mockState;

  beforeEach(() => {
    mockState = {
      descendants: [
        { descendant_id: 'desc1', descendant_name: 'Test Descendant' },
      ],
      modules: [
        { module_id: 'mod_skill', module_name: 'Skill Module' },
        { module_id: 'mod_sub', module_name: 'Sub Module' },
        { module_id: 'mod_main1', module_name: 'Main Module 1' },
        { module_id: 'wmod1', module_name: 'Weapon Mod 1' },
        { module_id: 'wmod2', module_name: 'Weapon Mod 2' },
        { module_id: 'trigger1', module_name: 'Trigger Module' },
      ],
      weapons: [
        { weapon_id: 'wpn1', weapon_name: 'Test Rifle' },
        { weapon_id: 'wpn2', weapon_name: 'Test Pistol' },
      ],
      reactors: [{ reactor_id: 'reactor1', reactor_name: 'Test Reactor' }],
      externalComponents: [
        {
          external_component_id: 'ec1',
          external_component_name: 'Test Sensor',
        },
        {
          external_component_id: 'ec2',
          external_component_name: 'Test Memory',
        },
      ],
      archeTuningNodes: [
        { node_id: 'node1', node_name: 'Node A', required_tuning_point: 2 },
        { node_id: 'node2', node_name: 'Node B', required_tuning_point: 3 },
      ],
      archeTuningBoards: [
        { arche_tuning_board_id: 'board1', board_name: 'Test Board' },
      ],
      coreTypes: [{ core_type_id: 'ct1', core_type: 'Free Augmentation' }],
      currentDescendant: { descendant_id: 'desc1' },
      currentBuild: {
        triggerModule: null,
        descendantModules: Array(12).fill(null),
        weapons: Array(3)
          .fill(null)
          .map(() => ({
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

  // --- Serialize tests ---

  describe('serialize', () => {
    it('should throw when no descendant is selected', () => {
      mockState.currentDescendant = null;
      expect(() => serializer.serialize()).toThrow('No descendant selected');
    });

    it('should omit empty fields for a minimal build', () => {
      const data = serializer.serialize();

      expect(data.v).toBe(2);
      expect(data.d).toBe('desc1');
      expect(data.t).toBeUndefined();
      expect(data.m).toBeUndefined();
      expect(data.w).toBeUndefined();
      expect(data.r).toBeUndefined();
      expect(data.s).toBeUndefined();
      expect(data.e).toBeUndefined();
      expect(data.a).toBeUndefined();
    });

    it('should serialize trigger module', () => {
      mockState.currentBuild.triggerModule = { module_id: 'trigger1' };

      const data = serializer.serialize();

      expect(data.t).toBe('trigger1');
    });

    it('should serialize weapons with modules, custom stats, and core stats', () => {
      mockState.currentBuild.weapons[0] = {
        weapon: { weapon_id: 'wpn1' },
        modules: [
          { module_id: 'wmod1' },
          null,
          { module_id: 'wmod2' },
          ...Array(7).fill(null),
        ],
        customStats: [
          { stat_id: 'stat_atk', stat_value: 150 },
          { stat_id: 'stat_def', stat_value: 80 },
        ],
        coreType: { core_type_id: 'ct1' },
        coreStats: [{ option_id: 'opt1', stat_id: 'stat_hp', stat_value: 500 }],
      };

      const data = serializer.serialize();

      expect(data.w).toBeDefined();
      expect(data.w).toHaveLength(1);

      const w = data.w[0];
      expect(w[0]).toBe('wpn1');
      expect(w[1]).toEqual([
        'wmod1',
        null,
        'wmod2',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
      expect(w[2]).toEqual([
        ['stat_atk', 150],
        ['stat_def', 80],
      ]);
      expect(w[3]).toBe('ct1');
      expect(w[4]).toEqual([['opt1', 'stat_hp', 500]]);
    });

    it('should serialize external components with core stats', () => {
      mockState.currentBuild.externalComponents = {
        Sensor: {
          component: { external_component_id: 'ec1' },
          coreStats: [
            { option_id: 'opt_s1', stat_id: 'stat_s1', stat_value: 200 },
          ],
        },
      };

      const data = serializer.serialize();

      expect(data.e).toBeDefined();
      expect(data.e.Sensor).toBeDefined();
      expect(data.e.Sensor[0]).toBe('ec1');
      expect(data.e.Sensor[1]).toEqual([['opt_s1', 'stat_s1', 200]]);
    });

    it('should serialize arche tuning with board and selected nodes', () => {
      mockState.currentBuild.archeTuning = {
        board: { arche_tuning_board_id: 'board1' },
        selectedNodes: [
          { node_id: 'node1', position_row: 9, position_column: 10 },
          { node_id: 'node2', position_row: 8, position_column: 10 },
        ],
      };

      const data = serializer.serialize();

      expect(data.a).toBeDefined();
      expect(data.a[0]).toBe('board1');
      expect(data.a[1]).toEqual([
        ['node1', 9, 10],
        ['node2', 8, 10],
      ]);
    });
  });

  // --- Deserialize tests ---

  describe('deserialize', () => {
    it('should return invalid for unknown descendant', () => {
      const result = serializer.deserialize({
        v: 2,
        d: 'nonexistent_desc',
      });

      expect(result.valid).toBe(false);
      expect(result.build).toBeNull();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Descendant not found');
    });

    it('should generate warnings for missing modules and weapons', () => {
      const result = serializer.deserialize({
        v: 2,
        d: 'desc1',
        t: 'missing_trigger',
        m: [[0, 'missing_mod']],
        w: [['missing_weapon', ['missing_wmod'], null, 'missing_core', null]],
        r: 'missing_reactor',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(4);
      expect(
        result.warnings.some((w) => w.includes('Trigger module not found'))
      ).toBe(true);
      expect(result.warnings.some((w) => w.includes('Module not found'))).toBe(
        true
      );
      expect(
        result.warnings.some((w) => w.includes('Weapon 1 not found'))
      ).toBe(true);
      expect(result.warnings.some((w) => w.includes('Reactor not found'))).toBe(
        true
      );
    });

    it('should deserialize weapons with modules, custom stats, and core stats', () => {
      const buildData = {
        v: 2,
        d: 'desc1',
        w: [
          [
            'wpn1',
            ['wmod1', null, 'wmod2'],
            [
              ['stat_atk', 150],
              ['stat_def', 80],
            ],
            'ct1',
            [['opt1', 'stat_hp', 500]],
          ],
        ],
      };

      const result = serializer.deserialize(buildData);

      expect(result.valid).toBe(true);
      const weapon = result.build.weapons[0];
      expect(weapon.weapon.weapon_id).toBe('wpn1');
      expect(weapon.modules[0].module_id).toBe('wmod1');
      expect(weapon.modules[1]).toBeNull();
      expect(weapon.modules[2].module_id).toBe('wmod2');
      expect(weapon.customStats).toEqual([
        { stat_id: 'stat_atk', stat_value: 150 },
        { stat_id: 'stat_def', stat_value: 80 },
      ]);
      expect(weapon.coreType.core_type_id).toBe('ct1');
      expect(weapon.coreStats).toEqual([
        { option_id: 'opt1', stat_id: 'stat_hp', stat_value: 500 },
      ]);
    });

    it('should deserialize external components', () => {
      const buildData = {
        v: 2,
        d: 'desc1',
        e: {
          Sensor: ['ec1', [['opt_s1', 'stat_s1', 200]]],
        },
      };

      const result = serializer.deserialize(buildData);

      expect(result.valid).toBe(true);
      const sensor = result.build.externalComponents.Sensor;
      expect(sensor.component.external_component_id).toBe('ec1');
      expect(sensor.coreStats).toEqual([
        { option_id: 'opt_s1', stat_id: 'stat_s1', stat_value: 200 },
      ]);
    });

    it('should deserialize arche tuning nodes with positions', () => {
      const buildData = {
        v: 2,
        d: 'desc1',
        a: [
          'board1',
          [
            ['node1', 9, 10],
            ['node2', 8, 10],
          ],
        ],
      };

      const result = serializer.deserialize(buildData);

      expect(result.valid).toBe(true);
      expect(result.build.archeTuning).toBeDefined();
      expect(result.build.archeTuning.board.arche_tuning_board_id).toBe(
        'board1'
      );
      expect(result.build.archeTuning.selectedNodes).toHaveLength(2);
      expect(result.build.archeTuning.selectedNodes[0].node_id).toBe('node1');
      expect(result.build.archeTuning.selectedNodes[0].position_row).toBe(9);
      expect(result.build.archeTuning.selectedNodes[0].position_column).toBe(
        10
      );
    });

    it('should warn for missing arche tuning board and nodes', () => {
      const buildData = {
        v: 2,
        d: 'desc1',
        a: ['missing_board', [['missing_node', 5, 5]]],
      };

      const result = serializer.deserialize(buildData);

      expect(result.valid).toBe(true);
      expect(result.build.archeTuning).toBeNull();
      expect(
        result.warnings.some((w) => w.includes('Arche tuning board not found'))
      ).toBe(true);
      expect(
        result.warnings.some((w) => w.includes('Arche tuning node not found'))
      ).toBe(true);
    });
  });

  // --- Compress / Decompress ---

  describe('compress and decompress', () => {
    it('should roundtrip arbitrary JSON through compression', () => {
      const original = { v: 2, d: 'desc1', m: [[0, 'mod1']], w: [['wpn1']] };

      const compressed = serializer.compress(original);
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);

      const decompressed = serializer.decompress(compressed);
      expect(decompressed).toEqual(original);
    });

    it('should return null for garbage input during decompress', () => {
      const result = serializer.decompress('!!!invalid_garbage_data!!!');
      expect(result).toBeNull();
    });

    it('should return null for empty string during decompress', () => {
      const result = serializer.decompress('');
      expect(result).toBeNull();
    });
  });

  // --- V1 to V2 Conversion ---

  describe('V1 to V2 conversion', () => {
    it('should convert v1 weapons to v2 format', () => {
      const v1Data = {
        version: '1.0',
        descendant_id: 'desc1',
        weapons: [
          {
            weapon_id: 'wpn1',
            module_ids: ['wmod1', null, 'wmod2'],
            custom_stats: [{ stat_id: 'stat_atk', stat_value: 100 }],
            core_type_id: 'ct1',
            core_stats: [
              { option_id: 'opt1', stat_id: 'stat_hp', stat_value: 500 },
            ],
          },
        ],
      };

      const result = serializer.deserialize(v1Data);

      expect(result.valid).toBe(true);
      const weapon = result.build.weapons[0];
      expect(weapon.weapon.weapon_id).toBe('wpn1');
      expect(weapon.modules[0].module_id).toBe('wmod1');
      expect(weapon.modules[2].module_id).toBe('wmod2');
      expect(weapon.customStats).toEqual([
        { stat_id: 'stat_atk', stat_value: 100 },
      ]);
      expect(weapon.coreType.core_type_id).toBe('ct1');
      expect(weapon.coreStats).toEqual([
        { option_id: 'opt1', stat_id: 'stat_hp', stat_value: 500 },
      ]);
    });

    it('should convert v1 external components to v2 format', () => {
      const v1Data = {
        version: '1.0',
        descendant_id: 'desc1',
        external_components: {
          Sensor: {
            component_id: 'ec1',
            core_stats: [
              { option_id: 'opt_s1', stat_id: 'stat_s1', stat_value: 200 },
            ],
          },
        },
      };

      const result = serializer.deserialize(v1Data);

      expect(result.valid).toBe(true);
      const sensor = result.build.externalComponents.Sensor;
      expect(sensor.component.external_component_id).toBe('ec1');
      expect(sensor.coreStats).toEqual([
        { option_id: 'opt_s1', stat_id: 'stat_s1', stat_value: 200 },
      ]);
    });

    it('should convert v1 arche tuning to v2 format', () => {
      const v1Data = {
        version: '1.0',
        descendant_id: 'desc1',
        arche_tuning: {
          board_id: 'board1',
          selected_nodes: [
            { node_id: 'node1', position_row: 9, position_column: 10 },
          ],
        },
      };

      const result = serializer.deserialize(v1Data);

      expect(result.valid).toBe(true);
      expect(result.build.archeTuning.board.arche_tuning_board_id).toBe(
        'board1'
      );
      expect(result.build.archeTuning.selectedNodes).toHaveLength(1);
      expect(result.build.archeTuning.selectedNodes[0].node_id).toBe('node1');
      expect(result.build.archeTuning.selectedNodes[0].position_row).toBe(9);
    });

    it('should convert v1 reactor stats to v2 format', () => {
      const v1Data = {
        version: '1.0',
        descendant_id: 'desc1',
        reactor_id: 'reactor1',
        reactor_additional_stats: [
          { stat_name: 'ATK', stat_value: 1500 },
          { stat_name: 'DEF', stat_value: 800 },
        ],
      };

      const result = serializer.deserialize(v1Data);

      expect(result.valid).toBe(true);
      expect(result.build.reactor.reactor_id).toBe('reactor1');
      expect(result.build.reactorAdditionalStats).toEqual([
        { name: 'ATK', value: 1500 },
        { name: 'DEF', value: 800 },
      ]);
    });
  });
});
