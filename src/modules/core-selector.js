import { state } from '../state.js';
import { UIComponents } from '../ui-components.js';

export class CoreSelector {
  openCoreTypeSelector(weaponIndex) {
    const weaponData = state.currentBuild.weapons[weaponIndex];
    const weapon = weaponData?.weapon;
    if (
      !weapon ||
      !weapon.available_core_slot ||
      weapon.available_core_slot.length === 0
    ) {
      UIComponents.showWarning('This weapon has no core slot available.');
      return;
    }

    // Get available core types for this weapon
    const coreSlotId = weapon.available_core_slot[0]; // Use first core slot
    const coreSlot = state.getCoreSlot(coreSlotId);

    if (
      !coreSlot ||
      !coreSlot.available_core_type_id ||
      coreSlot.available_core_type_id.length === 0
    ) {
      UIComponents.showWarning('No core types available for this weapon.');
      return;
    }

    state.currentWeaponSlot = { index: weaponIndex, type: 'core' };
    state.currentExternalComponentCoreType = null; // Clear external component context

    const modal = document.getElementById('core-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }

    const slotInfo = document.getElementById('core-slot-info');
    if (slotInfo) {
      slotInfo.textContent = `${weapon.weapon_name} - Select core type and configure stats`;
    }

    this.renderCoreTypeSelector(coreSlot.available_core_type_id, weaponIndex);
  }

  openExternalComponentCoreSelector(equipmentType) {
    const componentData = state.currentBuild.externalComponents[equipmentType];
    const component = componentData?.component;

    if (
      !component ||
      !component.available_core_slot ||
      component.available_core_slot.length === 0
    ) {
      UIComponents.showWarning(
        'This external component has no core slot available.'
      );
      return;
    }

    // Get available core types for this component
    const coreSlotId = component.available_core_slot[0]; // Use first core slot
    const coreSlot = state.getCoreSlot(coreSlotId);

    if (
      !coreSlot ||
      !coreSlot.available_core_type_id ||
      coreSlot.available_core_type_id.length === 0
    ) {
      UIComponents.showWarning(
        'No core types available for this external component.'
      );
      return;
    }

    state.currentExternalComponentCoreType = equipmentType;
    state.currentWeaponSlot = null; // Clear weapon context

    const modal = document.getElementById('core-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }

    const slotInfo = document.getElementById('core-slot-info');
    if (slotInfo) {
      slotInfo.textContent = `${component.external_component_name} - Select core type and configure stats`;
    }

    this.renderExternalComponentCoreTypeSelector(
      coreSlot.available_core_type_id,
      equipmentType
    );
  }

  closeCoreSelector() {
    const modal = document.getElementById('core-selector-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    state.currentWeaponSlot = null;
    state.currentExternalComponentCoreType = null;
  }

  renderCoreTypeSelector(availableCoreTypeIds, weaponIndex) {
    const grid = document.getElementById('core-selector-grid');
    if (!grid) return;

    const weaponData = state.currentBuild.weapons[weaponIndex];

    grid.innerHTML = availableCoreTypeIds
      .map((coreTypeId) => {
        const coreType = state.getCoreType(coreTypeId);
        if (!coreType) return '';

        const isSelected = weaponData.coreType === coreTypeId;

        return `
        <div class="card ${isSelected ? 'border-tfd-primary' : ''} p-4">
          <h4 class="font-bold text-tfd-primary mb-3">${coreType.core_type}</h4>
          
          ${
            coreType.core_option && coreType.core_option.length > 0
              ? `
            <div class="space-y-3">
              ${coreType.core_option
                .map((option, optionIndex) => {
                  // Get all unique stats from all detail levels
                  const allStats = new Map();
                  option.detail?.forEach((detail) => {
                    detail.available_item_option?.forEach((itemOption) => {
                      if (!allStats.has(itemOption.option_effect.stat_id)) {
                        allStats.set(itemOption.option_effect.stat_id, {
                          stat_id: itemOption.option_effect.stat_id,
                          stat_name: itemOption.item_option,
                          operator_type: itemOption.option_effect.operator_type,
                        });
                      }
                    });
                  });

                  const statsArray = Array.from(allStats.values());

                  if (statsArray.length === 0) return '';

                  return `
                  <div class="bg-tfd-darker p-3 rounded-sm">
                    <div class="text-sm font-semibold text-gray-300 mb-2">Option ${optionIndex + 1}</div>
                    <div class="space-y-2">
                      ${statsArray
                        .map((stat) => {
                          const existingCoreStat = weaponData.coreStats.find(
                            (cs) =>
                              cs.stat_id === stat.stat_id &&
                              cs.option_id === option.core_option_id
                          );

                          return `
                          <div class="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="core_${coreTypeId}_${option.core_option_id}_${stat.stat_id}"
                              class="w-4 h-4"
                              ${existingCoreStat ? 'checked' : ''}
                              onchange="window.app.toggleCoreStat('${coreTypeId}', '${option.core_option_id}', '${stat.stat_id}', this.checked)"
                            >
                            <label class="text-xs text-gray-400 flex-1" for="core_${coreTypeId}_${option.core_option_id}_${stat.stat_id}">
                              ${stat.stat_name}
                            </label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Value"
                              value="${existingCoreStat?.stat_value || ''}"
                              class="w-20 px-2 py-1 text-xs bg-tfd-dark border border-gray-600 rounded-sm text-tfd-primary"
                              ${existingCoreStat ? '' : 'disabled'}
                              onchange="window.app.updateCoreStatValue('${coreTypeId}', '${option.core_option_id}', '${stat.stat_id}', this.value)"
                            >
                          </div>
                        `;
                        })
                        .join('')}
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
            
            <button 
              class="btn-primary w-full mt-4" 
              onclick="window.app.selectCoreType('${coreTypeId}', ${weaponIndex})">
              ${isSelected ? 'Update Core' : 'Select Core'}
            </button>
          `
              : '<div class="text-xs text-gray-500">No options available</div>'
          }
        </div>
      `;
      })
      .join('');
  }

  toggleCoreStat(coreTypeId, optionId, statId, checked) {
    if (!state.currentWeaponSlot || state.currentWeaponSlot.type !== 'core')
      return;

    const weaponIndex = state.currentWeaponSlot.index;
    const weaponData = state.currentBuild.weapons[weaponIndex];

    // Set core type if not already set
    if (!weaponData.coreType) {
      weaponData.coreType = coreTypeId;
    }

    if (checked) {
      // Add stat if not already present
      const existingIndex = weaponData.coreStats.findIndex(
        (cs) => cs.stat_id === statId && cs.option_id === optionId
      );

      if (existingIndex === -1) {
        weaponData.coreStats.push({
          option_id: optionId,
          stat_id: statId,
          stat_value: 0,
        });
      }

      // Enable the input field
      const input = document.querySelector(
        `input[type="number"][onchange*="'${coreTypeId}', '${optionId}', '${statId}'"]`
      );
      if (input) input.disabled = false;
    } else {
      // Remove stat
      weaponData.coreStats = weaponData.coreStats.filter(
        (cs) => !(cs.stat_id === statId && cs.option_id === optionId)
      );

      // Disable the input field
      const input = document.querySelector(
        `input[type="number"][onchange*="'${coreTypeId}', '${optionId}', '${statId}'"]`
      );
      if (input) {
        input.disabled = true;
        input.value = '';
      }
    }
  }

  updateCoreStatValue(coreTypeId, optionId, statId, value) {
    if (!state.currentWeaponSlot || state.currentWeaponSlot.type !== 'core')
      return;

    const weaponIndex = state.currentWeaponSlot.index;
    const weaponData = state.currentBuild.weapons[weaponIndex];

    const coreStat = weaponData.coreStats.find(
      (cs) => cs.stat_id === statId && cs.option_id === optionId
    );

    if (coreStat) {
      coreStat.stat_value = parseFloat(value) || 0;
    }
  }

  selectCoreType(coreTypeId, weaponIndex) {
    const weaponData = state.currentBuild.weapons[weaponIndex];
    weaponData.coreType = coreTypeId;

    this.closeCoreSelector();

    // Re-render weapons via app instance
    if (window.app) {
      window.app.renderWeapons();
    }
  }

  renderExternalComponentCoreTypeSelector(availableCoreTypeIds, equipmentType) {
    const grid = document.getElementById('core-selector-grid');
    if (!grid) return;

    const componentData = state.currentBuild.externalComponents[equipmentType];

    grid.innerHTML = availableCoreTypeIds
      .map((coreTypeId) => {
        const coreType = state.getCoreType(coreTypeId);
        if (!coreType) return '';

        const isSelected = componentData.coreType === coreTypeId;

        return `
        <div class="card ${isSelected ? 'border-tfd-primary' : ''} p-4">
          <h4 class="font-bold text-tfd-primary mb-3">${coreType.core_type}</h4>
          
          ${
            coreType.core_option && coreType.core_option.length > 0
              ? `
            <div class="space-y-3">
              ${coreType.core_option
                .map((option, optionIndex) => {
                  // Get all unique stats from all detail levels
                  const allStats = new Map();
                  option.detail?.forEach((detail) => {
                    detail.available_item_option?.forEach((itemOption) => {
                      if (!allStats.has(itemOption.option_effect.stat_id)) {
                        allStats.set(itemOption.option_effect.stat_id, {
                          stat_id: itemOption.option_effect.stat_id,
                          stat_name: itemOption.item_option,
                          operator_type: itemOption.option_effect.operator_type,
                        });
                      }
                    });
                  });

                  const statsArray = Array.from(allStats.values());

                  if (statsArray.length === 0) return '';

                  return `
                  <div class="bg-tfd-darker p-3 rounded-sm">
                    <div class="text-sm font-semibold text-gray-300 mb-2">Option ${optionIndex + 1}</div>
                    <div class="space-y-2">
                      ${statsArray
                        .map((stat) => {
                          const existingCoreStat = componentData.coreStats.find(
                            (cs) =>
                              cs.stat_id === stat.stat_id &&
                              cs.option_id === option.core_option_id
                          );

                          return `
                          <div class="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="core_${coreTypeId}_${option.core_option_id}_${stat.stat_id}"
                              class="w-4 h-4"
                              ${existingCoreStat ? 'checked' : ''}
                              onchange="window.app.toggleExternalComponentCoreStat('${equipmentType}', '${coreTypeId}', '${option.core_option_id}', '${stat.stat_id}', this.checked)"
                            >
                            <label class="text-xs text-gray-400 flex-1" for="core_${coreTypeId}_${option.core_option_id}_${stat.stat_id}">
                              ${stat.stat_name}
                            </label>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="Value"
                              value="${existingCoreStat?.stat_value || ''}"
                              class="w-20 px-2 py-1 text-xs bg-tfd-dark border border-gray-600 rounded-sm text-tfd-primary"
                              ${existingCoreStat ? '' : 'disabled'}
                              onchange="window.app.updateExternalComponentCoreStatValue('${equipmentType}', '${coreTypeId}', '${option.core_option_id}', '${stat.stat_id}', this.value)"
                            >
                          </div>
                        `;
                        })
                        .join('')}
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
            
            <button 
              class="btn-primary w-full mt-4" 
              onclick="window.app.selectExternalComponentCoreType('${coreTypeId}', '${equipmentType}')">
              ${isSelected ? 'Update Core' : 'Select Core'}
            </button>
          `
              : '<div class="text-xs text-gray-500">No options available</div>'
          }
        </div>
      `;
      })
      .join('');
  }

  toggleExternalComponentCoreStat(
    equipmentType,
    coreTypeId,
    optionId,
    statId,
    checked
  ) {
    if (!state.currentExternalComponentCoreType) return;

    const componentData = state.currentBuild.externalComponents[equipmentType];

    // Set core type if not already set
    if (!componentData.coreType) {
      componentData.coreType = coreTypeId;
    }

    if (checked) {
      // Add stat if not already present
      const existingIndex = componentData.coreStats.findIndex(
        (cs) => cs.stat_id === statId && cs.option_id === optionId
      );

      if (existingIndex === -1) {
        componentData.coreStats.push({
          option_id: optionId,
          stat_id: statId,
          stat_value: 0,
        });
      }

      // Enable the input field
      const input = document.querySelector(
        `input[type="number"][onchange*="'${equipmentType}', '${coreTypeId}', '${optionId}', '${statId}'"]`
      );
      if (input) input.disabled = false;
    } else {
      // Remove stat
      componentData.coreStats = componentData.coreStats.filter(
        (cs) => !(cs.stat_id === statId && cs.option_id === optionId)
      );

      // Disable the input field
      const input = document.querySelector(
        `input[type="number"][onchange*="'${equipmentType}', '${coreTypeId}', '${optionId}', '${statId}'"]`
      );
      if (input) {
        input.disabled = true;
        input.value = '';
      }
    }
  }

  updateExternalComponentCoreStatValue(
    equipmentType,
    coreTypeId,
    optionId,
    statId,
    value
  ) {
    if (!state.currentExternalComponentCoreType) return;

    const componentData = state.currentBuild.externalComponents[equipmentType];

    const coreStat = componentData.coreStats.find(
      (cs) => cs.stat_id === statId && cs.option_id === optionId
    );

    if (coreStat) {
      coreStat.stat_value = parseFloat(value) || 0;
    }
  }

  selectExternalComponentCoreType(coreTypeId, equipmentType) {
    const componentData = state.currentBuild.externalComponents[equipmentType];
    componentData.coreType = coreTypeId;

    this.closeCoreSelector();

    // Re-render external components via app instance
    if (window.app) {
      window.app.renderExternalComponents();
    }
  }
}
