import { state } from './state.js';
import { getTierDisplayName } from './config.js';

// UI Components
export class UIComponents {
  // Create a module slot element
  static createModuleSlot(
    module,
    slotIndex,
    isWeaponModule = false,
    weaponIndex = null
  ) {
    const moduleSlot = document.createElement('div');
    moduleSlot.className =
      'module-slot group relative border-2 border-tfd-primary/30 rounded-lg p-3 hover:border-tfd-accent transition-all cursor-pointer bg-black/50 hover:bg-black/70';

    if (module) {
      const tierClass = module.module_tier
        ? `tier-${module.module_tier.toLowerCase()}`
        : '';
      if (tierClass) {
        moduleSlot.classList.add(tierClass);
      }

      // Get max level stats
      const maxLevelStat =
        module.module_stat && module.module_stat.length > 0
          ? module.module_stat[module.module_stat.length - 1]
          : null;

      const isTriggerSlot = slotIndex === 'trigger';

      moduleSlot.innerHTML = `
        <div class="flex flex-col gap-2">
          ${module.image_url ? `<img src="${module.image_url}" alt="${module.module_name}" class="w-full h-20 object-contain rounded" />` : ''}
          <div class="flex-1">
            <h4 class="font-semibold text-sm text-cyber-cyan mb-1 leading-tight">${module.module_name || 'Unknown Module'}</h4>
            ${!isTriggerSlot && module.module_socket_type ? `<p class="text-xs text-steel-grey">${module.module_socket_type}</p>` : ''}
            ${module.module_tier_id ? `<p class="text-xs text-steel-grey">${getTierDisplayName(module.module_tier_id)}</p>` : ''}
            ${module.module_type ? `<p class="text-xs text-amber-gold font-semibold">${module.module_type}</p>` : ''}
          </div>
        </div>
        ${
          maxLevelStat
            ? `
          <div class="mt-2 space-y-1 border-t border-steel-dark/30 pt-2">
            ${
              !isTriggerSlot
                ? `
              <div class="text-xs flex justify-between gap-2">
                <span class="text-amber-gold font-semibold">Capacity</span>
                <span class="text-amber-gold font-semibold">${maxLevelStat.module_capacity}</span>
              </div>
            `
                : ''
            }
            <div class="text-xs text-steel-light">${maxLevelStat.value.replace(/\[\+\]/g, '')}</div>
          </div>
        `
            : ''
        }
      `;

      // Add click handler to clear the slot
      moduleSlot.addEventListener('click', () => {
        if (!isWeaponModule) {
          if (slotIndex === 'trigger') {
            state.currentBuild.triggerModule = null;
          } else {
            state.currentBuild.descendantModules[slotIndex] = null;
          }
          this.refreshModulesTab();
        } else if (weaponIndex !== null) {
          state.currentBuild.weapons[weaponIndex].modules[slotIndex] = null;
          this.refreshWeaponsTab();
        }
      });
    } else {
      moduleSlot.innerHTML = `
        <div class="flex items-center justify-center h-16 text-gray-500">
          <span class="text-sm">Empty Slot</span>
        </div>
      `;
    }

    return moduleSlot;
  }

