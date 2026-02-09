import { state } from './state.js';

// UI Components
export class UIComponents {
  // Create a module slot element
  static createModuleSlot(module, slotIndex, isWeaponModule = false, weaponIndex = null) {
    const moduleSlot = document.createElement('div');
    moduleSlot.className = 'module-slot group relative border-2 border-tfd-primary/30 rounded-lg p-3 hover:border-tfd-accent transition-all cursor-pointer bg-black/50 hover:bg-black/70';
    
    if (module) {
      const tierClass = module.module_tier ? `tier-${module.module_tier.toLowerCase()}` : '';
      moduleSlot.classList.add(tierClass);
      
      moduleSlot.innerHTML = `
        <div class="flex items-center gap-3">
          ${module.image_url ? `<img src="${module.image_url}" alt="${module.module_name}" class="w-12 h-12 rounded object-cover" />` : ''}
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm truncate">${module.module_name || 'Unknown Module'}</h4>
            <p class="text-xs text-gray-400 truncate">${module.module_type || ''}</p>
            <p class="text-xs text-tfd-accent">${module.module_tier || ''}</p>
          </div>
        </div>
        ${module.module_stat && module.module_stat.length > 0 ? `
          <div class="mt-2 space-y-1">
            ${module.module_stat.slice(0, 3).map(stat => `
              <div class="text-xs text-gray-300 flex justify-between">
                <span>${state.getStatName(stat.stat_id)}</span>
                <span class="text-tfd-accent">${stat.stat_value}</span>
              </div>
            `).join('')}
            ${module.module_stat.length > 3 ? `<div class="text-xs text-gray-500">+${module.module_stat.length - 3} more...</div>` : ''}
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
            <h5 class="font-semibold text-sm">Custom Stats (${state.currentBuild.weapons[weaponIndex].customStats.length}/4)</h5>
            ${state.currentBuild.weapons[weaponIndex].customStats.length < 4 ? 
              '<button class="btn-secondary text-xs add-custom-stat-btn">+ Add Stat</button>' : 
              ''}
          </div>
          <div class="custom-stats-list space-y-2"></div>
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
      
      // Populate custom stats
      const customStatsList = weaponCard.querySelector('.custom-stats-list');
      state.currentBuild.weapons[weaponIndex].customStats.forEach((customStat, statIndex) => {
        const statDiv = document.createElement('div');
        statDiv.className = 'flex items-center gap-2 text-xs';
        statDiv.innerHTML = `
          <span class="flex-1 text-gray-300">${state.getStatName(customStat.stat_id)}</span>
          <input type="number" 
            class="w-20 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded text-right" 
            value="${customStat.stat_value || 0}"
            data-stat-index="${statIndex}">
          <button class="text-red-500 hover:text-red-400" data-stat-index="${statIndex}">×</button>
        `;
        
        // Add change handler for custom stat value
        const input = statDiv.querySelector('input');
        input.addEventListener('change', (e) => {
          state.currentBuild.weapons[weaponIndex].customStats[statIndex].stat_value = parseFloat(e.target.value) || 0;
        });
        
        // Add remove handler
        const removeBtn = statDiv.querySelector('button');
        removeBtn.addEventListener('click', () => {
          if (window.app) {
            window.app.removeCustomStat(weaponIndex, statIndex);
          }
        });
        
        customStatsList.appendChild(statDiv);
      });
      
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
      
      const addCustomStatBtn = weaponCard.querySelector('.add-custom-stat-btn');
      if (addCustomStatBtn) {
        addCustomStatBtn.addEventListener('click', () => {
          if (window.app) {
            window.app.openCustomStatSelector(weaponIndex);
          }
        });
      }
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
