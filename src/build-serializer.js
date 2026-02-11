import LZString from 'lz-string';

/**
 * Build Serializer - Handles encoding/decoding builds to/from URL-safe strings
 * Uses LZ-string for compression and localStorage for backup
 */
export class BuildSerializer {
  constructor(state) {
    this.state = state;
    this.version = '1.0';
    this.localStorageKey = 'tfd_last_build';
  }

  /**
   * Serialize current build to minimal JSON structure (IDs only)
   * @returns {Object} Minimal build representation
   */
  serialize() {
    const build = this.state.currentBuild;
    const descendantId = this.state.currentDescendant?.descendant_id || null;

    if (!descendantId) {
      throw new Error('No descendant selected');
    }

    return {
      version: this.version,
      descendant_id: descendantId,
      trigger_module_id: build.triggerModule?.module_id || null,
      descendant_module_ids: build.descendantModules.map(
        (m) => m?.module_id || null
      ),
      weapons: build.weapons.map((w) => ({
        weapon_id: w.weapon?.weapon_id || null,
        module_ids: w.modules.map((m) => m?.module_id || null),
        custom_stats: (w.customStats || [])
          .filter((cs) => cs)
          .map((cs) => ({
            stat_id: cs.stat_id,
            stat_value: cs.stat_value,
          })),
        core_type_id: w.coreType?.core_type_id || null,
        core_stats: (w.coreStats || [])
          .filter((cs) => cs)
          .map((cs) => ({
            option_id: cs.option_id,
            stat_id: cs.stat_id,
            stat_value: cs.stat_value,
          })),
      })),
      reactor_id: build.reactor?.reactor_id || null,
      reactor_additional_stats: (build.reactorAdditionalStats || []).map(
        (s) => ({
          stat_name: s.name,
          stat_value: s.value,
        })
      ),
      external_components: Object.keys(build.externalComponents).reduce(
        (acc, equipmentType) => {
          const ec = build.externalComponents[equipmentType];
          acc[equipmentType] = {
            component_id: ec.component?.external_component_id || null,
            core_stats: (ec.coreStats || [])
              .filter((cs) => cs)
              .map((cs) => ({
                option_id: cs.option_id,
                stat_id: cs.stat_id,
                stat_value: cs.stat_value,
              })),
          };
          return acc;
        },
        {}
      ),
      arche_tuning: build.archeTuning
        ? {
            board_id: build.archeTuning.board?.arche_tuning_board_id || null,
            selected_nodes: (build.archeTuning.selectedNodes || [])
              .filter((n) => n)
              .map((n) => ({
                node_id: n.node_id,
                position_row: n.position_row,
                position_column: n.position_column,
              })),
          }
        : null,
    };
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
   * @param {Object} buildData - Serialized build data
   * @returns {Object} Validation result with { valid, build, warnings }
   */
  deserialize(buildData) {
    const warnings = [];

    // Validate version
    if (buildData.version !== this.version) {
      warnings.push(
        `Build version mismatch: ${buildData.version} (expected ${this.version})`
      );
    }

    // Find descendant
    const descendant = this.state.descendants.find(
      (d) => d.descendant_id === buildData.descendant_id
    );
    if (!descendant) {
      return {
        valid: false,
        build: null,
        warnings: [`Descendant not found: ${buildData.descendant_id}`],
      };
    }

    // Reconstruct trigger module
    const triggerModule = buildData.trigger_module_id
      ? this.state.modules.find(
          (m) => m.module_id === buildData.trigger_module_id
        )
      : null;
    if (buildData.trigger_module_id && !triggerModule) {
      warnings.push(`Trigger module not found: ${buildData.trigger_module_id}`);
    }

    // Reconstruct descendant modules
    const descendantModules = buildData.descendant_module_ids.map((id) => {
      if (!id) return null;
      const module = this.state.modules.find((m) => m.module_id === id);
      if (!module) warnings.push(`Module not found: ${id}`);
      return module || null;
    });

    // Reconstruct weapons
    const weapons = buildData.weapons.map((w, idx) => {
      const weapon = w.weapon_id
        ? this.state.weapons.find((wp) => wp.weapon_id === w.weapon_id)
        : null;
      if (w.weapon_id && !weapon) {
        warnings.push(`Weapon ${idx + 1} not found: ${w.weapon_id}`);
      }

      const modules = w.module_ids.map((id) => {
        if (!id) return null;
        const module = this.state.modules.find((m) => m.module_id === id);
        if (!module) warnings.push(`Weapon module not found: ${id}`);
        return module || null;
      });

      const coreType = w.core_type_id
        ? this.state.coreTypes.find((ct) => ct.core_type_id === w.core_type_id)
        : null;
      if (w.core_type_id && !coreType) {
        warnings.push(`Core type not found: ${w.core_type_id}`);
      }

      return {
        weapon,
        modules,
        customStats: w.custom_stats || [],
        coreType,
        coreStats: w.core_stats || [],
      };
    });

    // Reconstruct reactor
    const reactor = buildData.reactor_id
      ? this.state.reactors.find((r) => r.reactor_id === buildData.reactor_id)
      : null;
    if (buildData.reactor_id && !reactor) {
      warnings.push(`Reactor not found: ${buildData.reactor_id}`);
    }

    // Reconstruct external components
    const externalComponents = {};
    Object.keys(buildData.external_components || {}).forEach(
      (equipmentType) => {
        const ec = buildData.external_components[equipmentType];
        const component = ec.component_id
          ? this.state.externalComponents.find(
              (c) => c.external_component_id === ec.component_id
            )
          : null;
        if (ec.component_id && !component) {
          warnings.push(`External component not found: ${ec.component_id}`);
        }
        externalComponents[equipmentType] = {
          component,
          coreStats: ec.core_stats || [],
        };
      }
    );

    // Reconstruct arche tuning
    let archeTuning = null;
    if (buildData.arche_tuning) {
      const board = buildData.arche_tuning.board_id
        ? this.state.archeTuningBoards.find(
            (b) => b.arche_tuning_board_id === buildData.arche_tuning.board_id
          )
        : null;
      if (buildData.arche_tuning.board_id && !board) {
        warnings.push(
          `Arche tuning board not found: ${buildData.arche_tuning.board_id}`
        );
      }

      const selectedNodes = (buildData.arche_tuning.selected_nodes || [])
        .map((nodeData) => {
          const node = this.state.archeTuningNodes.find(
            (n) => n.node_id === nodeData.node_id
          );
          if (!node) {
            warnings.push(`Arche tuning node not found: ${nodeData.node_id}`);
            return null;
          }
          // Restore position information
          return {
            ...node,
            position_row: nodeData.position_row,
            position_column: nodeData.position_column,
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
