import { state } from '../state.js';
import { UIComponents } from '../ui-components.js';

export class WeaponSelector {
  openWeaponSelector(weaponIndex) {
    state.currentWeaponSlot = { index: weaponIndex, type: 'weapon' };

    const modal = document.getElementById('weapon-selector-modal');
    if (modal) {
      modal.showModal();
    }

    const slotInfo = document.getElementById('weapon-slot-info');
    if (slotInfo) {
      const countSpan = slotInfo.querySelector('#weapon-count');
      if (countSpan) {
        slotInfo.innerHTML = `Weapon Slot ${weaponIndex + 1} | <span id="weapon-count">Loading...</span>`;
      } else {
        slotInfo.textContent = `Weapon Slot ${weaponIndex + 1}`;
      }
    }

    const searchInput = document.getElementById('weapon-search');
    if (searchInput) {
      searchInput.value = '';
      // Only focus on desktop to prevent mobile keyboard popup
      if (window.matchMedia('(min-width: 768px)').matches) {
        searchInput.focus();
      }
    }

    // Reset filters
    document
      .querySelectorAll('.module-filter-btn[data-weapon-type]')
      .forEach((btn) => {
        btn.classList.remove('active');
      });
    document
      .querySelector('.module-filter-btn[data-weapon-type="all"]')
      ?.classList.add('active');

    document
      .querySelectorAll('.module-filter-btn[data-weapon-tier]')
      .forEach((btn) => {
        btn.classList.remove('active');
      });
    document
      .querySelector('.module-filter-btn[data-weapon-tier="all"]')
      ?.classList.add('active');

    this.renderWeaponSelectorGrid();
  }

  closeWeaponSelector() {
    const modal = document.getElementById('weapon-selector-modal');
    if (modal?.open) {
      modal.close();
    }
    state.currentWeaponSlot = null;
  }

