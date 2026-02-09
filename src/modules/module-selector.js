import { state } from '../state.js';
import { UIComponents } from '../ui-components.js';

export class ModuleSelector {
  openModuleSelector(slotIndex, slotType) {
    // Store the current slot context
    state.currentModuleSlot = { index: slotIndex, type: slotType };
    
    // Show the modal
    const modal = document.getElementById('module-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
    
    // Update slot info text
    const slotInfo = document.getElementById('module-slot-info');
    if (slotInfo) {
      let infoText = '';
      if (slotType === 'Trigger') {
        infoText = 'Trigger Module Slot - Trigger modules only';
      } else if (slotType === 'Skill') {
        infoText = 'Slot 1 - Skill modules only';
      } else if (slotType === 'Sub') {
        infoText = 'Slot 7 - Sub modules only';
      } else {
        infoText = `Slot ${slotIndex + 1} - Main modules`;
      }
      
      const countSpan = slotInfo.querySelector('#module-count');
      if (countSpan) {
        slotInfo.innerHTML = `${infoText} | <span id="module-count">Loading...</span>`;
      } else {
        slotInfo.textContent = infoText;
      }
    }
    
    // Clear search and filters
    const searchInput = document.getElementById('module-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus(); // Focus the search input
    }
    
    // Reset filter buttons
    document.querySelectorAll('.module-filter-btn[data-socket]').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector('.module-filter-btn[data-socket="all"]')?.classList.add('active');
    
    document.querySelectorAll('.module-filter-btn[data-tier]').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector('.module-filter-btn[data-tier="all"]')?.classList.add('active');
    
    // Render modules based on slot type
    this.renderModuleSelectorGrid(slotType);
  }

  closeModuleSelector() {
    const modal = document.getElementById('module-selector-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    state.currentModuleSlot = null;
    state.currentWeaponSlot = null;
  }

  renderModuleSelectorGrid(slotType = null, searchQuery = '', socketFilter = 'all', tierFilter = 'all') {
    // Check if this is for a weapon module
    if (state.currentWeaponSlot?.type === 'module') {
      // Handled by weapon selector
      return;
    }
    
    const grid = document.getElementById('module-selector-grid');
    if (!grid) return;
    
    console.log('renderModuleSelectorGrid called:', { slotType, searchQuery, socketFilter, tierFilter, totalModules: state.modules.length });
    
    // Filter modules
    let filteredModules = state.modules.filter(module => {
      // First filter: Only Descendant modules for descendant slots
      if (module.module_class !== 'Descendant') {
        return false;
      }
      
      // Filter by slot type using available_module_slot_type
      if (slotType && module.available_module_slot_type) {
        const hasSlotType = module.available_module_slot_type.includes(slotType);
        if (!hasSlotType) {
          return false;
        }
      }
      
      // Filter by descendant for Skill and Ancestors modules
      // If module has available_descendant_id list, check if current descendant is in it
      if (module.available_descendant_id && module.available_descendant_id.length > 0) {
        if (!state.currentDescendant || !state.currentDescendant.descendant_id) {
          return false; // No descendant selected, can't show descendant-specific modules
        }
        
        const isAvailableForDescendant = module.available_descendant_id.includes(state.currentDescendant.descendant_id);
        if (!isAvailableForDescendant) {
          return false; // Module not available for this descendant
        }
      }
      
      // Filter by search query
      if (searchQuery && !module.module_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by socket type
      if (socketFilter !== 'all' && module.module_socket_type !== socketFilter) {
        return false;
      }
      
      // Filter by tier
      if (tierFilter !== 'all' && module.module_tier_id !== tierFilter) {
        return false;
      }
      
      return true;
    });
    
    console.log('Filtered modules:', filteredModules.length);
    
    // Sort modules by name
    filteredModules.sort((a, b) => a.module_name.localeCompare(b.module_name));
    
    // Render modules
    grid.innerHTML = filteredModules.map(module => `
      <div class="module-card cursor-pointer hover:scale-105 transition-transform" 
           data-module-id="${module.module_id}"
           onclick="window.app.selectModule('${module.module_id}')">
        <div class="relative">
          ${module.image_url 
            ? `<img src="${module.image_url}" alt="${module.module_name}" class="w-full h-32 object-cover rounded-t-lg">`
            : '<div class="w-full h-32 bg-gray-800 rounded-t-lg flex items-center justify-center"><span class="text-gray-600">No Image</span></div>'
          }
          <div class="absolute top-2 right-2 px-2 py-1 text-xs rounded ${
            module.module_socket_type === 'Almandine' ? 'bg-red-600' :
            module.module_socket_type === 'Malachite' ? 'bg-green-600' :
            module.module_socket_type === 'Cerulean' ? 'bg-blue-600' :
            module.module_socket_type === 'Xantic' ? 'bg-yellow-600' :
            module.module_socket_type === 'Rutile' ? 'bg-purple-600' :
            'bg-gray-500'
          }">
            ${module.module_socket_type || 'N/A'}
          </div>
        </div>
        <div class="p-3">
          <h4 class="font-bold text-sm mb-1 text-tfd-primary">${module.module_name}</h4>
          <div class="text-xs text-gray-400 space-y-1">
            ${module.module_tier_id ? `<div>${module.module_tier_id.replace('Tier', 'Tier ')}</div>` : ''}
            ${module.available_module_slot_type?.length > 0 ? `<div>Slot: ${module.available_module_slot_type.join(', ')}</div>` : ''}
            ${module.module_type ? `<div class="text-tfd-accent">Type: ${module.module_type}</div>` : ''}
          </div>
        </div>
      </div>
    `).join('');
    
    // Show count
    const countEl = document.getElementById('module-count');
    if (countEl) {
      countEl.textContent = `${filteredModules.length} modules`;
    }
  }

  selectModule(moduleId) {
    if (!state.currentModuleSlot) return;
    
    const module = state.modules.find(m => m.module_id === moduleId);
    if (!module) return;
    
    // Check if module_type is unique (if module_type is not null)
    if (module.module_type) {
      // Check in trigger slot
      if (state.currentBuild.triggerModule && 
          state.currentBuild.triggerModule.module_type === module.module_type && 
          state.currentModuleSlot.index !== -1) {
        alert(`A module with type "${module.module_type}" is already equipped in Trigger Slot. Only one module of each type is allowed per build.`);
        return;
      }
      
      // Check in descendant modules
      const duplicateIndex = state.currentBuild.descendantModules.findIndex((m, idx) => 
        m && m.module_type === module.module_type && idx !== state.currentModuleSlot.index
      );
      
      if (duplicateIndex !== -1) {
        alert(`A module with type "${module.module_type}" is already equipped in Slot ${duplicateIndex + 1}. Only one module of each type is allowed per build.`);
        return;
      }
    }
    
    // Assign module to the appropriate slot
    if (state.currentModuleSlot.index === -1) {
      // Trigger slot
      state.currentBuild.triggerModule = module;
    } else {
      // Regular descendant module slot
      state.currentBuild.descendantModules[state.currentModuleSlot.index] = module;
    }
    
    // Close the modal
    this.closeModuleSelector();
    
    // Re-render the modules view via app instance
    if (window.app) {
      window.app.renderModules();
    }
  }

  filterModules() {
    const searchInput = document.getElementById('module-search');
    const searchQuery = searchInput ? searchInput.value : '';
    
    // Get active socket filter
    const activeSocketFilter = document.querySelector('.module-filter-btn.active[data-socket]');
    const socketFilter = activeSocketFilter ? activeSocketFilter.dataset.socket : 'all';
    
    // Get active tier filter
    const activeTierFilter = document.querySelector('.module-filter-btn.active[data-tier]');
    const tierFilter = activeTierFilter ? activeTierFilter.dataset.tier : 'all';
    
    // Get current slot type
    const slotType = state.currentModuleSlot ? state.currentModuleSlot.type : null;
    
    this.renderModuleSelectorGrid(slotType, searchQuery, socketFilter, tierFilter);
  }

  filterModulesBySocket(socket) {
    // Update button states for socket filters
    document.querySelectorAll('.module-filter-btn[data-socket]').forEach(btn => {
      if (btn.dataset.socket === socket) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Filter modules
    this.filterModules();
  }

  filterModulesByTier(tier) {
    // Update button states for tier filters
    document.querySelectorAll('.module-filter-btn[data-tier]').forEach(btn => {
      if (btn.dataset.tier === tier) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Filter modules
    this.filterModules();
  }
}
