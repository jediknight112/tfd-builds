import LZString from 'lz-string';

/**
 * Build Serializer - Handles encoding/decoding builds to/from URL-safe strings
 * Uses LZ-string for compression and localStorage for backup
 *
 * Compact format (v2) uses single-letter keys to minimize URL length:
 * v: version, d: descendant_id, t: trigger_module_id
 * m: descendant_modules - [[slot_index, module_id]] preserves positions (critical for slots 0 & 6)
 * w: weapons array [weapon_id, [modules], [[stat_id,value]], core_type_id, [[opt,stat,val]]]
 * r: reactor_id, s: reactor_stats, e: external_components, a: arche_tuning
 */
export class BuildSerializer {
  constructor(state) {
    this.state = state;
    this.version = 2; // v2 uses compact format
    this.localStorageKey = 'tfd_last_build';
  }

  /**
   * Serialize current build to ultra-compact structure
   * @returns {Object} Minimal build representation with short keys
   */
  serialize() {
    const build = this.state.currentBuild;
    const descendantId = this.state.currentDescendant?.descendant_id || null;

    if (!descendantId) {
      throw new Error('No descendant selected');
    }

    const data = {
      v: this.version, // version
      d: descendantId, // descendant_id
    };

    // Only include non-null values to save space
    if (build.triggerModule?.module_id) {
      data.t = build.triggerModule.module_id; // trigger_module
    }

    // Descendant modules - preserve slot positions with [index, module_id] pairs
    // This is critical because slot 0 (Skill) and slot 6 (Sub) have special restrictions
    const descendantMods = [];
    build.descendantModules.forEach((m, idx) => {
      if (m?.module_id) {
        descendantMods.push([idx, m.module_id]);
      }
    });
    if (descendantMods.length) {
      data.m = descendantMods;
    }

    // Weapons - ultra compact: [weaponId, [modIds], [[statId,val]], coreTypeId, [[opt,stat,val]]]
    const weapons = build.weapons
      .map((w) => {
        if (!w.weapon?.weapon_id && !w.modules.some((m) => m)) return null;

        const weapon = [];
        weapon[0] = w.weapon?.weapon_id || null; // weapon_id

        // Module IDs - only include non-null
        const modIds = w.modules.map((m) => m?.module_id || null);
        weapon[1] = modIds.some((id) => id) ? modIds : null;

        // Custom stats: [[stat_id, stat_value]]
        const customStats = (w.customStats || [])
          .filter((cs) => cs && cs.stat_id)
          .map((cs) => [cs.stat_id, cs.stat_value]);
        weapon[2] = customStats.length ? customStats : null;

        weapon[3] = w.coreType?.core_type_id || null; // core_type_id

        // Core stats: [[option_id, stat_id, stat_value]]
        const coreStats = (w.coreStats || [])
          .filter((cs) => cs && cs.option_id)
          .map((cs) => [cs.option_id, cs.stat_id, cs.stat_value]);
        weapon[4] = coreStats.length ? coreStats : null;

        return weapon;
      })
      .filter((w) => w);

    if (weapons.length) {
      data.w = weapons;
    }

    // Reactor
    if (build.reactor?.reactor_id) {
      data.r = build.reactor.reactor_id;

      // Reactor additional stats: [[name, value]]
      const reactorStats = (build.reactorAdditionalStats || [])
        .filter((s) => s && (s.name || s.value))
        .map((s) => [s.name || '', s.value || 0]);
      if (reactorStats.length) {
        data.s = reactorStats;
      }
    }

    // External components - compact object format
    const externalComps = {};
    Object.keys(build.externalComponents).forEach((equipmentType) => {
      const ec = build.externalComponents[equipmentType];
      if (!ec.component?.external_component_id && !ec.coreStats?.length) return;

      const comp = [ec.component?.external_component_id || null];

      // Core stats: [[option_id, stat_id, stat_value]]
      const coreStats = (ec.coreStats || [])
        .filter((cs) => cs && cs.option_id)
        .map((cs) => [cs.option_id, cs.stat_id, cs.stat_value]);
      comp[1] = coreStats.length ? coreStats : null;

      externalComps[equipmentType] = comp;
    });

    if (Object.keys(externalComps).length) {
      data.e = externalComps;
    }

    // Arche tuning - [board_id, [[node_id, row, col]]]
    if (build.archeTuning?.board?.arche_tuning_board_id) {
      const nodes = (build.archeTuning.selectedNodes || [])
        .filter((n) => n && n.node_id)
        .map((n) => [n.node_id, n.position_row, n.position_column]);

      data.a = [build.archeTuning.board.arche_tuning_board_id, nodes];
    }

    return data;
  }