  renderWeaponSelectorGrid(
    searchQuery = '',
    typeFilter = 'all',
    tierFilter = 'all'
  ) {
    const grid = document.getElementById('weapon-selector-grid');
    if (!grid) return;

    let filteredWeapons = state.weapons.filter((weapon) => {
      // Filter by search query
      if (
        searchQuery &&
        !weapon.weapon_name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filter by weapon type
      if (
        typeFilter !== 'all' &&
        weapon.weapon_type !== state.getLocalizedWeaponType(typeFilter)
      ) {
        return false;
      }

      // Filter by tier
      if (tierFilter !== 'all' && weapon.weapon_tier_id !== tierFilter) {
        return false;
      }

      return true;
    });

    // Sort by tier then name
    filteredWeapons.sort((a, b) => {
      const tierOrder = { Tier1: 1, Tier2: 2, Tier3: 3 };
      const tierDiff =
        (tierOrder[a.weapon_tier_id] || 0) - (tierOrder[b.weapon_tier_id] || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.weapon_name.localeCompare(b.weapon_name);
    });

    // Update count
    const countEl = document.getElementById('weapon-count');
    if (countEl) {
      countEl.textContent = `${filteredWeapons.length} weapons`;
    }

    // Render the grid
    grid.innerHTML = '';
    if (filteredWeapons.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full text-center py-8 text-gray-400">No weapons found</div>';
      return;
    }

    filteredWeapons.forEach((weapon) => {
      const weaponCard = this.createWeaponCard(weapon);
      grid.appendChild(weaponCard);
    });
  }

  createWeaponCard(weapon) {
    const card = document.createElement('div');
    card.className =
      'card cursor-pointer hover:border-cyber-cyan transition-all hover:scale-105 h-full';

    // Get tier class for border color
    let tierClass = '';
    if (weapon.weapon_tier_id) {
      const tierNum = weapon.weapon_tier_id.replace('Tier', '');
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
            weapon.image_url
              ? `<img src="${weapon.image_url}" alt="${weapon.weapon_name}" class="w-16 h-16 object-cover rounded-sm border-2 border-steel-grey/30 shrink-0" loading="lazy" onerror="this.style.display='none'">`
              : '<div class="w-16 h-16 bg-void-deep flex items-center justify-center rounded-sm border-2 border-steel-grey/30 shrink-0"><span class="text-steel-dark text-xs">No Image</span></div>'
          }
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-cyber-cyan text-sm line-clamp-2 mb-1">${weapon.weapon_name}</h4>
            <div class="flex flex-wrap gap-1">
              ${weapon.weapon_tier_id ? `<span class="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold bg-${tierClass}/20 text-${tierClass} border border-${tierClass}/30">${state.getTierDisplayName(weapon.weapon_tier_id)}</span>` : ''}
            </div>
          </div>
        </div>
        
        <div class="space-y-1 text-xs border-t border-steel-grey/20 pt-2 mt-auto">
          <div class="flex justify-between items-center gap-2">
            <span class="text-steel-grey">Type:</span>
            <span class="text-cyber-cyan font-semibold text-right truncate">${weapon.weapon_type || 'Unknown'}</span>
          </div>
          ${
            weapon.weapon_rounds_type
              ? `
            <div class="flex justify-between items-center gap-2">
              <span class="text-steel-grey">Rounds:</span>
              <span class="text-steel-light text-right truncate">${weapon.weapon_rounds_type}</span>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;

    card.addEventListener('click', () => this.selectWeapon(weapon.weapon_id));

    return card;
  }

  selectWeapon(weaponId) {
    if (!state.currentWeaponSlot || state.currentWeaponSlot.type !== 'weapon') {
      console.error('Invalid weapon slot state');
      return;
    }

    const weapon = state.weapons.find((w) => w.weapon_id === weaponId);

    if (!weapon) {
      console.error('Weapon not found:', weaponId);
      return;
    }

    const weaponIndex = state.currentWeaponSlot.index;
    state.currentBuild.weapons[weaponIndex].weapon = weapon;

    this.closeWeaponSelector();

    // Re-render weapons via app instance
    if (window.app) {
      window.app.renderWeapons();
    }
  }

  filterWeapons() {
    const searchInput = document.getElementById('weapon-search');
    const searchQuery = searchInput ? searchInput.value : '';

    const activeTypeFilter = document.querySelector(
      '.module-filter-btn.active[data-weapon-type]'
    );
    const typeFilter = activeTypeFilter
      ? activeTypeFilter.dataset.weaponType
      : 'all';

    const activeTierFilter = document.querySelector(
      '.module-filter-btn.active[data-weapon-tier]'
    );
    const tierFilter = activeTierFilter
      ? activeTierFilter.dataset.weaponTier
      : 'all';

    this.renderWeaponSelectorGrid(searchQuery, typeFilter, tierFilter);
  }

  filterWeaponsByType(type) {
    document
      .querySelectorAll('.module-filter-btn[data-weapon-type]')
      .forEach((btn) => {
        if (btn.dataset.weaponType === type) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    this.filterWeapons();
  }

  filterWeaponsByTier(tier) {
    document
      .querySelectorAll('.module-filter-btn[data-weapon-tier]')
      .forEach((btn) => {
        if (btn.dataset.weaponTier === tier) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    this.filterWeapons();
  }

  // Weapon Module Methods
  openWeaponModuleSelector(weaponIndex, moduleIndex) {
    const weaponData = state.currentBuild.weapons[weaponIndex];
    if (!weaponData?.weapon) {
      UIComponents.showWarning('Please select a weapon first');
      return;
    }

    state.currentWeaponSlot = {
      index: weaponIndex,
      moduleIndex: moduleIndex,
      type: 'module',
    };

    const modal = document.getElementById('module-selector-modal');
    if (modal) {
      modal.showModal();
    }

    const slotInfo = document.getElementById('module-slot-info');
    if (slotInfo) {
      const weapon = weaponData.weapon;
      const countSpan = slotInfo.querySelector('#module-count');
      if (countSpan) {
        slotInfo.innerHTML = `${weapon.weapon_name} - Module Slot ${moduleIndex + 1} | <span id="module-count">Loading...</span>`;
      } else {
        slotInfo.textContent = `${weapon.weapon_name} - Module Slot ${moduleIndex + 1}`;
      }
    }

    const searchInput = document.getElementById('module-search');
    if (searchInput) {
      searchInput.value = '';
      // Only focus on desktop to prevent mobile keyboard popup
      if (window.matchMedia('(min-width: 768px)').matches) {
        searchInput.focus();
      }
    }

    // Reset filters
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

    // Render weapon modules (filter by weapon_rounds_type)
    this.renderWeaponModuleSelectorGrid();
  }

  renderWeaponModuleSelectorGrid(
    searchQuery = '',
    socketFilter = 'all',
    tierFilter = 'all'
  ) {
    const grid = document.getElementById('module-selector-grid');
    if (!grid) return;

    const weaponData =
      state.currentBuild.weapons[state.currentWeaponSlot.index];
    const weapon = weaponData?.weapon;
    if (!weapon) return;

    // Convert weapon type to module format using metadata lookup
    const weaponTypeForModule = state.getWeaponTypeCode(weapon.weapon_type);
    if (!weaponTypeForModule) {
      console.warn('Unknown weapon type:', weapon.weapon_type);
      return;
    }

    // Filter modules for this weapon type
    let filteredModules = state.modules.filter((module) => {
      // Only show modules that match the weapon's specific rounds type
      // Don't show General Rounds modules for specialized weapons
      if (module.module_class !== weapon.weapon_rounds_type) {
        return false;
      }

      // Check if module is available for this specific weapon type (if specified)
      if (
        module.available_weapon_type &&
        module.available_weapon_type.length > 0
      ) {
        if (!module.available_weapon_type.includes(weaponTypeForModule)) {
          return false;
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

    filteredModules.sort((a, b) => a.module_name.localeCompare(b.module_name));

    grid.innerHTML = filteredModules
      .map((module) => {
        const maxLevelStat =
          module.module_stat && module.module_stat.length > 0
            ? module.module_stat[module.module_stat.length - 1]
            : null;

        return `
        <div class="card cursor-pointer hover:border-cyber-cyan transition-all" 
             data-module-id="${module.module_id}"
             onclick="window.app.selectWeaponModule('${module.module_id}')">
          <div class="relative mb-2">
            ${
              module.image_url
                ? `<img src="${module.image_url}" alt="${module.module_name}" class="w-full h-24 object-contain" loading="lazy">`
                : '<div class="w-full h-24 bg-void-deep flex items-center justify-center"><span class="text-steel-dark text-xs">No Image</span></div>'
            }
            <div class="absolute top-1 right-1 px-1.5 py-0.5 text-xs font-bold rounded ${(() => {
              const socketKey = state.getSocketTypeKey(
                module.module_socket_type
              );
              return socketKey === 'Almandine'
                ? 'bg-red-600'
                : socketKey === 'Malachite'
                  ? 'bg-green-600'
                  : socketKey === 'Cerulean'
                    ? 'bg-blue-600'
                    : socketKey === 'Xantic'
                      ? 'bg-yellow-600'
                      : socketKey === 'Rutile'
                        ? 'bg-purple-600'
                        : 'bg-gray-500';
            })()}">
              ${module.module_socket_type?.[0] || '?'}
            </div>
            ${
              maxLevelStat
                ? `
              <div class="absolute top-1 left-1 px-1.5 py-0.5 text-xs font-bold rounded-sm bg-amber-gold text-void-deep">
                ${maxLevelStat.module_capacity}
              </div>
            `
                : ''
            }
          </div>
          <div class="min-h-0">
            <h4 class="font-gaming font-bold text-xs text-cyber-cyan mb-1 leading-tight line-clamp-2" title="${module.module_name}">${module.module_name}</h4>
            <div class="text-xs text-steel-grey space-y-0.5">
              ${module.module_tier_id ? `<div class="text-tier-${module.module_tier_id.replace('Tier', '').toLowerCase()}">${state.getTierDisplayName(module.module_tier_id)}</div>` : ''}
              ${module.module_type ? `<div class="text-amber-gold font-semibold">${module.module_type}</div>` : ''}
              ${maxLevelStat && maxLevelStat.value ? `<div class="text-steel-light line-clamp-2 leading-tight" title="${maxLevelStat.value.replace(/\[\+\]/g, '')}">${maxLevelStat.value.replace(/\[\+\]/g, '')}</div>` : ''}
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    const countEl = document.getElementById('module-count');
    if (countEl) {
      countEl.textContent = `${filteredModules.length} modules`;
    }
  }

