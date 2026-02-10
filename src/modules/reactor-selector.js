import { state } from '../state.js';
import { getTierDisplayName } from '../config.js';
import { UIComponents } from '../ui-components.js';

export class ReactorSelector {
  openReactorSelector() {
    // Show the modal
    const modal = document.getElementById('reactor-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
    }
    
    // Update info text
    const reactorInfo = document.getElementById('reactor-slot-info');
    if (reactorInfo) {
      const countSpan = reactorInfo.querySelector('#reactor-count');
      if (countSpan) {
        reactorInfo.innerHTML = `Select Reactor | <span id="reactor-count">Loading...</span>`;
      } else {
        reactorInfo.textContent = 'Select Reactor';
      }
    }
    
    // Clear search and filters
    const searchInput = document.getElementById('reactor-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    
    // Reset filter buttons
    document.querySelectorAll('.reactor-filter-btn[data-tier]').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector('.reactor-filter-btn[data-tier="all"]')?.classList.add('active');
    
    // Render reactors
    this.renderReactorSelectorGrid();
  }

  closeReactorSelector() {
    const modal = document.getElementById('reactor-selector-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  renderReactorSelectorGrid(searchQuery = '', tierFilter = 'all') {
    const grid = document.getElementById('reactor-selector-grid');
    if (!grid) return;
    
    console.log('renderReactorSelectorGrid called:', { searchQuery, tierFilter, totalReactors: state.reactors.length });
    
    // Filter reactors
    let filteredReactors = state.reactors.filter(reactor => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = reactor.reactor_name.toLowerCase().includes(searchLower);
        if (!nameMatch) return false;
      }
      
      // Tier filter
      if (tierFilter !== 'all') {
        if (reactor.reactor_tier_id !== tierFilter) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by tier then name
    filteredReactors.sort((a, b) => {
      const tierOrder = { 'Tier1': 1, 'Tier2': 2, 'Tier3': 3 };
      const tierDiff = (tierOrder[a.reactor_tier_id] || 0) - (tierOrder[b.reactor_tier_id] || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.reactor_name.localeCompare(b.reactor_name);
    });
    
    // Update count
    const countSpan = document.getElementById('reactor-count');
    if (countSpan) {
      countSpan.textContent = `${filteredReactors.length} reactors`;
    }
    
    // Render the grid
    grid.innerHTML = '';
    if (filteredReactors.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-400">No reactors found</div>';
      return;
    }
    
    filteredReactors.forEach(reactor => {
      const reactorCard = this.createReactorCard(reactor);
      grid.appendChild(reactorCard);
    });
  }

  createReactorCard(reactor) {
    const card = document.createElement('div');
    card.className = 'card cursor-pointer hover:border-cyber-cyan transition-all hover:scale-105';
    
    // Get tier class for border color - convert "Tier1" to "tier-1"
    let tierClass = '';
    if (reactor.reactor_tier_id) {
      const tierNum = reactor.reactor_tier_id.replace('Tier', '');
      tierClass = `tier-${tierNum}`;
    }
    if (tierClass) {
      card.classList.add('border-2');
      card.classList.add(`border-${tierClass}`);
    }
    
    // Get level 100 stats
    const level100Stat = reactor.reactor_skill_power?.find(power => power.level === 100);
    
    // Calculate enhanced skill power by adding max enchant level value
    let enhancedSkillPower = level100Stat?.skill_atk_power || 0;
    if (level100Stat?.enchant_effect && level100Stat.enchant_effect.length > 0) {
      // Determine max enchant level based on tier
      const maxEnchantLevel = reactor.reactor_tier_id === 'Tier3' ? 5 : 2;
      const maxEnchant = level100Stat.enchant_effect.find(e => e.enchant_level === maxEnchantLevel);
      if (maxEnchant) {
        enhancedSkillPower += maxEnchant.value;
      }
    }
    
    card.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="flex items-start gap-3 mb-3">
          <img 
            src="${reactor.image_url}" 
            alt="${reactor.reactor_name}"
            class="w-16 h-16 object-cover rounded border-2 border-steel-grey/30 flex-shrink-0"
            onerror="this.style.display='none'"
          >
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-cyber-cyan line-clamp-2 mb-1">${reactor.reactor_name}</h4>
            ${reactor.reactor_tier_id ? `<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-${tierClass}/20 text-${tierClass} border border-${tierClass}/30">${getTierDisplayName(reactor.reactor_tier_id)}</span>` : ''}
          </div>
        </div>
        
        ${level100Stat ? `
          <div class="space-y-2 text-sm border-t border-steel-grey/20 pt-3">
            <div class="flex justify-between items-center">
              <span class="text-steel-grey">Skill Power:</span>
              <span class="text-cyber-cyan font-bold">${enhancedSkillPower.toFixed(1)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-steel-grey">Sub Skill:</span>
              <span class="text-cyber-cyan font-bold">${level100Stat.sub_skill_atk_power.toFixed(1)}</span>
            </div>
          </div>
        ` : '<div class="text-steel-grey text-sm">No level 100 data</div>'}
      </div>
    `;
    
    card.addEventListener('click', () => this.selectReactor(reactor));
    
    return card;
  }

  selectReactor(reactor) {
    console.log('Reactor selected:', reactor);
    
    // Initialize reactorAdditionalStats if it doesn't exist
    if (!state.currentBuild.reactorAdditionalStats) {
      state.currentBuild.reactorAdditionalStats = [
        { name: '', value: 0 },
        { name: '', value: 0 }
      ];
    }
    
    // Store in build
    state.currentBuild.reactor = reactor;
    
    // Update the reactor display in the tab
    this.renderReactorDisplay();
    
    // Close the modal
    this.closeReactorSelector();
  }

  renderReactorDisplay() {
    const container = document.getElementById('reactor-content');
    if (!container) return;
    
    const reactor = state.currentBuild.reactor;
    
    if (!reactor) {
      container.innerHTML = `
        <div class="module-slot p-6 text-center cursor-pointer hover:border-cyber-cyan transition-all" onclick="app.reactorSelector.openReactorSelector()">
          <svg class="w-12 h-12 mx-auto mb-2 text-steel-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <p class="text-gray-400">Click to select a reactor</p>
        </div>
      `;
      return;
    }
    
    // Get level 100 stats
    const level100Stat = reactor.reactor_skill_power?.find(power => power.level === 100);
    
    // Get tier class for styling - convert "Tier1" to "tier-1"
    let tierClass = '';
    if (reactor.reactor_tier_id) {
      const tierNum = reactor.reactor_tier_id.replace('Tier', '');
      tierClass = `tier-${tierNum}`;
    }
    
    // Calculate enhanced skill power by adding max enchant level value
    let enhancedSkillPower = level100Stat?.skill_atk_power || 0;
    let maxEnchantValue = 0;
    let maxEnchantLevel = 0;
    if (level100Stat?.enchant_effect && level100Stat.enchant_effect.length > 0) {
      // Determine max enchant level based on tier
      maxEnchantLevel = reactor.reactor_tier_id === 'Tier3' ? 5 : 2;
      const maxEnchant = level100Stat.enchant_effect.find(e => e.enchant_level === maxEnchantLevel);
      if (maxEnchant) {
        maxEnchantValue = maxEnchant.value;
        enhancedSkillPower += maxEnchantValue;
      }
    }
    
    container.innerHTML = `
      <div class="card border-2 ${tierClass ? `border-${tierClass}` : 'border-steel-grey'}">
        <div class="flex items-start gap-4 mb-4">
          <img 
            src="${reactor.image_url}" 
            alt="${reactor.reactor_name}"
            class="w-24 h-24 object-cover rounded border-2 border-steel-grey/30 flex-shrink-0"
            onerror="this.style.display='none'"
          >
          <div class="flex-1">
            <h3 class="text-xl font-bold text-cyber-cyan mb-2">${reactor.reactor_name}</h3>
            ${reactor.reactor_tier_id ? `<span class="inline-block px-3 py-1 rounded text-sm font-semibold bg-${tierClass}/20 text-${tierClass} border border-${tierClass}/30">${getTierDisplayName(reactor.reactor_tier_id)}</span>` : ''}
          </div>
          <button 
            onclick="app.reactorSelector.openReactorSelector()"
            class="btn-secondary text-sm px-3 py-1"
          >
            Change
          </button>
        </div>
        
        ${level100Stat ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div class="bg-void-blue/40 rounded-lg p-3 border border-cyber-cyan/30">
                <div class="text-steel-grey text-sm mb-1">Enhanced Skill Attack Power (Lvl 100)</div>
                <div class="text-2xl font-bold text-cyber-cyan">${enhancedSkillPower.toFixed(1)}</div>
                ${maxEnchantValue > 0 ? `
                  <div class="text-xs text-steel-grey mt-2">
                    Base: ${level100Stat.skill_atk_power.toFixed(1)} + Enchant Lvl ${maxEnchantLevel}: ${maxEnchantValue.toFixed(1)}
                  </div>
                ` : ''}
              </div>
              <div class="bg-void-blue/40 rounded-lg p-3 border border-cyber-cyan/30">
                <div class="text-steel-grey text-sm mb-1">Sub Skill Attack Power</div>
                <div class="text-2xl font-bold text-cyber-cyan">${level100Stat.sub_skill_atk_power.toFixed(1)}</div>
              </div>
            </div>
            
            ${level100Stat.skill_power_coefficient && level100Stat.skill_power_coefficient.length > 0 ? `
              <div class="bg-void-blue/40 rounded-lg p-3 border border-steel-grey/30">
                <div class="text-steel-grey font-bold text-sm mb-3">Skill Power Coefficients</div>
                <div class="space-y-2">
                  ${level100Stat.skill_power_coefficient.map(coeff => {
                    const statName = state.getStatName(coeff.coefficient_stat_id);
                    return `
                      <div class="flex justify-between items-center text-sm">
                        <span class="text-steel-grey">${statName}:</span>
                        <span class="text-cyber-cyan font-bold">${(coeff.coefficient_stat_value * 100).toFixed(0)}%</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          
          <!-- Additional Stats Section -->
          <div class="mt-4 bg-void-blue/40 rounded-lg p-4 border border-amber-gold/30">
            <h4 class="text-amber-gold font-bold text-sm mb-3">Additional Stats</h4>
            <div class="space-y-3">
              ${(state.currentBuild.reactorAdditionalStats || [{ name: '', value: 0 }, { name: '', value: 0 }]).map((stat, index) => `
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Stat Name" 
                    value="${stat.name}"
                    list="reactor-stat-names"
                    class="flex-1 px-3 py-2 bg-void-deep border border-cyber-cyan/30 rounded text-steel-light placeholder-steel-grey text-sm focus:border-cyber-cyan focus:outline-none"
                    data-stat-index="${index}"
                  />
                  <input 
                    type="number" 
                    placeholder="0" 
                    value="${stat.value}"
                    class="w-24 px-3 py-2 bg-void-deep border border-cyber-cyan/30 rounded text-steel-light text-right text-sm focus:border-cyber-cyan focus:outline-none"
                    data-stat-index="${index}"
                    data-type="value"
                  />
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Datalist for stat name autocomplete -->
          <datalist id="reactor-stat-names">
            ${state.stats.map(s => `<option value="${s.stat_name}"></option>`).join('')}
          </datalist>
          </datalist>
        ` : '<div class="text-steel-grey">No level 100 data available</div>'}
      </div>
    `;
    
    // Add event listeners for additional stats inputs
    const statNameInputs = container.querySelectorAll('input[type="text"][data-stat-index]');
    statNameInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.statIndex);
        if (!state.currentBuild.reactorAdditionalStats) {
          state.currentBuild.reactorAdditionalStats = [{ name: '', value: 0 }, { name: '', value: 0 }];
        }
        state.currentBuild.reactorAdditionalStats[index].name = e.target.value;
      });
    });
    
    const statValueInputs = container.querySelectorAll('input[data-type="value"][data-stat-index]');
    statValueInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.statIndex);
        if (!state.currentBuild.reactorAdditionalStats) {
          state.currentBuild.reactorAdditionalStats = [{ name: '', value: 0 }, { name: '', value: 0 }];
        }
        state.currentBuild.reactorAdditionalStats[index].value = parseFloat(e.target.value) || 0;
      });
    });
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('reactor-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchQuery = e.target.value;
        const tierFilter = document.querySelector('.reactor-filter-btn[data-tier].active')?.dataset.tier || 'all';
        this.renderReactorSelectorGrid(searchQuery, tierFilter);
      });
    }
    
    // Tier filters
    document.querySelectorAll('.reactor-filter-btn[data-tier]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active state
        document.querySelectorAll('.reactor-filter-btn[data-tier]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const tierFilter = e.target.dataset.tier;
        const searchQuery = searchInput?.value || '';
        this.renderReactorSelectorGrid(searchQuery, tierFilter);
      });
    });
    
    // Close button
    const closeBtn = document.getElementById('close-reactor-selector');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeReactorSelector());
    }
    
    // Click outside to close
    const modal = document.getElementById('reactor-selector-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeReactorSelector();
        }
      });
    }
  }
}