  /**
   * Compress JSON build data to URL-safe string
   * @param {Object} buildData - Serialized build data
   * @returns {string} Compressed string
   */
  compress(buildData) {
    const json = JSON.stringify(buildData);
    return LZString.compressToEncodedURIComponent(json);
  }

  /**
   * Decompress URL string to JSON build data
   * @param {string} compressed - Compressed build string
   * @returns {Object|null} Build data or null if invalid
   */
  decompress(compressed) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (!json) return null;
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to decompress build data:', error);
      return null;
    }
  }

  /**
   * Validate and deserialize build data, reconstructing full objects from IDs
   * Handles both v1 (verbose) and v2 (compact) formats
   * @param {Object} buildData - Serialized build data
   * @returns {Object} Validation result with { valid, build, warnings }
   */
  deserialize(buildData) {
    const warnings = [];

    // Detect version and normalize to v2 format
    const version = buildData.v || buildData.version;
    const isV1 =
      version === '1.0' || version === 1 || buildData.version === '1.0';

    if (isV1) {
      // Convert v1 to v2 format for processing
      buildData = this._convertV1ToV2(buildData);
    }

    // Find descendant
    const descendant = this.state.descendants.find(
      (d) => d.descendant_id === buildData.d
    );
    if (!descendant) {
      return {
        valid: false,
        build: null,
        warnings: [`Descendant not found: ${buildData.d}`],
      };
    }

    // Reconstruct trigger module
    const triggerModule = buildData.t
      ? this.state.modules.find((m) => m.module_id === buildData.t)
      : null;
    if (buildData.t && !triggerModule) {
      warnings.push(`Trigger module not found: ${buildData.t}`);
    }

    // Reconstruct descendant modules
    // Format: [[slot_index, module_id]] - preserves slot positions for special slots
    const descendantModules = new Array(12).fill(null);
    (buildData.m || []).forEach((entry) => {
      // Handle both new format [index, id] and legacy format (just id)
      let slotIndex, moduleId;
      if (Array.isArray(entry)) {
        [slotIndex, moduleId] = entry;
      } else {
        // Legacy format: assume sequential filling (will be wrong for special slots)
        // This handles old URLs that didn't preserve positions
        console.warn(
          'Legacy module format detected - slot positions may be incorrect'
        );
        const nextEmpty = descendantModules.findIndex((m) => m === null);
        slotIndex = nextEmpty >= 0 ? nextEmpty : descendantModules.length;
        moduleId = entry;
      }

      if (!moduleId || slotIndex >= 12) return;
      const module = this.state.modules.find((m) => m.module_id === moduleId);
      if (!module) warnings.push(`Module not found: ${moduleId}`);
      descendantModules[slotIndex] = module || null;
    });

    // Reconstruct weapons from compact format: [weaponId, [modIds], [[statId,val]], coreTypeId, [[opt,stat,val]]]
    const weapons = new Array(3).fill(null).map((_, idx) => {
      const w = (buildData.w || [])[idx];
      if (!w) {
        return {
          weapon: null,
          modules: new Array(10).fill(null),
          customStats: [],
          coreType: null,
          coreStats: [],
        };
      }

      const weapon = w[0]
        ? this.state.weapons.find((wp) => wp.weapon_id === w[0])
        : null;
      if (w[0] && !weapon) {
        warnings.push(`Weapon ${idx + 1} not found: ${w[0]}`);
      }

      const modules = new Array(10).fill(null);
      (w[1] || []).forEach((id, modIdx) => {
        if (!id) return;
        const module = this.state.modules.find((m) => m.module_id === id);
        if (!module) warnings.push(`Weapon module not found: ${id}`);
        modules[modIdx] = module || null;
      });

      // Custom stats from [[stat_id, stat_value]]
      const customStats = (w[2] || []).map(([stat_id, stat_value]) => ({
        stat_id,
        stat_value,
      }));

      const coreType = w[3]
        ? this.state.coreTypes.find((ct) => ct.core_type_id === w[3])
        : null;
      if (w[3] && !coreType) {
        warnings.push(`Core type not found: ${w[3]}`);
      }

      // Core stats from [[option_id, stat_id, stat_value]]
      const coreStats = (w[4] || []).map(
        ([option_id, stat_id, stat_value]) => ({
          option_id,
          stat_id,
          stat_value,
        })
      );

      return {
        weapon,
        modules,
        customStats,
        coreType,
        coreStats,
      };
    });

    // Reconstruct reactor
    const reactor = buildData.r
      ? this.state.reactors.find((r) => r.reactor_id === buildData.r)
      : null;
    if (buildData.r && !reactor) {
      warnings.push(`Reactor not found: ${buildData.r}`);
    }

    // Reactor stats from [[name, value]]
    const reactorAdditionalStats = (buildData.s || []).map(([name, value]) => ({
      name,
      value,
    }));
    if (reactorAdditionalStats.length === 0) {
      reactorAdditionalStats.push(
        { name: '', value: 0 },
        { name: '', value: 0 }
      );
    }

    // Reconstruct external components from compact format: [component_id, [[opt,stat,val]]]
    const externalComponents = {};
    Object.keys(buildData.e || {}).forEach((equipmentType) => {
      const ec = buildData.e[equipmentType];
      const component = ec[0]
        ? this.state.externalComponents.find(
            (c) => c.external_component_id === ec[0]
          )
        : null;
      if (ec[0] && !component) {
        warnings.push(`External component not found: ${ec[0]}`);
      }

      // Core stats from [[option_id, stat_id, stat_value]]
      const coreStats = (ec[1] || []).map(
        ([option_id, stat_id, stat_value]) => ({
          option_id,
          stat_id,
          stat_value,
        })
      );

      externalComponents[equipmentType] = {
        component,
        coreStats,
      };
    });

    // Reconstruct arche tuning from [board_id, [[node_id, row, col]]]
    let archeTuning = null;
    if (buildData.a && buildData.a[0]) {
      const board = this.state.archeTuningBoards.find(
        (b) => b.arche_tuning_board_id === buildData.a[0]
      );
      if (!board) {
        warnings.push(`Arche tuning board not found: ${buildData.a[0]}`);
      }

      const selectedNodes = (buildData.a[1] || [])
        .map(([node_id, position_row, position_column]) => {
          const node = this.state.archeTuningNodes.find(
            (n) => n.node_id === node_id
          );
          if (!node) {
            warnings.push(`Arche tuning node not found: ${node_id}`);
            return null;
          }
          return {
            ...node,
            position_row,
            position_column,
          };
        })
        .filter(Boolean);

      if (board) {
        archeTuning = {
          board,
          selectedNodes,
        };
      }
    }

    return {
      valid: true,
      descendant,
      build: {
        triggerModule,
        descendantModules,
        weapons,
        reactor,
        reactorAdditionalStats: buildData.reactor_additional_stats || [
          { name: '', value: 0 },
          { name: '', value: 0 },
        ],
        externalComponents,
        archeTuning,
        fellow: null,
        vehicle: null,
        inversionReinforcement: null,
      },
      warnings,
    };
  }

  /**
   * Convert v1 format to v2 compact format
   * @param {Object} v1Data - V1 format build data
   * @returns {Object} V2 format build data
   * @private
   */
  _convertV1ToV2(v1Data) {
    const v2 = {
      v: 2,
      d: v1Data.descendant_id,
    };

    if (v1Data.trigger_module_id) {
      v2.t = v1Data.trigger_module_id;
    }

    // Convert descendant modules to new format with [index, module_id] pairs
    // This preserves slot positions for special slots (0=Skill, 6=Sub)
    const descendantMods = [];
    (v1Data.descendant_module_ids || []).forEach((id, idx) => {
      if (id) {
        descendantMods.push([idx, id]);
      }
    });
    if (descendantMods.length) {
      v2.m = descendantMods;
    }

    if (v1Data.weapons && v1Data.weapons.length) {
      v2.w = v1Data.weapons
        .map((w) => {
          const weapon = [];
          weapon[0] = w.weapon_id || null;
          weapon[1] = w.module_ids || null;
          weapon[2] = (w.custom_stats || [])
            .filter((cs) => cs && cs.stat_id)
            .map((cs) => [cs.stat_id, cs.stat_value]);
          weapon[2] = weapon[2].length ? weapon[2] : null;
          weapon[3] = w.core_type_id || null;
          weapon[4] = (w.core_stats || [])
            .filter((cs) => cs && cs.option_id)
            .map((cs) => [cs.option_id, cs.stat_id, cs.stat_value]);
          weapon[4] = weapon[4].length ? weapon[4] : null;
          return weapon;
        })
        .filter((w) => w[0] || w[1]);
    }

    if (v1Data.reactor_id) {
      v2.r = v1Data.reactor_id;
      if (v1Data.reactor_additional_stats) {
        v2.s = v1Data.reactor_additional_stats.map((s) => [
          s.stat_name || s.name || '',
          s.stat_value || s.value || 0,
        ]);
      }
    }

    if (v1Data.external_components) {
      v2.e = {};
      Object.keys(v1Data.external_components).forEach((type) => {
        const ec = v1Data.external_components[type];
        v2.e[type] = [
          ec.component_id || null,
          (ec.core_stats || [])
            .filter((cs) => cs && cs.option_id)
            .map((cs) => [cs.option_id, cs.stat_id, cs.stat_value]),
        ];
        if (!v2.e[type][1].length) v2.e[type][1] = null;
      });
    }

    if (v1Data.arche_tuning && v1Data.arche_tuning.board_id) {
      v2.a = [
        v1Data.arche_tuning.board_id,
        (v1Data.arche_tuning.selected_nodes || [])
          .filter((n) => n && n.node_id)
          .map((n) => [n.node_id, n.position_row, n.position_column]),
      ];
    }

    return v2;
  }

  /**
   * Generate shareable URL for current build
   * @returns {string} Full URL with build hash
   */
  generateUrl() {
    const buildData = this.serialize();
    const compressed = this.compress(buildData);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#${compressed}`;
  }

  /**
   * Load build from URL hash
   * @returns {Object|null} Deserialized build or null if no hash/invalid
   */
  loadFromUrl() {
    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash) return null;

    const buildData = this.decompress(hash);
    if (!buildData) {
      console.error('Failed to parse build from URL');
      return null;
    }

    return this.deserialize(buildData);
  }

  /**
   * Save build to localStorage
   */
  saveToLocalStorage() {
    try {
      const buildData = this.serialize();
      localStorage.setItem(this.localStorageKey, JSON.stringify(buildData));
    } catch (error) {
      console.error('Failed to save build to localStorage:', error);
    }
  }

  /**
   * Load build from localStorage
   * @returns {Object|null} Deserialized build or null if none saved
   */
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(this.localStorageKey);
      if (!saved) return null;

      const buildData = JSON.parse(saved);
      return this.deserialize(buildData);
    } catch (error) {
      console.error('Failed to load build from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear saved build from localStorage
   */
  clearLocalStorage() {
    localStorage.removeItem(this.localStorageKey);
  }
}
