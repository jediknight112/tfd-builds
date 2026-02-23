import { state } from '../state.js';
import { apiClient } from '../api-client.js';

/**
 * Module slot ID to internal slot index mapping.
 * UI slots: 0=Skill, 1-5=Main 1-5, 6=Sub, 7-11=Main 6-10
 */
function mapDescendantModuleSlot(slotId) {
  if (!slotId) return null;

  const str = String(slotId).trim();

  if (/^Skill\s+\d+$/i.test(str)) return 0;
  if (/^Sub\s+\d+$/i.test(str)) return 6;

  const mainMatch = /^Main\s+(\d+)$/i.exec(str);
  if (mainMatch) {
    const mainNum = Number.parseInt(mainMatch[1], 10);
    if (mainNum >= 1 && mainNum <= 5) return mainNum; // slots 1-5
    if (mainNum >= 6 && mainNum <= 10) return mainNum + 1; // slots 7-11
  }

  // Pure numeric IDs are trigger or special slots -- handled separately
  return null;
}

/**
 * Maps weapon module_slot_id ("1"-"10") to module index (0-9)
 */
function mapWeaponModuleSlot(slotId) {
  const num = Number.parseInt(String(slotId), 10);
  if (num >= 1 && num <= 10) return num - 1;
  return null;
}

export class BuildImporter {
  /**
   * Import a user's current build from the Nexon API
   * @param {string} username - Nexon username (e.g., "Jedinight112#8858")
   * @returns {Object} { descendant, build, warnings, userName }
   */
  async importBuild(username) {
    const warnings = [];

    // Step 1: Resolve username to OUID
    const idResponse = await apiClient.resolveUsername(username);
    if (!idResponse?.ouid) {
      throw new Error(
        'Could not resolve username. Please check the spelling and try again.'
      );
    }
    const ouid = idResponse.ouid;

    // Step 2: Fetch descendant first (needed to determine descendant_group_id for arche tuning)
    const descendantData = await apiClient.fetchUserDescendant(ouid);

    // Step 3: Map descendant and resolve descendant_group_id
    const descendant = state.descendants.find(
      (d) => d.descendant_id === descendantData.descendant_id
    );
    if (!descendant) {
      throw new Error(
        `Descendant not found in metadata: ${descendantData.descendant_id}`
      );
    }

    const descendantGroupId = descendant.descendant_group_id;
    const languageCode = state.language || 'en';

    // Step 4: Fetch remaining user data in parallel (with required params)
    const [weaponData, reactorData, externalComponentData, archeTuningData] =
      await Promise.all([
        apiClient.fetchUserWeapon(ouid, languageCode),
        apiClient.fetchUserReactor(ouid, languageCode),
        apiClient.fetchUserExternalComponent(ouid, languageCode),
        apiClient.fetchUserArcheTuning(ouid, descendantGroupId),
      ]);

    // Step 5: Map descendant modules
    // Two-pass approach: named slots first, then numeric slots into remaining empties.
    // This prevents numeric-slot modules from being placed in a slot that a later
    // named-slot module will claim (e.g. "9" landing in slot 3, then "Main 3" overwriting it).
    const descendantModules = new Array(12).fill(null);
    let triggerModule = null;
    const deferredModules = []; // modules with numeric-only slot IDs

    (descendantData.module || []).forEach((mod) => {
      const slotIndex = mapDescendantModuleSlot(mod.module_slot_id);
      const moduleObj = state.modules.find(
        (m) => m.module_id === mod.module_id
      );

      if (!moduleObj) {
        warnings.push(`Module not found: ${mod.module_id}`);
        return;
      }

      if (slotIndex !== null && slotIndex < 12) {
        // Named slot (Skill X, Main X, Sub X) -- place immediately
        descendantModules[slotIndex] = moduleObj;
      } else {
        // Numeric-only slot ID -- defer until all named slots are placed
        deferredModules.push({ mod, moduleObj });
      }
    });

    // Second pass: place deferred (numeric slot) modules
    deferredModules.forEach(({ mod, moduleObj }) => {
      const slotTypes = moduleObj.available_module_slot_type || [];
      const isTrigger =
        slotTypes.includes('Trigger') || moduleObj.module_type === 'Trigger';

      if (isTrigger) {
        triggerModule = moduleObj;
      } else if (slotTypes.includes('Skill')) {
        if (descendantModules[0] === null) {
          descendantModules[0] = moduleObj;
        }
      } else if (slotTypes.includes('Sub')) {
        if (descendantModules[6] === null) {
          descendantModules[6] = moduleObj;
        }
      } else if (slotTypes.includes('Main')) {
        // Place in the first empty Main slot (1-5, 7-11)
        const mainSlots = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11];
        const emptySlot = mainSlots.find((s) => descendantModules[s] === null);
        if (emptySlot !== undefined) {
          descendantModules[emptySlot] = moduleObj;
        } else {
          warnings.push(
            `No empty Main slot for module ${moduleObj.module_name || mod.module_id}`
          );
        }
      } else {
        warnings.push(
          `Skipping module ${moduleObj.module_name || mod.module_id} in slot "${mod.module_slot_id}" (unknown slot type)`
        );
      }
    });

