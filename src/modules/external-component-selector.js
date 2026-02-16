import { state } from '../state.js';
import { UIComponents } from '../ui-components.js';

export class ExternalComponentSelector {
  openExternalComponentSelector(equipmentType) {
    // Store the current equipment type
    state.currentExternalComponentType = equipmentType;

    // Show the modal
    const modal = document.getElementById('external-component-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }

    // Update info text
    const info = document.getElementById('external-component-slot-info');
    if (info) {
      const countSpan = info.querySelector('#external-component-count');
      if (countSpan) {
        info.innerHTML = `Select ${equipmentType} | <span id="external-component-count">Loading...</span>`;
      } else {
        info.textContent = `Select ${equipmentType}`;
      }
    }

    // Clear search and filters
    const searchInput = document.getElementById('external-component-search');
    if (searchInput) {
      searchInput.value = '';
      // Only focus on desktop to prevent mobile keyboard popup
      if (window.matchMedia('(min-width: 768px)').matches) {
        searchInput.focus();
      }
    }

    // Reset filter buttons
    document
      .querySelectorAll('.external-component-filter-btn[data-tier]')
      .forEach((btn) => {
        btn.classList.remove('active');
      });
    document
      .querySelector('.external-component-filter-btn[data-tier="all"]')
      ?.classList.add('active');

    // Render external components
    this.renderExternalComponentSelectorGrid();
  }

  closeExternalComponentSelector() {
    const modal = document.getElementById('external-component-selector-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    state.currentExternalComponentType = null;
  }

  renderExternalComponentSelectorGrid(searchQuery = '', tierFilter = 'all') {
    const grid = document.getElementById('external-component-selector-grid');
    if (!grid) return;

    const equipmentType = state.currentExternalComponentType;
    if (!equipmentType) return;

    // Filter external components
    let filteredComponents = state.externalComponents.filter((component) => {
      // Filter by equipment type
      if (
        component.external_component_equipment_type !==
        state.getLocalizedEquipmentType(equipmentType)
      ) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = component.external_component_name
          .toLowerCase()
          .includes(searchLower);
        if (!nameMatch) return false;
      }

      // Tier filter
      if (tierFilter !== 'all') {
        if (component.external_component_tier_id !== tierFilter) {
          return false;
        }
      }

      return true;
    });

    // Sort by tier then name
    filteredComponents.sort((a, b) => {
      const tierOrder = { Tier1: 1, Tier2: 2, Tier3: 3 };
      const tierDiff =
        (tierOrder[a.external_component_tier_id] || 0) -
        (tierOrder[b.external_component_tier_id] || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.external_component_name.localeCompare(b.external_component_name);
    });

    // Update count
    const countSpan = document.getElementById('external-component-count');
    if (countSpan) {
      countSpan.textContent = `${filteredComponents.length} components`;
    }

    // Render the grid
    grid.innerHTML = '';
    if (filteredComponents.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full text-center py-8 text-gray-400">No components found</div>';
      return;
    }

    filteredComponents.forEach((component) => {
      const componentCard = this.createExternalComponentCard(component);
      grid.appendChild(componentCard);
    });
  }

  createExternalComponentCard(component) {
    const card = document.createElement('div');
    card.className =
      'card cursor-pointer hover:border-cyber-cyan transition-all hover:scale-105';

    // Get tier class for border color - convert "Tier1" to "tier-1"
    let tierClass = '';
    if (component.external_component_tier_id) {
      const tierNum = component.external_component_tier_id.replace('Tier', '');
      tierClass = `tier-${tierNum}`;
    }
    if (tierClass) {
      card.classList.add('border-2');
      card.classList.add(`border-${tierClass}`);
    }

    // Get level 100 stats
    const level100Stat = component.base_stat?.find(
      (stat) => stat.level === 100
    );

    card.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="flex items-start gap-3 mb-3">
          <img 
            src="${component.image_url}" 
            alt="${component.external_component_name}"
            class="w-16 h-16 object-cover rounded-sm border-2 border-steel-grey/30 shrink-0"
            loading="lazy"
            onerror="this.style.display='none'"
          >
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-cyber-cyan line-clamp-2 mb-1">${component.external_component_name}</h4>
            ${component.external_component_tier_id ? `<span class="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold bg-${tierClass}/20 text-${tierClass} border border-${tierClass}/30">${state.getTierDisplayName(component.external_component_tier_id)}</span>` : ''}
          </div>
        </div>
        
        ${
          level100Stat
            ? `
          <div class="space-y-2 text-sm border-t border-steel-grey/20 pt-3">
            <div class="flex justify-between items-center">
              <span class="text-steel-grey">${state.getStatName(level100Stat.stat_id)}:</span>
              <span class="text-cyber-cyan font-bold">${level100Stat.stat_value}</span>
            </div>
            ${
              component.set_option_detail &&
              component.set_option_detail.length > 0
                ? `
              <div class="border-t border-amber-gold/20 pt-2 mt-2">
                <div class="text-amber-gold text-xs font-semibold mb-1">Set: ${component.set_option_detail[0].set_option}</div>
              </div>
            `
                : ''
            }
          </div>
        `
            : '<div class="text-steel-grey text-sm">No level 100 data</div>'
        }
      </div>
    `;

    card.addEventListener('click', () =>
      this.selectExternalComponent(component)
    );

    return card;
  }

  selectExternalComponent(component) {
    const equipmentType = state.currentExternalComponentType;
    if (!equipmentType) return;

    // Initialize externalComponents object if it doesn't exist
    if (!state.currentBuild.externalComponents) {
      state.currentBuild.externalComponents = {};
    }

    // Store in build by equipment type
    state.currentBuild.externalComponents[equipmentType] = {
      component: component,
      coreType: null,
      coreStats: [],
    };

    // Update the external component display in the tab
    this.renderExternalComponentsDisplay();

    // Close the modal
    this.closeExternalComponentSelector();
  }

  renderExternalComponentsDisplay() {
    const container = document.getElementById('external-components');
    if (!container) return;

    // Initialize if needed
    if (!state.currentBuild.externalComponents) {
      state.currentBuild.externalComponents = {};
    }

    const equipmentTypes = ['Auxiliary Power', 'Sensor', 'Memory', 'Processor'];

    container.innerHTML = '';

    equipmentTypes.forEach((equipmentType) => {
      const slotData = state.currentBuild.externalComponents[equipmentType];
      const component = slotData?.component;

      const slotDiv = document.createElement('div');
      slotDiv.className = 'card';

      if (!component) {
        // Empty slot
        slotDiv.innerHTML = `
          <div class="text-center py-6">
            <h4 class="text-steel-grey font-bold text-sm mb-3">${equipmentType}</h4>
            <button 
              class="btn-secondary text-sm"
              onclick="app.externalComponentSelector.openExternalComponentSelector('${equipmentType}')"
            >
              Select ${equipmentType}
            </button>
          </div>
        `;
      } else {
        // Component selected
        const level100Stat = component.base_stat?.find(
          (stat) => stat.level === 100
        );
        const tierClass = component.external_component_tier_id
          ? `tier-${component.external_component_tier_id.replace('Tier', '')}`
          : '';

        slotDiv.className = `card border-2 ${tierClass ? `border-${tierClass}` : 'border-steel-grey'}`;

        slotDiv.innerHTML = `
          <div class="flex items-start gap-3 mb-3">
            <img 
              src="${component.image_url}" 
              alt="${component.external_component_name}"
              class="w-16 h-16 object-cover rounded-sm border-2 border-steel-grey/30 shrink-0"
              loading="lazy"
              onerror="this.style.display='none'"
            >
            <div class="flex-1 min-w-0">
              <div class="text-steel-grey text-xs mb-1">${equipmentType}</div>
              <h4 class="font-bold text-cyber-cyan mb-1">${component.external_component_name}</h4>
              ${component.external_component_tier_id ? `<span class="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold bg-${tierClass}/20 text-${tierClass} border border-${tierClass}/30">${state.getTierDisplayName(component.external_component_tier_id)}</span>` : ''}
            </div>
            <button 
              onclick="app.externalComponentSelector.openExternalComponentSelector('${equipmentType}')"
              class="btn-secondary text-xs"
            >
              Change
            </button>
          </div>
          
          ${
            level100Stat
              ? `
            <div class="bg-void-blue/40 rounded-sm p-2 mb-2">
              <div class="flex justify-between items-center text-sm">
                <span class="text-steel-grey">${state.getStatName(level100Stat.stat_id)}:</span>
                <span class="text-cyber-cyan font-bold">${level100Stat.stat_value}</span>
              </div>
            </div>
          `
              : ''
          }
          
          ${
            component.set_option_detail &&
            component.set_option_detail.length > 0
              ? `
            <div class="bg-amber-gold/10 rounded-sm p-2 border border-amber-gold/30 mb-2">
              <div class="text-amber-gold text-xs font-bold mb-2">Set Bonus: ${component.set_option_detail[0].set_option}</div>
              ${component.set_option_detail
                .map(
                  (detail) => `
                <div class="text-xs text-steel-light mb-1">
                  <span class="text-amber-gold font-semibold">${detail.set_count} pieces:</span> ${detail.set_option_effect ? detail.set_option_effect.replace(/\n/g, '<br>') : ''}
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }
          
          ${
            component.available_core_slot &&
            component.available_core_slot.length > 0
              ? `
            <div class="border-t border-steel-grey/20 pt-2">
              <h5 class="text-steel-grey text-xs font-semibold mb-2">Core Slot Available</h5>
              <div class="core-stats-inline space-y-2"></div>
            </div>
          `
              : ''
          }
        `;
      }

      // Populate inline core stats for external components
      if (
        component &&
        component.available_core_slot &&
        component.available_core_slot.length > 0
      ) {
        const coreStatsInline = slotDiv.querySelector('.core-stats-inline');

        // Get available core options for this component
        const availableCoreOptions =
          UIComponents.getAvailableExternalComponentCoreOptions(component);

        // Show one slot per core option (not per stat)
        if (coreStatsInline && availableCoreOptions.length > 0) {
          for (let i = 0; i < availableCoreOptions.length; i++) {
            const coreOption = availableCoreOptions[i];
            const existingCoreStat =
              slotData && slotData.coreStats ? slotData.coreStats[i] : null;

            const datalistId = `external-component-core-stats-${equipmentType}-option-${i}`;
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
                class="flex-1 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded-sm text-gray-300 text-xs" 
                value="${existingCoreStat ? state.getStatName(existingCoreStat.stat_id) : ''}"
                placeholder="${coreOption.core_type_name} stat..."
                data-equipment-type="${equipmentType}"
                data-core-stat-index="${i}"
                data-option-id="${coreOption.option_id}"
                data-core-type-id="${coreOption.core_type_id}">
              <input type="number" 
                step="0.01"
                class="w-24 px-2 py-1 bg-black/50 border border-tfd-primary/30 rounded-sm text-right text-xs" 
                value="${existingCoreStat ? existingCoreStat.stat_value || 0 : ''}"
                placeholder="Value"
                data-equipment-type="${equipmentType}"
                data-core-stat-index="${i}"
                data-type="core-value">
              <button class="text-red-500 hover:text-red-400 w-6 text-center text-sm" 
                data-equipment-type="${equipmentType}"
                data-core-stat-index="${i}"
                data-type="remove-core-stat">×</button>
            `;

            // Add event listeners for stat name input
            const nameInput = statDiv.querySelector('input[type="text"]');
            nameInput.addEventListener('change', (e) => {
              const statName = e.target.value.trim();
              const coreStatIndex = parseInt(nameInput.dataset.coreStatIndex);
              const optionId = nameInput.dataset.optionId;
              const coreTypeId = nameInput.dataset.coreTypeId;

              if (statName) {
                // Find the matching stat from the specific core option
                const matchingStat = coreOption.available_stats.find(
                  (s) => state.getStatName(s.stat_id) === statName
                );

                if (matchingStat) {
                  if (!slotData.coreStats) {
                    slotData.coreStats = [];
                  }

                  if (!slotData.coreStats[coreStatIndex]) {
                    slotData.coreStats[coreStatIndex] = {
                      option_id: optionId,
                      stat_id: matchingStat.stat_id,
                      stat_value: 0,
                    };
                  } else {
                    slotData.coreStats[coreStatIndex].option_id = optionId;
                    slotData.coreStats[coreStatIndex].stat_id =
                      matchingStat.stat_id;
                  }

                  if (!slotData.coreType) {
                    slotData.coreType = coreTypeId;
                  }

                  this.renderExternalComponentsDisplay();
                }
              }
            });

            // Add event listener for value input
            const valueInput = statDiv.querySelector(
              'input[data-type="core-value"]'
            );
            valueInput.addEventListener('change', (e) => {
              const coreStatIndex = parseInt(valueInput.dataset.coreStatIndex);
              const value = parseFloat(e.target.value) || 0;

              if (slotData.coreStats && slotData.coreStats[coreStatIndex]) {
                slotData.coreStats[coreStatIndex].stat_value = value;
              }
            });

            // Add event listener for remove button
            const removeBtn = statDiv.querySelector(
              'button[data-type="remove-core-stat"]'
            );
            removeBtn.addEventListener('click', () => {
              const coreStatIndex = parseInt(removeBtn.dataset.coreStatIndex);
              if (slotData.coreStats && slotData.coreStats[coreStatIndex]) {
                slotData.coreStats.splice(coreStatIndex, 1);
                this.renderExternalComponentsDisplay();
              }
            });

            // Append datalist and stat div to container
            coreStatsInline.appendChild(datalist);
            coreStatsInline.appendChild(statDiv);
          }
        }
      }

