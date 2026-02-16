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
      // Only focus on desktop to prevent mobile keyboard popup
      if (window.matchMedia('(min-width: 768px)').matches) {
        searchInput.focus();
      }
    }

    // Reset filter buttons
    document
      .querySelectorAll('.module-filter-btn[data-socket]')
      .forEach((btn) => {
        btn.classList.remove('active');
      });
    document
      .querySelector('.module-filter-btn[data-socket="all"]')
      ?.classList.add('active');

    document
      .querySelectorAll('.module-filter-btn[data-tier]')
      .forEach((btn) => {
        btn.classList.remove('active');
      });
    document
      .querySelector('.module-filter-btn[data-tier="all"]')
      ?.classList.add('active');

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

  renderModuleSelectorGrid(
    slotType = null,
    searchQuery = '',
    socketFilter = 'all',
    tierFilter = 'all'
  ) {
    // Check if this is for a weapon module
    if (state.currentWeaponSlot?.type === 'module') {
      // Handled by weapon selector
      return;
    }

    const grid = document.getElementById('module-selector-grid');
    if (!grid) return;

    // Filter modules
    let filteredModules = state.modules.filter((module) => {
      // First filter: Only Descendant modules for descendant slots
      const localizedDescendantClass =
        state.getLocalizedModuleClass('Descendant');
      if (module.module_class !== localizedDescendantClass) {
        return false;
      }

      // Filter by slot type using available_module_slot_type
      if (slotType && module.available_module_slot_type) {
        const localizedSlotType = state.getLocalizedSlotType(slotType);
        const hasSlotType =
          module.available_module_slot_type.includes(localizedSlotType);
        if (!hasSlotType) {
          return false;
        }
      }

      // Filter by descendant for Skill and Ancestors modules
      // If module has available_descendant_id list, check if current descendant is in it
      if (
        module.available_descendant_id &&
        module.available_descendant_id.length > 0
      ) {
        if (
          !state.currentDescendant ||
          !state.currentDescendant.descendant_id
        ) {
          return false; // No descendant selected, can't show descendant-specific modules
        }

        const isAvailableForDescendant =
          module.available_descendant_id.includes(
            state.currentDescendant.descendant_id
          );
        if (!isAvailableForDescendant) {
          return false; // Module not available for this descendant
        }
      }

      // Filter by search query
      if (
        searchQuery &&
        !module.module_name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filter by socket type
      if (
        socketFilter !== 'all' &&
        module.module_socket_type !== state.getLocalizedSocketType(socketFilter)
      ) {
        return false;
      }

      // Filter by tier
      if (tierFilter !== 'all' && module.module_tier_id !== tierFilter) {
        return false;
      }

      return true;
    });

    // Sort modules by tier, then name
    filteredModules.sort((a, b) => {
      const tierOrder = { Tier1: 1, Tier2: 2, Tier3: 3 };
      const tierDiff =
        (tierOrder[a.module_tier_id] || 0) - (tierOrder[b.module_tier_id] || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.module_name.localeCompare(b.module_name);
    });

    // Update count
    const countEl = document.getElementById('module-count');
    if (countEl) {
      countEl.textContent = `${filteredModules.length} modules`;
    }

    // Render modules
    grid.innerHTML = '';
    if (filteredModules.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full text-center py-8 text-gray-400">No modules found</div>';
      return;
    }

    filteredModules.forEach((module) => {
      const moduleCard = this.createModuleCard(module, slotType);
      grid.appendChild(moduleCard);
    });
  }

  createModuleCard(module, slotType) {
    const card = document.createElement('div');
    card.className =
      'card cursor-pointer hover:border-cyber-cyan transition-all hover:scale-105';

    const maxLevelStat =
      module.module_stat && module.module_stat.length > 0
        ? module.module_stat[module.module_stat.length - 1]
        : null;

    const isTriggerModule = slotType === 'Trigger';

    // Get tier class for border color
    let tierClass = '';
    if (module.module_tier_id) {
      const tierNum = module.module_tier_id.replace('Tier', '');
      tierClass = `tier-${tierNum}`;
    }
    if (tierClass) {
      card.classList.add('border-2');
      card.classList.add(`border-${tierClass}`);
    }

    card.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="flex items-start gap-3 mb-3">
          ${
            module.image_url
              ? `<img src="${module.image_url}" alt="${module.module_name}" class="w-16 h-16 object-cover rounded-sm border-2 border-steel-grey/30 shrink-0" loading="lazy" onerror="this.style.display='none'">`
              : '<div class="w-16 h-16 bg-void-deep flex items-center justify-center rounded-sm border-2 border-steel-grey/30 shrink-0"><span class="text-steel-dark text-xs">No Image</span></div>'
          }
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-cyber-cyan line-clamp-2 mb-1">${module.module_name}</h4>
            <div class="flex flex-wrap gap-1">
              ${
                !isTriggerModule && module.module_socket_type
                  ? (() => {
                      const socketKey = state.getSocketTypeKey(
                        module.module_socket_type
                      );
                      return `
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          socketKey === 'Almandine'
                            ? 'bg-red-600 text-white'
                            : socketKey === 'Rutile'
                              ? 'bg-yellow-600 text-white'
                              : socketKey === 'Cerulean'
                                ? 'bg-blue-600 text-white'
                                : socketKey === 'Malachite'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-600 text-white'
                        }">${module.module_socket_type}</span>
                      `;
                    })()
                  : ''
              }
              ${module.module_tier_id ? `<span class="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold bg-${tierClass}/20 text-${tierClass} border border-${tierClass}/30">${state.getTierDisplayName(module.module_tier_id)}</span>` : ''}
              ${module.module_type ? `<span class="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold bg-amber-gold/20 text-amber-gold border border-amber-gold/30">${module.module_type}</span>` : ''}
            </div>
          </div>
        </div>
        
        ${
          maxLevelStat
            ? `
          <div class="space-y-2 text-sm border-t border-steel-grey/20 pt-3">
            ${
              !isTriggerModule
                ? `
              <div class="flex justify-between items-center">
                <span class="text-steel-grey">Capacity:</span>
                <span class="text-amber-gold font-bold">${maxLevelStat.module_capacity || 0}</span>
              </div>
            `
                : ''
            }
            ${maxLevelStat.value ? `<div class="text-xs text-steel-light">${maxLevelStat.value.replace(/\[\+\]/g, '')}</div>` : ''}
          </div>
        `
            : '<div class="text-steel-grey text-sm">No stat data</div>'
        }
      </div>
    `;

    card.addEventListener('click', () => this.selectModule(module.module_id));

    return card;
  }

  selectModule(moduleId) {
    if (!state.currentModuleSlot) return;

    const module = state.modules.find((m) => m.module_id === moduleId);
    if (!module) return;

    // Check if module_type is unique (if module_type is not null)
    if (module.module_type) {
      // Check in trigger slot
      if (
        state.currentBuild.triggerModule &&
        state.currentBuild.triggerModule.module_type === module.module_type &&
        state.currentModuleSlot.index !== -1
      ) {
        alert(
          `A module with type "${module.module_type}" is already equipped in Trigger Slot. Only one module of each type is allowed per build.`
        );
        return;
      }

      // Check in descendant modules
      const duplicateIndex = state.currentBuild.descendantModules.findIndex(
        (m, idx) =>
          m &&
          m.module_type === module.module_type &&
          idx !== state.currentModuleSlot.index
      );

      if (duplicateIndex !== -1) {
        alert(
          `A module with type "${module.module_type}" is already equipped in Slot ${duplicateIndex + 1}. Only one module of each type is allowed per build.`
        );
        return;
      }
    }

    // Assign module to the appropriate slot
    if (state.currentModuleSlot.index === -1) {
      // Trigger slot
      state.currentBuild.triggerModule = module;
    } else {
      // Regular descendant module slot
      state.currentBuild.descendantModules[state.currentModuleSlot.index] =
        module;
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
    const activeSocketFilter = document.querySelector(
      '.module-filter-btn.active[data-socket]'
    );
    const socketFilter = activeSocketFilter
      ? activeSocketFilter.dataset.socket
      : 'all';

    // Get active tier filter
    const activeTierFilter = document.querySelector(
      '.module-filter-btn.active[data-tier]'
    );
    const tierFilter = activeTierFilter ? activeTierFilter.dataset.tier : 'all';

    // Get current slot type
    const slotType = state.currentModuleSlot
      ? state.currentModuleSlot.type
      : null;

    this.renderModuleSelectorGrid(
      slotType,
      searchQuery,
      socketFilter,
      tierFilter
    );
  }

  filterModulesBySocket(socket) {
    // Update button states for socket filters
    document
      .querySelectorAll('.module-filter-btn[data-socket]')
      .forEach((btn) => {
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
    document
      .querySelectorAll('.module-filter-btn[data-tier]')
      .forEach((btn) => {
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