    // Step 6: Map weapons
    const weapons = new Array(3).fill(null).map(() => ({
      weapon: null,
      modules: new Array(10).fill(null),
      customStats: [],
      coreType: null,
      coreStats: [],
    }));

    (weaponData.weapon || []).forEach((w) => {
      const weaponIdx = Number.parseInt(String(w.weapon_slot_id), 10) - 1;
      if (weaponIdx < 0 || weaponIdx >= 3) return;

      const weaponObj = state.weapons.find(
        (wp) => wp.weapon_id === w.weapon_id
      );
      if (!weaponObj) {
        warnings.push(`Weapon not found: ${w.weapon_id}`);
      }

      const modules = new Array(10).fill(null);
      (w.module || []).forEach((mod) => {
        const modIdx = mapWeaponModuleSlot(mod.module_slot_id);
        if (modIdx === null) return;
        const moduleObj = state.modules.find(
          (m) => m.module_id === mod.module_id
        );
        if (!moduleObj) {
          warnings.push(`Weapon module not found: ${mod.module_id}`);
        }
        modules[modIdx] = moduleObj || null;
      });

      // Map weapon additional stats to customStats
      const customStats = (w.weapon_additional_stat || []).map((s) => ({
        stat_id: s.additional_stat_name,
        stat_value: Number.parseFloat(s.additional_stat_value) || 0,
      }));

      // Map core stats
      const coreStats = (w.core || []).map((c, idx) => ({
        slot_index: idx,
        core_type_id: null,
        option_id: c.core_slot_id,
        stat_id: c.core_option_name,
        stat_value: Number.parseFloat(c.core_option_value) || 0,
      }));

      weapons[weaponIdx] = {
        weapon: weaponObj || null,
        modules,
        customStats,
        coreType: null,
        coreStats,
      };
    });

    // Step 7: Map reactor
    let reactor = null;
    const reactorAdditionalStats = [];

    if (reactorData.reactor_id) {
      reactor = state.reactors.find(
        (r) => r.reactor_id === reactorData.reactor_id
      );
      if (!reactor) {
        warnings.push(`Reactor not found: ${reactorData.reactor_id}`);
      }

      (reactorData.reactor_additional_stat || []).forEach((s) => {
        reactorAdditionalStats.push({
          name: s.additional_stat_name || '',
          value: Number.parseFloat(s.additional_stat_value) || 0,
        });
      });
    }

    // Ensure at least 2 stats slots
    while (reactorAdditionalStats.length < 2) {
      reactorAdditionalStats.push({ name: '', value: 0 });
    }

    // Step 8: Map external components
    const externalComponents = {};
    (externalComponentData.external_component || []).forEach((ec) => {
      const componentObj = state.externalComponents.find(
        (c) => c.external_component_id === ec.external_component_id
      );
      if (!componentObj) {
        warnings.push(
          `External component not found: ${ec.external_component_id}`
        );
        return;
      }

      const rawEquipmentType = componentObj.external_component_equipment_type;
      if (!rawEquipmentType) {
        warnings.push(
          `No equipment type for component: ${ec.external_component_id}`
        );
        return;
      }

      // Convert localized equipment type to English key for internal storage
      const equipmentType = state.getEnglishEquipmentType(rawEquipmentType);

      const coreStats = (ec.core || []).map((c, idx) => ({
        slot_index: idx,
        core_type_id: null,
        option_id: c.core_slot_id,
        stat_id: c.core_option_name,
        stat_value: Number.parseFloat(c.core_option_value) || 0,
      }));

      externalComponents[equipmentType] = {
        component: componentObj,
        coreStats,
      };
    });

    // Step 9: Map arche tuning (multi-board)
    const archeTuning = [null, null, null];
    if (archeTuningData.arche_tuning) {
      archeTuningData.arche_tuning.forEach((slot) => {
        const slotIdx = Number.parseInt(String(slot.slot_id), 10);
        if (slotIdx < 0 || slotIdx >= 3) return;

        const boards = slot.arche_tuning_board || [];
        if (boards.length === 0) return;

        // Each slot has one board configuration
        const boardEntry = boards[0];
        const boardObj = state.archeTuningBoards.find(
          (b) => b.arche_tuning_board_id === boardEntry.arche_tuning_board_id
        );
        if (!boardObj) {
          warnings.push(
            `Arche tuning board not found: ${boardEntry.arche_tuning_board_id}`
          );
          return;
        }

        const selectedNodes = (boardEntry.node || [])
          .map((n) => {
            const nodeObj = state.archeTuningNodes.find(
              (nd) => nd.node_id === n.node_id
            );
            if (!nodeObj) {
              warnings.push(`Arche tuning node not found: ${n.node_id}`);
              return null;
            }
            return {
              ...nodeObj,
              position_row: Number.parseInt(String(n.position_row), 10),
              position_column: Number.parseInt(String(n.position_column), 10),
            };
          })
          .filter(Boolean);

        archeTuning[slotIdx] = {
          board: boardObj,
          selectedNodes,
        };
      });
    }

    return {
      descendant,
      userName: descendantData.user_name || username,
      build: {
        triggerModule,
        descendantModules,
        weapons,
        reactor,
        reactorAdditionalStats,
        externalComponents,
        archeTuning,
      },
      warnings,
    };
  }
}
