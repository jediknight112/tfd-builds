import { state } from './state.js';

// UI Components
export class UIComponents {
  // Create a module slot element
  static createModuleSlot(module, slotIndex, isWeaponModule = false, weaponIndex = null) {
    const moduleSlot = document.createElement('div');
    moduleSlot.className = 'module-slot group relative border-2 border-tfd-primary/30 rounded-lg p-3 hover:border-tfd-accent transition-all cursor-pointer bg-black/50 hover:bg-black/70';
    
    if (module) {
      const tierClass = module.module_tier ? `tier-${module.module_tier.toLowerCase()}` : '';
      if (tierClass) {
        moduleSlot.classList.add(tierClass);
      }
      
      // Get max level stats
      const maxLevelStat = module.module_stat && module.module_stat.length > 0 
        ? module.module_stat[module.module_stat.length - 1] 
        : null;
      
      const isTriggerSlot = slotIndex === 'trigger';
      
      moduleSlot.innerHTML = `
        <div class="flex flex-col gap-2">
          ${module.image_url ? `<img src="${module.image_url}" alt="${module.module_name}" class="w-full h-20 object-contain rounded" />` : ''}
          <div class="flex-1">
            <h4 class="font-semibold text-sm text-cyber-cyan mb-1 leading-tight">${module.module_name || 'Unknown Module'}</h4>
            ${!isTriggerSlot && module.module_socket_type ? `<p class="text-xs text-steel-grey">${module.module_socket_type}</p>` : ''}
            ${module.module_tier_id ? `<p class="text-xs text-steel-grey">${module.module_tier_id.replace('Tier', 'Tier ')}</p>` : ''}
            ${module.module_type ? `<p class="text-xs text-amber-gold font-semibold">${module.module_type}</p>` : ''}
          </div>
        </div>
        ${maxLevelStat ? `
          <div class="mt-2 space-y-1 border-t border-steel-dark/30 pt-2">
            ${!isTriggerSlot ? `
              <div class="text-xs flex justify-between gap-2">
                <span class="text-amber-gold font-semibold">Capacity</span>
                <span class="text-amber-gold font-semibold">${maxLevelStat.module_capacity}</span>
              </div>
            ` : ''}
            <div class="text-xs text-steel-light">${maxLevelStat.value.replace(/\[\+\]/g, '')}</div>
          </div>
        ` : ''}
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
    weaponCard.className = 'weapon-card border-2 border-tfd-primary/30 rounded-lg p-4 bg-black/50';
    
    if (weapon) {
      const tierClass = weapon.weapon_tier_id ? `tier-${weapon.weapon_tier_id.toLowerCase().replace('tier', '')}` : '';
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
          <button class="btn-secondary text-xs w-full select-core-btn">
            ${state.currentBuild.weapons[weaponIndex].coreType ? 
              state.currentBuild.weapons[weaponIndex].coreType.core_type_name : 
              'Select Core Type'}
          </button>
          <div class="core-stats-container mt-2"></div>
        </div>
        
        <div class="custom-stats-section border-t border-tfd-primary/30 pt-4">
          <div class="flex justify-between items-center mb-2">
            <h5 class="font-semibold text-sm">Additional Stats (${state.currentBuild.weapons[weaponIndex].customStats.length}/4)</h5>
          </div>
          <div class="custom-stats-list space-y-2"></div>
          <datalist id="weapon-stat-names-${weaponIndex}">
            ${state.stats.map(s => `<option value="${s.stat_name}"></option>`).join('')}
          </datalist>
        </div>
      `;
      
      // Populate weapon modules
      const modulesGrid = weaponCard.querySelector('.weapon-modules-grid');
      for (let i = 0; i < 10; i++) {
        const moduleSlot = this.createModuleSlot(state.currentBuild.weapons[weaponIndex].modules[i], i, true, weaponIndex);
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
      
      // Populate core stats
      const coreStatsContainer = weaponCard.querySelector('.core-stats-container');
      if (state.currentBuild.weapons[weaponIndex].coreType && state.currentBuild.weapons[weaponIndex].coreStats.length > 0) {
        state.currentBuild.weapons[weaponIndex].coreStats.forEach(coreStat => {
          const statDiv = document.createElement('div');
          statDiv.className = 'flex justify-between items-center text-xs text-gray-300 mt-1';
          statDiv.innerHTML = `
            <span>${state.getStatName(coreStat.stat_id)}</span>
            <input type="number" 
              class="w-20 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-right" 
              value="${coreStat.stat_value || 0}"
              data-option-id="${coreStat.option_id}"
              data-stat-id="${coreStat.stat_id}">
          `;
          
          // Add change handler for core stat value
          const input = statDiv.querySelector('input');
          input.addEventListener('change', (e) => {
            if (window.app) {
              window.app.updateCoreStatValue(weaponIndex, coreStat.option_id, coreStat.stat_id, parseFloat(e.target.value) || 0);
            }
          });
          
          coreStatsContainer.appendChild(statDiv);
        });
      }
      
      // Populate custom stats - show all 4 slots
      const customStatsList = weaponCard.querySelector('.custom-stats-list');
      for (let statIndex = 0; statIndex < 4; statIndex++) {
        const customStat = state.currentBuild.weapons[weaponIndex].customStats[statIndex];
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
            const stat = state.stats.find(s => s.stat_name === statName);
            if (stat) {
              // Initialize the slot if it doesn't exist
              if (!state.currentBuild.weapons[weaponIndex].customStats[statIndex]) {
                state.currentBuild.weapons[weaponIndex].customStats[statIndex] = {
                  stat_id: stat.stat_id,
                  stat_value: 0
                };
              } else {
                state.currentBuild.weapons[weaponIndex].customStats[statIndex].stat_id = stat.stat_id;
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
            state.currentBuild.weapons[weaponIndex].customStats[statIndex].stat_value = value;
          }
        });
        
        // Add remove handler
        const removeBtn = statDiv.querySelector('button');
        removeBtn.addEventListener('click', () => {
          if (state.currentBuild.weapons[weaponIndex].customStats[statIndex]) {
            state.currentBuild.weapons[weaponIndex].customStats.splice(statIndex, 1);
            this.refreshWeaponsTab();
          }
        });
        
        customStatsList.appendChild(statDiv);
      }
      
      // Add event listeners
      const clearBtn = weaponCard.querySelector('.clear-weapon-btn');
      clearBtn.addEventListener('click', () => {
        state.currentBuild.weapons[weaponIndex] = {
          weapon: null,
          modules: Array(10).fill(null),
          customStats: [],
          coreType: null,
          coreStats: []
        };
        this.refreshWeaponsTab();
      });
      
      const selectCoreBtn = weaponCard.querySelector('.select-core-btn');
      selectCoreBtn.addEventListener('click', () => {
        if (window.app) {
          window.app.openCoreTypeSelector(weaponIndex);
        }
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
        ${descendant.descendant_image_url ? `
          <img src="${descendant.descendant_image_url}" alt="${descendant.descendant_name}" class="w-full h-full object-cover" loading="lazy">
        ` : `
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-tfd-primary/50" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
            </svg>
          </div>
        `}
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
      const triggerModuleSlot = this.createModuleSlot(state.currentBuild.triggerModule, 'trigger');
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
        const moduleSlot = this.createModuleSlot(state.currentBuild.descendantModules[i], i);
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
      const weaponCard = this.createWeaponCard(state.currentBuild.weapons[i].weapon, i);
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
      weapons: Array(3).fill(null).map(() => ({
        weapon: null,
        modules: Array(10).fill(null),
        customStats: [],
        coreType: null,
        coreStats: []
      })),
      reactor: null,
      externalComponents: [],
      archeTuning: null,
      fellow: null,
      vehicle: null,
      inversionReinforcement: null
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

  // Show build container
  static showBuildContainer() {
    document.getElementById('build-container')?.classList.remove('hidden');
  }
}
