import { state } from '../state.js';
import { UIComponents } from '../ui-components.js';

export class CustomStatSelector {
  openCustomStatSelector(weaponIndex, statSlot = null) {
    const weaponData = state.currentBuild.weapons[weaponIndex];
    const weapon = weaponData?.weapon;
    if (!weapon) {
      UIComponents.showWarning('Please select a weapon first.');
      return;
    }

    // If statSlot is not provided, find the next available slot
    if (statSlot === null) {
      statSlot = weaponData.customStats.length;
      if (statSlot >= 4) {
        UIComponents.showWarning('Maximum 4 custom stats allowed per weapon.');
        return;
      }
    }

    state.currentWeaponSlot = {
      index: weaponIndex,
      statSlot: statSlot,
      type: 'customStat',
    };

    const modal = document.getElementById('custom-stat-modal');
    if (modal) {
      modal.showModal();
    }

    const info = document.getElementById('custom-stat-info');
    if (info) {
      info.textContent = `${weapon.weapon_name} - Custom Stat ${statSlot + 1}`;
    }

    // Clear inputs
    const searchInput = document.getElementById('stat-search');
    if (searchInput) {
      searchInput.value = '';
      if (window.matchMedia('(min-width: 768px)').matches) {
        searchInput.focus();
      }
    }

    const valueInput = document.getElementById('custom-stat-value');
    if (valueInput) {
      valueInput.value = '';
    }

    // Pre-fill if editing existing stat
    const existingStat = weaponData.customStats[statSlot];
    if (existingStat) {
      if (valueInput) {
        valueInput.value = existingStat.stat_value;
      }
      state.selectedStatId = existingStat.stat_id;
    } else {
      state.selectedStatId = null;
    }

    this.renderStatSelector();
  }

  closeCustomStatSelector() {
    const modal = document.getElementById('custom-stat-modal');
    if (modal?.open) {
      modal.close();
    }
    state.currentWeaponSlot = null;
    state.selectedStatId = null;
  }

  renderStatSelector(searchQuery = '') {
    const grid = document.getElementById('stat-selector-grid');
    if (!grid) return;

    // Filter weapon-relevant stats
    const filteredStats = state.stats.filter((stat) => {
      // Filter by search query
      if (
        searchQuery &&
        !stat.stat_name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Only show weapon-related stats (you can customize this filter)
      return stat.stat_name && stat.stat_id;
    });

    // Sort alphabetically
    filteredStats.sort((a, b) => a.stat_name.localeCompare(b.stat_name));

    const weaponData =
      state.currentBuild.weapons[state.currentWeaponSlot?.index];
    const existingStat =
      weaponData?.customStats[state.currentWeaponSlot?.statSlot];

    grid.innerHTML = filteredStats
      .map((stat) => {
        const isSelected =
          state.selectedStatId === stat.stat_id ||
          existingStat?.stat_id === stat.stat_id;
        return `
        <button 
          class="w-full text-left px-3 py-2 rounded transition-colors ${
            isSelected
              ? 'bg-tfd-primary/20 border border-tfd-primary text-tfd-primary'
              : 'bg-tfd-dark hover:bg-tfd-primary/10 border border-steel-dark text-steel-light'
          }"
          onclick="window.app.selectStat('${stat.stat_id}')">
          <div class="text-sm font-semibold">${stat.stat_name}</div>
          <div class="text-xs text-steel-dark">ID: ${stat.stat_id}</div>
        </button>
      `;
      })
      .join('');

    if (filteredStats.length === 0) {
      grid.innerHTML =
        '<p class="text-center text-steel-dark py-4">No stats found</p>';
    }
  }

  filterStats() {
    const searchInput = document.getElementById('stat-search');
    const searchQuery = searchInput ? searchInput.value : '';
    this.renderStatSelector(searchQuery);
  }

  selectStat(statId) {
    state.selectedStatId = statId;
    this.renderStatSelector(
      document.getElementById('stat-search')?.value || ''
    );

    // Focus on value input
    const valueInput = document.getElementById('custom-stat-value');
    if (valueInput) {
      valueInput.focus();
    }
  }

  saveCustomStat() {
    if (
      !state.currentWeaponSlot ||
      state.currentWeaponSlot.type !== 'customStat'
    ) {
      return;
    }

    if (!state.selectedStatId) {
      UIComponents.showWarning('Please select a stat first.');
      return;
    }

    const valueInput = document.getElementById('custom-stat-value');
    const value = valueInput ? parseFloat(valueInput.value) : 0;

    if (isNaN(value) || value === 0) {
      UIComponents.showWarning('Please enter a valid stat value.');
      return;
    }

    const weaponIndex = state.currentWeaponSlot.index;
    const weaponData = state.currentBuild.weapons[weaponIndex];

    // Add the custom stat
    const newStat = {
      stat_id: state.selectedStatId,
      stat_value: value,
    };

    // Ensure we don't exceed 4 custom stats
    if (weaponData.customStats.length < 4) {
      weaponData.customStats.push(newStat);
    } else {
      UIComponents.showWarning('Maximum 4 custom stats allowed per weapon.');
      return;
    }

    this.closeCustomStatSelector();

    // Re-render weapons via app instance
    if (window.app) {
      window.app.renderWeapons();
    }
  }

  removeCustomStat(weaponIndex, statIndex) {
    const weaponData = state.currentBuild.weapons[weaponIndex];
    weaponData.customStats.splice(statIndex, 1);

    // Re-render weapons via app instance
    if (window.app) {
      window.app.renderWeapons();
    }
  }
}