  selectWeaponModule(moduleId) {
    if (!state.currentWeaponSlot || state.currentWeaponSlot.type !== 'module')
      return;

    const module = state.modules.find((m) => m.module_id === moduleId);
    if (!module) return;

    // Check module_type uniqueness for this weapon
    if (module.module_type) {
      const weaponData =
        state.currentBuild.weapons[state.currentWeaponSlot.index];
      const duplicateIndex = weaponData.modules.findIndex(
        (m, idx) =>
          m &&
          m.module_type === module.module_type &&
          idx !== state.currentWeaponSlot.moduleIndex
      );

      if (duplicateIndex !== -1) {
        UIComponents.showWarning(
          `A module with type "${module.module_type}" is already equipped in Module Slot ${duplicateIndex + 1}. Only one module of each type is allowed per weapon.`
        );
        return;
      }
    }

    state.currentBuild.weapons[state.currentWeaponSlot.index].modules[
      state.currentWeaponSlot.moduleIndex
    ] = module;

    // Close the modal
    const modal = document.getElementById('module-selector-modal');
    if (modal?.open) {
      modal.close();
    }

    // Re-render weapons via app instance
    if (window.app) {
      window.app.renderWeapons();
    }
  }

  // Weapon module filtering methods
  filterWeaponModules() {
    const searchInput = document.getElementById('module-search');
    const searchQuery = searchInput ? searchInput.value : '';

    const activeSocketFilter = document.querySelector(
      '.module-filter-btn.active[data-socket]'
    );
    const socketFilter = activeSocketFilter
      ? activeSocketFilter.dataset.socket
      : 'all';

    const activeTierFilter = document.querySelector(
      '.module-filter-btn.active[data-tier]'
    );
    const tierFilter = activeTierFilter ? activeTierFilter.dataset.tier : 'all';

    this.renderWeaponModuleSelectorGrid(searchQuery, socketFilter, tierFilter);
  }

  filterWeaponModulesBySocket(socket) {
    document
      .querySelectorAll('.module-filter-btn[data-socket]')
      .forEach((btn) => {
        if (btn.dataset.socket === socket) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    this.filterWeaponModules();
  }

  filterWeaponModulesByTier(tier) {
    document
      .querySelectorAll('.module-filter-btn[data-tier]')
      .forEach((btn) => {
        if (btn.dataset.tier === tier) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    this.filterWeaponModules();
  }
}