  // Create a weapon card element
  static createWeaponCard(weapon, weaponIndex) {
    const weaponCard = document.createElement('div');
    weaponCard.className =
      'weapon-card border-2 border-tfd-primary/30 rounded-lg p-4 bg-black/50';

    if (weapon) {
      const tierClass = weapon.weapon_tier_id
        ? `tier-${weapon.weapon_tier_id.toLowerCase().replace('tier', '')}`
        : '';
      if (tierClass) {
        weaponCard.classList.add(tierClass);
      }

      weaponCard.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
          ${weapon.image_url ? `<img src="${weapon.image_url}" alt="${weapon.weapon_name}" class="w-16 h-16 rounded object-cover" />` : ''}
          <div class="flex-1">
            <h4 class="font-semibold">${weapon.weapon_name || 'Unknown Weapon'}</h4>
            <p class="text-sm text-gray-400">${weapon.weapon_type || ''}</p>
            <p class="text-sm text-tfd-accent">${weapon.weapon_tier_id?.replace('Tier', 'Tier ') || ''} - ${weapon.weapon_rounds_type || ''}</p>
          </div>
          <button class="btn-secondary text-xs clear-weapon-btn">Clear</button>
        </div>
        
        <div class="weapon-modules-grid grid grid-cols-2 gap-2 mb-4"></div>
        
        <div class="weapon-core-section border-t border-tfd-primary/30 pt-4 mb-4">
          <h5 class="font-semibold text-sm mb-2">Weapon Core</h5>
          <div class="core-stats-inline space-y-2"></div>
        </div>
        
        <div class="custom-stats-section border-t border-tfd-primary/30 pt-4">
          <div class="flex justify-between items-center mb-2">
            <h5 class="font-semibold text-sm">Additional Stats (${state.currentBuild.weapons[weaponIndex].customStats.length}/4)</h5>
          </div>
          <div class="custom-stats-list space-y-2"></div>
          <datalist id="weapon-stat-names-${weaponIndex}">
            ${state.stats.map((s) => `<option value="${s.stat_name}"></option>`).join('')}
          </datalist>
        </div>
      `;

      // Populate weapon modules
      const modulesGrid = weaponCard.querySelector('.weapon-modules-grid');
      for (let i = 0; i < 10; i++) {
        const moduleSlot = this.createModuleSlot(
          state.currentBuild.weapons[weaponIndex].modules[i],
          i,
          true,
          weaponIndex
        );
        modulesGrid.appendChild(moduleSlot);

        // Add click handler to open module selector only if slot is empty
        if (!state.currentBuild.weapons[weaponIndex].modules[i]) {
          moduleSlot.addEventListener('click', () => {
            if (window.app) {
              window.app.openWeaponModuleSelector(weaponIndex, i);
            }
          });
        }
      }

      // Populate inline core stats with autocomplete
      const coreStatsInline = weaponCard.querySelector('.core-stats-inline');

      // Get available core options for this weapon
      const availableCoreOptions = this.getAvailableWeaponCoreOptions(weapon);

      // Show one slot per core option (not per stat)
      if (coreStatsInline && availableCoreOptions.length > 0) {
        // Separate Free Augmentation from specific augmentation types
        const freeAugmentationOptions = availableCoreOptions.filter((opt) =>
          opt.core_type_name.includes('Free Augmentation')
        );
        const specificAugmentationOptions = availableCoreOptions.filter(
          (opt) => !opt.core_type_name.includes('Free Augmentation')
        );

        let currentIndex = 0;

        // Handle Free Augmentation - show ONLY 1 input with ALL combined stats
        if (freeAugmentationOptions.length > 0) {
          // Combine all stats from all Free Augmentation options
          const allFreeStats = [];
          const seenStatIds = new Set();
          freeAugmentationOptions.forEach((opt) => {
            opt.available_stats.forEach((stat) => {
              if (!seenStatIds.has(stat.stat_id)) {
                seenStatIds.add(stat.stat_id);
                allFreeStats.push(stat);
              }
            });
          });

          const existingCoreStat =
            state.currentBuild.weapons[weaponIndex].coreStats[currentIndex];
          const firstFreeOption = freeAugmentationOptions[0]; // Use first for option_id/core_type_id

          const datalistId = `weapon-core-stats-${weaponIndex}-free`;
          const datalist = document.createElement('datalist');
          datalist.id = datalistId;
          datalist.innerHTML = allFreeStats
            .map(
              (stat) =>
                `<option value="${state.getStatName(stat.stat_id)}"></option>`
            )
            .join('');

          const statDiv = document.createElement('div');
          statDiv.className = 'flex items-center gap-2';
          statDiv.innerHTML = `
            <input type="text" 
              list="${datalistId}"
              class="flex-1 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-gray-300 text-xs" 
              value="${existingCoreStat ? state.getStatName(existingCoreStat.stat_id) : ''}"
              placeholder="Free Augmentation stat..."
              data-weapon-index="${weaponIndex}"
              data-core-stat-index="${currentIndex}"
              data-option-id="${firstFreeOption.option_id}"
              data-core-type-id="${firstFreeOption.core_type_id}">
            <input type="number" 
              step="0.01"
              class="w-24 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-right text-xs" 
              value="${existingCoreStat ? existingCoreStat.stat_value || 0 : ''}"
              placeholder="Value"
              data-weapon-index="${weaponIndex}"
              data-core-stat-index="${currentIndex}"
              data-type="core-value">
            <button class="text-red-500 hover:text-red-400 w-6 text-center text-sm" 
              data-weapon-index="${weaponIndex}" 
              data-core-stat-index="${currentIndex}"
              data-type="remove-core-stat">×</button>
          `;

          coreStatsInline.appendChild(datalist);
          coreStatsInline.appendChild(statDiv);
          currentIndex++;
        }

        // Handle specific augmentation types - show filtered inputs per core option
        for (let i = 0; i < specificAugmentationOptions.length; i++) {
          const coreOption = specificAugmentationOptions[i];
          const existingCoreStat =
            state.currentBuild.weapons[weaponIndex].coreStats[currentIndex];

          const datalistId = `weapon-core-stats-${weaponIndex}-option-${currentIndex}`;
          const datalist = document.createElement('datalist');
          datalist.id = datalistId;
          datalist.innerHTML = coreOption.available_stats
            .map(
              (stat) =>
                `<option value="${state.getStatName(stat.stat_id)}"></option>`
            )
            .join('');

          const statDiv = document.createElement('div');
          statDiv.className = 'flex items-center gap-2';
          statDiv.innerHTML = `
            <input type="text" 
              list="${datalistId}"
              class="flex-1 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-gray-300 text-xs" 
              value="${existingCoreStat ? state.getStatName(existingCoreStat.stat_id) : ''}"
              placeholder="${coreOption.core_type_name} stat..."
              data-weapon-index="${weaponIndex}"
              data-core-stat-index="${currentIndex}"
              data-option-id="${coreOption.option_id}"
              data-core-type-id="${coreOption.core_type_id}">
            <input type="number" 
              step="0.01"
              class="w-24 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-right text-xs" 
              value="${existingCoreStat ? existingCoreStat.stat_value || 0 : ''}"
              placeholder="Value"
              data-weapon-index="${weaponIndex}"
              data-core-stat-index="${currentIndex}"
              data-type="core-value">
            <button class="text-red-500 hover:text-red-400 w-6 text-center text-sm" 
              data-weapon-index="${weaponIndex}" 
              data-core-stat-index="${currentIndex}"
              data-type="remove-core-stat">×</button>
          `;

          coreStatsInline.appendChild(datalist);
          coreStatsInline.appendChild(statDiv);
          currentIndex++;
        }
      }

      // Populate custom stats - show all 4 slots
      const customStatsList = weaponCard.querySelector('.custom-stats-list');
      for (let statIndex = 0; statIndex < 4; statIndex++) {
        const customStat =
          state.currentBuild.weapons[weaponIndex].customStats[statIndex];
        const statDiv = document.createElement('div');
        statDiv.className = 'flex items-center gap-2 text-xs';

        if (customStat) {
          // Existing stat - show stat name from lookup
          statDiv.innerHTML = `
            <input type="text" 
              list="weapon-stat-names-${weaponIndex}"
              class="flex-1 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-gray-300" 
              value="${state.getStatName(customStat.stat_id)}"
              placeholder="Stat Name"
              data-weapon-index="${weaponIndex}"
              data-stat-index="${statIndex}">
            <input type="number" 
              class="w-20 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-right" 
              value="${customStat.stat_value || 0}"
              placeholder="0"
              data-weapon-index="${weaponIndex}"
              data-stat-index="${statIndex}"
              data-type="value">
            <button class="text-red-500 hover:text-red-400 w-6 text-center" data-weapon-index="${weaponIndex}" data-stat-index="${statIndex}">×</button>
          `;
        } else {
          // Empty slot - show input fields
          statDiv.innerHTML = `
            <input type="text" 
              list="weapon-stat-names-${weaponIndex}"
              class="flex-1 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-gray-400" 
              value=""
              placeholder="Stat Name"
              data-weapon-index="${weaponIndex}"
              data-stat-index="${statIndex}">
            <input type="number" 
              class="w-20 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-right text-gray-400" 
              value=""
              placeholder="0"
              data-weapon-index="${weaponIndex}"
              data-stat-index="${statIndex}"
              data-type="value">
            <button class="text-red-500 hover:text-red-400 w-6 text-center opacity-0" data-weapon-index="${weaponIndex}" data-stat-index="${statIndex}">×</button>
          `;
        }

        // Add change handler for stat name
        const nameInput = statDiv.querySelector('input[type="text"]');
        nameInput.addEventListener('change', (e) => {
          const statName = e.target.value.trim();
          if (statName) {
            // Find stat_id from stat_name
            const stat = state.stats.find((s) => s.stat_name === statName);
            if (stat) {
              // Initialize the slot if it doesn't exist
              if (
                !state.currentBuild.weapons[weaponIndex].customStats[statIndex]
              ) {
                state.currentBuild.weapons[weaponIndex].customStats[statIndex] =
                  {
                    stat_id: stat.stat_id,
                    stat_value: 0,
                  };
              } else {
                state.currentBuild.weapons[weaponIndex].customStats[
                  statIndex
                ].stat_id = stat.stat_id;
              }
              this.refreshWeaponsTab();
            }
          }
        });

        // Add change handler for stat value
        const valueInput = statDiv.querySelector('input[data-type="value"]');
        valueInput.addEventListener('change', (e) => {
          const value = parseFloat(e.target.value) || 0;
          if (state.currentBuild.weapons[weaponIndex].customStats[statIndex]) {
            state.currentBuild.weapons[weaponIndex].customStats[
              statIndex
            ].stat_value = value;
          }
        });

        // Add remove handler
        const removeBtn = statDiv.querySelector('button');
        removeBtn.addEventListener('click', () => {
          if (state.currentBuild.weapons[weaponIndex].customStats[statIndex]) {
            state.currentBuild.weapons[weaponIndex].customStats.splice(
              statIndex,
              1
            );
            this.refreshWeaponsTab();
          }
        });

        customStatsList.appendChild(statDiv);
      }

      // Add event listeners for inline core stats
      if (coreStatsInline && availableCoreOptions.length > 0) {
        coreStatsInline
          .querySelectorAll('input[data-core-stat-index]')
          .forEach((input) => {
            if (input.type === 'text') {
              // Stat name input - autocomplete
              input.addEventListener('change', (e) => {
                const statName = e.target.value.trim();
                const coreStatIndex = parseInt(input.dataset.coreStatIndex);
                const optionId = input.dataset.optionId;
                const coreTypeId = input.dataset.coreTypeId;

                if (statName) {
                  // Find the matching stat from the specific core option
                  const coreOption = availableCoreOptions[coreStatIndex];
                  const matchingStat = coreOption.available_stats.find(
                    (s) => state.getStatName(s.stat_id) === statName
                  );

                  if (matchingStat) {
                    // Update or create core stat entry
                    if (
                      !state.currentBuild.weapons[weaponIndex].coreStats[
                        coreStatIndex
                      ]
                    ) {
                      state.currentBuild.weapons[weaponIndex].coreStats[
                        coreStatIndex
                      ] = {
                        option_id: optionId,
                        stat_id: matchingStat.stat_id,
                        stat_value: 0,
                      };
                    } else {
                      state.currentBuild.weapons[weaponIndex].coreStats[
                        coreStatIndex
                      ].option_id = optionId;
                      state.currentBuild.weapons[weaponIndex].coreStats[
                        coreStatIndex
                      ].stat_id = matchingStat.stat_id;
                    }

                    // Set core type if not already set
                    if (!state.currentBuild.weapons[weaponIndex].coreType) {
                      state.currentBuild.weapons[weaponIndex].coreType =
                        coreTypeId;
                    }

                    this.refreshWeaponsTab();
                  }
                }
              });
            } else if (input.dataset.type === 'core-value') {
              // Core stat value input
              input.addEventListener('change', (e) => {
                const coreStatIndex = parseInt(input.dataset.coreStatIndex);
                const value = parseFloat(e.target.value) || 0;

                if (
                  state.currentBuild.weapons[weaponIndex].coreStats[
                    coreStatIndex
                  ]
                ) {
                  state.currentBuild.weapons[weaponIndex].coreStats[
                    coreStatIndex
                  ].stat_value = value;
                }
              });
            }
          });

        // Remove core stat button handlers
        coreStatsInline
          .querySelectorAll('button[data-type=\"remove-core-stat\"]')
          .forEach((btn) => {
            btn.addEventListener('click', () => {
              const coreStatIndex = parseInt(btn.dataset.coreStatIndex);
              if (
                state.currentBuild.weapons[weaponIndex].coreStats[coreStatIndex]
              ) {
                state.currentBuild.weapons[weaponIndex].coreStats.splice(
                  coreStatIndex,
                  1
                );
                this.refreshWeaponsTab();
              }
            });
          });
      }

      // Add event listeners
      const clearBtn = weaponCard.querySelector('.clear-weapon-btn');
      clearBtn.addEventListener('click', () => {
        state.currentBuild.weapons[weaponIndex] = {
          weapon: null,
          modules: Array(10).fill(null),
          customStats: [],
          coreType: null,
          coreStats: [],
        };
        this.refreshWeaponsTab();
      });
    } else {
      weaponCard.innerHTML = `
        <div class="flex items-center justify-center h-24 text-gray-500">
          <button class="btn-primary select-weapon-btn">Select Weapon</button>
        </div>
      `;

      const selectBtn = weaponCard.querySelector('.select-weapon-btn');
      selectBtn.addEventListener('click', () => {
        if (window.app) {
          window.app.openWeaponSelector(weaponIndex);
        }
      });
    }

    return weaponCard;
  }

  // Create a descendant card element
  static createDescendantCard(descendant) {
    const card = document.createElement('div');
    card.className = 'card cursor-pointer hover:scale-105 transition-transform';

    card.innerHTML = `
      <div class="aspect-square bg-tfd-darker rounded mb-2 overflow-hidden">
        ${
          descendant.descendant_image_url
            ? `
          <img src="${descendant.descendant_image_url}" alt="${descendant.descendant_name}" class="w-full h-full object-cover" loading="lazy">
        `
            : `
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-tfd-primary/50" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
            </svg>
          </div>
        `
        }
      </div>
      <div class="text-center">
        <div class="font-bold text-sm text-tfd-primary truncate" title="${descendant.descendant_name || 'Unknown'}">${descendant.descendant_name || 'Unknown'}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (window.app) {
        window.app.selectDescendant(descendant);
      }
    });