      container.appendChild(slotDiv);
    });
  }

  openCoreSelector(equipmentType) {
    // Delegate to CoreSelector
    if (window.app && window.app.coreSelector) {
      window.app.coreSelector.openExternalComponentCoreSelector(equipmentType);
    }
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('external-component-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchQuery = e.target.value;
        const tierFilter =
          document.querySelector(
            '.external-component-filter-btn[data-tier].active'
          )?.dataset.tier || 'all';
        this.renderExternalComponentSelectorGrid(searchQuery, tierFilter);
      });
    }

    // Tier filters
    document
      .querySelectorAll('.external-component-filter-btn[data-tier]')
      .forEach((btn) => {
        btn.addEventListener('click', (e) => {
          // Update active state
          document
            .querySelectorAll('.external-component-filter-btn[data-tier]')
            .forEach((b) => b.classList.remove('active'));
          e.target.classList.add('active');

          const tierFilter = e.target.dataset.tier;
          const searchQuery = searchInput?.value || '';
          this.renderExternalComponentSelectorGrid(searchQuery, tierFilter);
        });
      });

    // Close button
    const closeBtn = document.getElementById(
      'close-external-component-selector'
    );
    if (closeBtn) {
      closeBtn.addEventListener('click', () =>
        this.closeExternalComponentSelector()
      );
    }

    // Click outside to close
    const modal = document.getElementById('external-component-selector-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeExternalComponentSelector();
        }
      });
    }
  }
}
