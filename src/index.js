// TFD Builds - The First Descendant Build Planner
// Main application file

import { state } from './state.js';
import { apiClient } from './api-client.js';
import { UIComponents } from './ui-components.js';
import { ModuleSelector } from './modules/module-selector.js';
import { WeaponSelector } from './modules/weapon-selector.js';
import { CoreSelector } from './modules/core-selector.js';
import { CustomStatSelector } from './modules/custom-stat-selector.js';

// Application class - orchestrates all components
class Application {
  constructor() {
    // Initialize feature modules
    this.moduleSelector = new ModuleSelector();
    this.weaponSelector = new WeaponSelector();
    this.coreSelector = new CoreSelector();
    this.customStatSelector = new CustomStatSelector();
  }

  async init() {
    try {
      UIComponents.showLoading();
      
      // Check if API keys are configured
      if (!state.apiKeys.workerApiKey || !state.apiKeys.nexonApiKey) {
        UIComponents.hideLoading();
        UIComponents.showError('API keys not configured. Please click Settings to add your API keys.');
        return;
      }
      
      // Load all metadata in parallel for better performance
      console.log('Loading all metadata...');
      const [
        descendants,
        modules,
        weapons,
        reactors,
        externalComponents,
        fellows,
        vehicles,
        archeTuningNodes,
        weaponTypes,
        tiers,
        stats,
        coreSlots,
        coreTypes
      ] = await Promise.all([
        apiClient.fetchDescendants(),
        apiClient.fetchModules(),
        apiClient.fetchWeapons(),
        apiClient.fetchReactors(),
        apiClient.fetchExternalComponents(),
        apiClient.fetchFellows(),
        apiClient.fetchVehicles(),
        apiClient.fetchArcheTuningNodes(),
        apiClient.fetchWeaponTypes(),
        apiClient.fetchTiers(),
        apiClient.fetchStats(),
        apiClient.fetchCoreSlots(),
        apiClient.fetchCoreTypes()
      ]);
      
      // Store all data in state
      state.descendants = descendants || [];
      state.modules = modules || [];
      state.weapons = weapons || [];
      state.reactors = reactors || [];
      state.externalComponents = externalComponents || [];
      state.fellows = fellows || [];
      state.vehicles = vehicles || [];
      state.archeTuningNodes = archeTuningNodes || [];
      state.weaponTypes = weaponTypes || [];
      state.tiers = tiers || [];
      state.stats = stats || [];
      state.coreSlots = coreSlots || [];
      state.coreTypes = coreTypes || [];
      state.buildStatLookup();
      state.buildWeaponTypeLookup();
      state.buildCoreSlotLookup();
      state.buildCoreTypeLookup();
      state.dataLoaded = true;
      
      console.log('Metadata loaded:', {
        descendants: state.descendants.length,
        modules: state.modules.length,
        weapons: state.weapons.length,
        reactors: state.reactors.length,
        externalComponents: state.externalComponents.length,
        fellows: state.fellows.length,
        vehicles: state.vehicles.length,
        archeTuningNodes: state.archeTuningNodes.length,
        weaponTypes: state.weaponTypes.length,
        tiers: state.tiers.length,
        stats: state.stats.length,
        coreSlots: state.coreSlots.length,
        coreTypes: state.coreTypes.length
      });
      
      // Render descendants
      const container = document.getElementById('descendant-selector');
      if (container) {
        container.innerHTML = '';
        
        if (state.descendants.length === 0) {
          container.innerHTML = '<p class="col-span-full text-center text-gray-400">No descendants found</p>';
        } else {
          state.descendants.forEach(descendant => {
            container.appendChild(UIComponents.createDescendantCard(descendant));
          });
        }
      }
      
      UIComponents.hideLoading();
    } catch (error) {
      console.error('Initialization error:', error);
      UIComponents.hideLoading();
      
      // Check for authentication error
      if (error.message && (error.message.includes('Authentication failed') || error.message.includes('401'))) {
        UIComponents.showError('Authentication failed. Please check your API keys in Settings.');
      } else {
        UIComponents.showError(`Failed to load data: ${error.message || 'Unknown error'}. Please check your connection and try again.`);
      }
    }
  }