    return card;
  }

  // Refresh the modules tab
  static refreshModulesTab() {
    const triggerSlot = document.getElementById('trigger-module-slot');
    const modulesGrid = document.getElementById('descendant-modules');

    if (!triggerSlot || !modulesGrid) {
      console.error('Could not find module slot elements!');
      return;
    }

    if (triggerSlot) {
      triggerSlot.innerHTML = '';
      const triggerModuleSlot = this.createModuleSlot(
        state.currentBuild.triggerModule,
        'trigger'
      );
      triggerSlot.appendChild(triggerModuleSlot);

      // Add click handler to open module selector only if slot is empty
      if (!state.currentBuild.triggerModule) {
        triggerModuleSlot.addEventListener('click', () => {
          if (window.app) {
            window.app.openModuleSelector(-1, 'Trigger');
          }
        });
      }
    }

    if (modulesGrid) {
      modulesGrid.innerHTML = '';
      for (let i = 0; i < 12; i++) {
        const moduleSlot = this.createModuleSlot(
          state.currentBuild.descendantModules[i],
          i
        );
        modulesGrid.appendChild(moduleSlot);

        // Add click handler to open module selector only if slot is empty
        if (!state.currentBuild.descendantModules[i]) {
          moduleSlot.addEventListener('click', () => {
            if (window.app) {
              // Determine slot type based on index
              let slotType;
              if (i === 0) {
                slotType = 'Skill';
              } else if (i === 6) {
                slotType = 'Sub';
              } else {
                slotType = 'Main';
              }
              window.app.openModuleSelector(i, slotType);
            }
          });
        }
      }
    }
  }

  // Refresh the weapons tab
  static refreshWeaponsTab() {
    const weaponsGrid = document.getElementById('weapons-container');
    if (!weaponsGrid) return;

    weaponsGrid.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const weaponCard = this.createWeaponCard(
        state.currentBuild.weapons[i].weapon,
        i
      );
      weaponsGrid.appendChild(weaponCard);
    }
  }

  // Show build tabs after descendant selection
  static showBuildTabs() {
    const buildContainer = document.getElementById('build-container');
    if (buildContainer) {
      buildContainer.classList.remove('hidden');
    }
  }

  // Hide build tabs and return to selection
  static hideBuildTabs() {
    const buildContainer = document.getElementById('build-container');
    if (buildContainer) {
      buildContainer.classList.add('hidden');
    }

    state.currentDescendant = null;
    state.currentBuild = {
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
      externalComponents: [],
      archeTuning: null,
    };
  }

  // Show loading indicator
  static showLoading() {
    document.getElementById('loading')?.classList.remove('hidden');
    document.getElementById('error')?.classList.add('hidden');
    document.getElementById('build-container')?.classList.add('hidden');
  }

  // Hide loading indicator
  static hideLoading() {
    document.getElementById('loading')?.classList.add('hidden');
  }

  // Show error message
  static showError(message) {
    const errorEl = document.getElementById('error');
    const errorMessageEl = document.getElementById('error-message');

    if (errorEl && errorMessageEl) {
      errorMessageEl.textContent = message;
      errorEl.classList.remove('hidden');
    }

    UIComponents.hideLoading();
  }

  // Show success toast notification
  static showSuccess(message) {
    UIComponents.showToast(message, 'success');
  }

  // Show warning toast notification
  static showWarning(message) {
    UIComponents.showToast(message, 'warning');
  }

  // Show toast notification
  static showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      info: 'bg-blue-600',
    };
    toast.className = `${bgColors[type] || bgColors.info} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-in`;

    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ',
    };

    toast.innerHTML = `
      <span class="text-xl font-bold">${icons[type] || icons.info}</span>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-white hover:text-gray-200 text-xl font-bold">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Show build container
  static showBuildContainer() {
    document.getElementById('build-container')?.classList.remove('hidden');
  }

  // Get available core options for a weapon
  static getAvailableWeaponCoreOptions(weapon) {
    if (
      !weapon ||
      !weapon.available_core_slot ||
      weapon.available_core_slot.length === 0
    ) {
      return [];
    }

    const coreSlotId = weapon.available_core_slot[0];
    const coreSlot = state.getCoreSlot(coreSlotId);

    if (
      !coreSlot ||
      !coreSlot.available_core_type_id ||
      coreSlot.available_core_type_id.length === 0
    ) {
      return [];
    }

    const coreOptions = [];

    // Collect all core options from all core types
    coreSlot.available_core_type_id.forEach((coreTypeId) => {
      const coreType = state.getCoreType(coreTypeId);
      if (coreType && coreType.core_option) {
        coreType.core_option.forEach((option) => {
          // Collect all available stats for this option
          const availableStats = [];
          option.detail?.forEach((detail) => {
            detail.available_item_option?.forEach((itemOption) => {
              const existingStat = availableStats.find(
                (s) => s.stat_id === itemOption.option_effect.stat_id
              );
              if (!existingStat) {
                availableStats.push({
                  stat_id: itemOption.option_effect.stat_id,
                  stat_name: itemOption.item_option,
                });
              }
            });
          });

          if (availableStats.length > 0) {
            coreOptions.push({
              option_id: option.core_option_id,
              core_type_id: coreTypeId,
              core_type_name: coreType.core_type,
              available_stats: availableStats,
            });
          }
        });
      }
    });

    return coreOptions;
  }

  // Get available core options for external component
  static getAvailableExternalComponentCoreOptions(component) {
    if (
      !component ||
      !component.available_core_slot ||
      component.available_core_slot.length === 0
    ) {
      return [];
    }

    const coreSlotId = component.available_core_slot[0];
    const coreSlot = state.getCoreSlot(coreSlotId);

    if (
      !coreSlot ||
      !coreSlot.available_core_type_id ||
      coreSlot.available_core_type_id.length === 0
    ) {
      return [];
    }

    const coreOptions = [];

    // Collect all core options from all core types
    coreSlot.available_core_type_id.forEach((coreTypeId) => {
      const coreType = state.getCoreType(coreTypeId);
      if (coreType && coreType.core_option) {
        coreType.core_option.forEach((option) => {
          // Collect all available stats for this option
          const availableStats = [];
          option.detail?.forEach((detail) => {
            detail.available_item_option?.forEach((itemOption) => {
              const existingStat = availableStats.find(
                (s) => s.stat_id === itemOption.option_effect.stat_id
              );
              if (!existingStat) {
                availableStats.push({
                  stat_id: itemOption.option_effect.stat_id,
                  stat_name: itemOption.item_option,
                });
              }
            });
          });

          if (availableStats.length > 0) {
            coreOptions.push({
              option_id: option.core_option_id,
              core_type_id: coreTypeId,
              core_type_name: coreType.core_type,
              available_stats: availableStats,
            });
          }
        });
      }
    });

    return coreOptions;
  }
}