  async loadDescendants() {
    // Reload descendants and update display
    try {
      UIComponents.showLoading();
      
      const data = await apiClient.fetchDescendants();
      state.descendants = data || [];
      
      const container = document.getElementById('descendant-selector');
      if (container) {
        container.innerHTML = '';
        
        if (state.descendants.length === 0) {
          container.innerHTML = '<p class="col-span-full text-center text-gray-400">No descendants found</p>';
        } else {
          state.descendants.forEach(descendant => {
            container.appendChild(UIComponents.createDescendantCard(descendant));
          });
        }
      }
      
      UIComponents.hideLoading();
    } catch (error) {
      console.error('Error loading descendants:', error);
      UIComponents.showError('Failed to reload descendants.');
    }
  }

  async selectDescendant(descendant) {
    state.currentDescendant = descendant;
    
    // Update UI
    const nameEl = document.getElementById('descendant-name');
    const descEl = document.getElementById('descendant-description');
    const imageEl = document.getElementById('descendant-image');
    
    if (nameEl) nameEl.textContent = descendant.descendant_name || 'Unknown Descendant';
    
    // Display first skill description or create a summary
    let description = 'No description available';
    if (descendant.descendant_skill && descendant.descendant_skill.length > 0) {
      const skills = descendant.descendant_skill.map(s => s.skill_name).join(', ');
      description = `Skills: ${skills}`;
    }
    if (descEl) descEl.textContent = description;
    
    // Update image
    if (imageEl && descendant.descendant_image_url) {
      imageEl.innerHTML = `<img src="${descendant.descendant_image_url}" alt="${descendant.descendant_name}" class="w-full h-full object-cover rounded-lg" loading="lazy">`;
    }
    
    // Show build tabs
    UIComponents.showBuildTabs();
    
    // Collapse descendant selection section
    const descendantSection = document.querySelector('section:has(#descendant-selector)');
    if (descendantSection) {
      descendantSection.classList.add('hidden');
    }
    
    // Initialize build for this descendant
    this.initializeBuild();
    
    // Switch to modules tab
    this.switchTab('modules');
    
    // Scroll to build container
    const buildContainer = document.getElementById('build-container');
    if (buildContainer) {
      buildContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  initializeBuild() {
    // Reset build
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
    
    // Render all build sections
    this.renderModules();
    this.renderWeapons();
    this.renderExternalComponents();
  }

  renderModules() {
    UIComponents.refreshModulesTab();
  }

  renderWeapons() {
    UIComponents.refreshWeaponsTab();
  }

  renderExternalComponents() {
    const container = document.getElementById('external-components');
    if (!container) return;
    
    container.innerHTML = `
      <div class="module-slot p-4 text-center">
        <div class="text-gray-500 mb-2">
          <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </div>
        <p class="text-sm text-gray-400">Add Component</p>
      </div>
    `.repeat(4);
  }

  switchTab(tabName) {
    state.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  }

  createNewBuild() {
    if (confirm('Create a new build? This will reset your current build.')) {
      UIComponents.hideBuildTabs();
      
      // Show descendant selection section
      const descendantSection = document.querySelector('section:has(#descendant-selector)');
      if (descendantSection) {
        descendantSection.classList.remove('hidden');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openSettings() {
    const modal = document.getElementById('settings-modal');
    const workerKeyInput = document.getElementById('worker-api-key');
    const nexonKeyInput = document.getElementById('nexon-api-key');
    
    if (modal && workerKeyInput && nexonKeyInput) {
      // Pre-fill with existing keys
      workerKeyInput.value = state.apiKeys.workerApiKey || '';
      nexonKeyInput.value = state.apiKeys.nexonApiKey || '';
      
      modal.classList.remove('hidden');
    }
  }

  closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  saveSettings() {
    const workerKeyInput = document.getElementById('worker-api-key');
    const nexonKeyInput = document.getElementById('nexon-api-key');
    
    if (workerKeyInput && nexonKeyInput) {
      const workerKey = workerKeyInput.value.trim();
      const nexonKey = nexonKeyInput.value.trim();
      
      if (!workerKey || !nexonKey) {
        alert('Please enter both API keys.');
        return;
      }
      
      state.setApiKeys(workerKey, nexonKey);
      this.closeSettings();
      
      // Reload data with new keys
      this.init();
    }
  }

  // Module selector methods (delegated to ModuleSelector)
  openModuleSelector(slotIndex, slotType) {
    this.moduleSelector.openModuleSelector(slotIndex, slotType);
  }

  closeModuleSelector() {
    this.moduleSelector.closeModuleSelector();
  }

  renderModuleSelectorGrid(slotType, searchQuery, socketFilter, tierFilter) {
    this.moduleSelector.renderModuleSelectorGrid(slotType, searchQuery, socketFilter, tierFilter);
  }

  selectModule(moduleId) {
    this.moduleSelector.selectModule(moduleId);
  }

  filterModules() {
    this.moduleSelector.filterModules();
  }

  filterModulesBySocket(socket) {
    this.moduleSelector.filterModulesBySocket(socket);
  }

  filterModulesByTier(tier) {
    this.moduleSelector.filterModulesByTier(tier);
  }

  // Weapon selector methods (delegated to WeaponSelector)
  openWeaponSelector(weaponIndex) {
    this.weaponSelector.openWeaponSelector(weaponIndex);
  }

  closeWeaponSelector() {
    this.weaponSelector.closeWeaponSelector();
  }

  renderWeaponSelectorGrid(searchQuery, typeFilter, tierFilter) {
    this.weaponSelector.renderWeaponSelectorGrid(searchQuery, typeFilter, tierFilter);
  }

  selectWeapon(weaponId) {
    this.weaponSelector.selectWeapon(weaponId);
  }

  filterWeapons() {
    this.weaponSelector.filterWeapons();
  }

  filterWeaponsByType(type) {
    this.weaponSelector.filterWeaponsByType(type);
  }

  filterWeaponsByTier(tier) {
    this.weaponSelector.filterWeaponsByTier(tier);
  }

  openWeaponModuleSelector(weaponIndex, moduleIndex) {
    this.weaponSelector.openWeaponModuleSelector(weaponIndex, moduleIndex);
  }

  renderWeaponModuleSelectorGrid(searchQuery, socketFilter, tierFilter) {
    this.weaponSelector.renderWeaponModuleSelectorGrid(searchQuery, socketFilter, tierFilter);
  }

  selectWeaponModule(moduleId) {
    this.weaponSelector.selectWeaponModule(moduleId);
  }

  // Core selector methods (delegated to CoreSelector)
  openCoreTypeSelector(weaponIndex) {
    this.coreSelector.openCoreTypeSelector(weaponIndex);
  }

  closeCoreSelector() {
    this.coreSelector.closeCoreSelector();
  }

  renderCoreTypeSelector(availableCoreTypeIds, weaponIndex) {
    this.coreSelector.renderCoreTypeSelector(availableCoreTypeIds, weaponIndex);
  }

  toggleCoreStat(coreTypeId, optionId, statId, checked) {
    this.coreSelector.toggleCoreStat(coreTypeId, optionId, statId, checked);
  }

  updateCoreStatValue(coreTypeId, optionId, statId, value) {
    this.coreSelector.updateCoreStatValue(coreTypeId, optionId, statId, value);
  }

  selectCoreType(coreTypeId, weaponIndex) {
    this.coreSelector.selectCoreType(coreTypeId, weaponIndex);
  }

  // Custom stat selector methods (delegated to CustomStatSelector)
  openCustomStatSelector(weaponIndex, statSlot) {
    this.customStatSelector.openCustomStatSelector(weaponIndex, statSlot);
  }

  closeCustomStatSelector() {
    this.customStatSelector.closeCustomStatSelector();
  }

  renderStatSelector(searchQuery) {
    this.customStatSelector.renderStatSelector(searchQuery);
  }

  filterStats() {
    this.customStatSelector.filterStats();
  }

  selectStat(statId) {
    this.customStatSelector.selectStat(statId);
  }

  saveCustomStat() {
    this.customStatSelector.saveCustomStat();
  }

  removeCustomStat(weaponIndex, statIndex) {
    this.customStatSelector.removeCustomStat(weaponIndex, statIndex);
  }
}

// Initialize the application
const app = new Application();

// Make app globally available for HTML onclick handlers
window.app = app;

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for module usage
export default app;
