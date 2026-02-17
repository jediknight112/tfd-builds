// TFD Builds - The First Descendant Build Planner
// Main application file

import { state, createDefaultBuild } from './state.js';
import { apiClient } from './api-client.js';
import { UIComponents } from './ui-components.js';
import { SUPPORTED_LANGUAGES } from './config.js';
import { ModuleSelector } from './modules/module-selector.js';
import { WeaponSelector } from './modules/weapon-selector.js';
import { ReactorSelector } from './modules/reactor-selector.js';
import { ExternalComponentSelector } from './modules/external-component-selector.js';
import { CoreSelector } from './modules/core-selector.js';
import { CustomStatSelector } from './modules/custom-stat-selector.js';
import { ArcheTuning } from './modules/arche-tuning.js';
import { BuildSerializer } from './build-serializer.js';
import { BuildImporter } from './modules/build-importer.js';

// Application class - orchestrates all components
class Application {
  constructor() {
    this._initializing = false;

    // Initialize feature modules
    this.moduleSelector = new ModuleSelector();
    this.weaponSelector = new WeaponSelector();
    this.reactorSelector = new ReactorSelector();
    this.externalComponentSelector = new ExternalComponentSelector();
    this.coreSelector = new CoreSelector();
    this.customStatSelector = new CustomStatSelector();
    this.archeTuning = new ArcheTuning();
    this.buildSerializer = new BuildSerializer(state);
    this.buildImporter = new BuildImporter();

    // Setup event listeners once
    this.reactorSelector.setupEventListeners();
    this.externalComponentSelector.setupEventListeners();
  }

  async init() {
    if (this._initializing) return;
    this._initializing = true;

    try {
      UIComponents.showLoading();
      UIComponents.updateMobileShareButton(false);

      // Populate language selector
      this.populateLanguageSelector();

      // Check if API keys are configured
      if (!state.apiKeys.workerApiKey || !state.apiKeys.nexonApiKey) {
        UIComponents.hideLoading();
        UIComponents.showError(
          'API keys are not configured. Please contact the administrator.'
        );
        return;
      }

      // Load all metadata in parallel for better performance
      const [
        descendants,
        modules,
        weapons,
        reactors,
        externalComponents,
        archeTuningNodes,
        archeTuningBoards,
        archeTuningBoardGroups,
        descendantGroups,
        weaponTypes,
        tiers,
        stats,
        coreSlots,
        coreTypes,
      ] = await Promise.all([
        apiClient.fetchDescendants(),
        apiClient.fetchModules(),
        apiClient.fetchWeapons(),
        apiClient.fetchReactors(),
        apiClient.fetchExternalComponents(),
        apiClient.fetchArcheTuningNodes(),
        apiClient.fetchArcheTuningBoards(),
        apiClient.fetchArcheTuningBoardGroups(),
        apiClient.fetchDescendantGroups(),
        apiClient.fetchWeaponTypes(),
        apiClient.fetchTiers(),
        apiClient.fetchStats(),
        apiClient.fetchCoreSlots(),
        apiClient.fetchCoreTypes(),
      ]);

      // Store all data in state
      state.descendants = descendants || [];
      state.modules = modules || [];
      state.weapons = weapons || [];
      state.reactors = reactors || [];
      state.externalComponents = externalComponents || [];
      state.archeTuningNodes = archeTuningNodes || [];
      state.archeTuningBoards = archeTuningBoards || [];
      state.archeTuningBoardGroups = archeTuningBoardGroups || [];
      state.descendantGroups = descendantGroups || [];
      state.weaponTypes = weaponTypes || [];
      state.tiers = tiers || [];
      state.stats = stats || [];
      state.coreSlots = coreSlots || [];
      state.coreTypes = coreTypes || [];
      state.buildStatLookup();
      state.buildWeaponTypeLookup();
      state.buildCoreSlotLookup();
      state.buildCoreTypeLookup();
      state.buildTierLookup();
      state.dataLoaded = true;

      // Check for build in URL hash
      const urlBuild = this.buildSerializer.loadFromUrl();
      if (urlBuild && urlBuild.valid) {
        if (urlBuild.warnings.length > 0) {
          UIComponents.showWarning(
            `Build loaded with warnings: ${urlBuild.warnings.join(', ')}`
          );
        }
        // Load the descendant and build
        await this.selectDescendant(urlBuild.descendant);
        state.currentBuild = urlBuild.build;
        // Re-render everything with loaded build
        this.renderModules();
        this.renderWeapons();
        // Render special tabs if they have data
        if (urlBuild.build.reactor) {
          this.reactorSelector.renderReactorDisplay();
        }
        const hasArcheData = Array.isArray(urlBuild.build.archeTuning)
          ? urlBuild.build.archeTuning.some((s) => s !== null)
          : urlBuild.build.archeTuning !== null;
        if (hasArcheData) {
          this.archeTuning.renderArcheTuningBoard();
        }
        UIComponents.showSuccess('Build loaded from URL');
      } else if (urlBuild === null && window.location.hash) {
        // Hash exists but failed to parse
        console.error('Failed to load build from URL hash');
        UIComponents.showWarning(
          'Failed to load build from URL. Starting fresh.'
        );
      }

      // Render descendants
      const container = document.getElementById('descendant-selector');
      if (container) {
        container.innerHTML = '';

        if (state.descendants.length === 0) {
          container.innerHTML =
            '<p class="col-span-full text-center text-gray-400">No descendants found</p>';
        } else {
          // Sort descendants alphabetically by name
          // Ultimate versions come after their base version
          const sortedDescendants = [...state.descendants].sort((a, b) => {
            const nameA = (a.descendant_name || '').toLowerCase();
            const nameB = (b.descendant_name || '').toLowerCase();

            // Remove "ultimate " prefix for base comparison
            const baseA = nameA.replace(/^ultimate\s+/, '');
            const baseB = nameB.replace(/^ultimate\s+/, '');

            // If base names are the same, non-ultimate comes first
            if (baseA === baseB) {
              return nameA.startsWith('ultimate') ? 1 : -1;
            }

            // Otherwise sort by base name
            return baseA.localeCompare(baseB);
          });

          sortedDescendants.forEach((descendant) => {
            container.appendChild(
              UIComponents.createDescendantCard(descendant)
            );
          });
        }
      }

      UIComponents.hideLoading();
    } catch (error) {
      console.error('Initialization error:', error);
      UIComponents.hideLoading();

      // Check for authentication error
      if (
        error.message &&
        (error.message.includes('Authentication failed') ||
          error.message.includes('401'))
      ) {
        UIComponents.showError(
          'Authentication failed. Please contact the administrator.'
        );
      } else {
        UIComponents.showError(
          `Failed to load data: ${error.message || 'Unknown error'}. Please check your connection and try again.`
        );
      }
    } finally {
      this._initializing = false;
    }
  }

  populateLanguageSelector() {
    const selector = document.getElementById('language-selector');
    if (!selector) return;

    selector.innerHTML = '';
    SUPPORTED_LANGUAGES.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      option.selected = lang.code === state.language;
      selector.appendChild(option);
    });
  }

  async changeLanguage(languageCode) {
    if (languageCode === state.language) return;

    try {
      state.setLanguage(languageCode);

      // Reset build state
      this.initializeBuild();

      // Reset UI to start state
      UIComponents.hideBuildTabs();
      const descendantSection = document.querySelector(
        'section:has(#descendant-selector)'
      );
      if (descendantSection) {
        descendantSection.classList.remove('hidden');
      }

      // Re-initialize all metadata with new language
      await this.init();

      UIComponents.showSuccess(`Language changed to ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
      UIComponents.showError('Failed to change language. Please try again.');
    }
  }

  async selectDescendant(descendant) {
    state.currentDescendant = descendant;

    // Update UI
    const nameEl = document.getElementById('descendant-name');
    const descEl = document.getElementById('descendant-description');
    const imageEl = document.getElementById('descendant-image');

    if (nameEl)
      nameEl.textContent = descendant.descendant_name || 'Unknown Descendant';

    // Display first skill description or create a summary
    let description = 'No description available';
    if (descendant.descendant_skill && descendant.descendant_skill.length > 0) {
      const skills = descendant.descendant_skill
        .map((s) => s.skill_name)
        .join(', ');
      description = `Skills: ${skills}`;
    }
    if (descEl) descEl.textContent = description;

    // Update image
    if (imageEl && descendant.descendant_image_url) {
      const img = document.createElement('img');
      img.src = descendant.descendant_image_url;
      img.alt = descendant.descendant_name || '';
      img.className = 'w-full h-full object-cover rounded-lg';
      img.loading = 'lazy';
      imageEl.innerHTML = '';
      imageEl.appendChild(img);
    }

    // Show build tabs
    UIComponents.showBuildTabs();
    UIComponents.updateMobileShareButton(true);

    // Collapse descendant selection section
    const descendantSection = document.querySelector(
      'section:has(#descendant-selector)'
    );
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
    state.currentBuild = createDefaultBuild();

    // Reset arche tuning state so stale data from previous builds doesn't persist
    this.archeTuning.reset();

    // Render all build sections
    this.renderModules();
    this.renderWeapons();
  }

  renderModules() {
    UIComponents.refreshModulesTab();
  }

  renderWeapons() {
    UIComponents.refreshWeaponsTab();
  }

  switchTab(tabName) {
    state.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.add('hidden');
    });

    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }

    // Render tab-specific content
    if (tabName === 'reactor') {
      this.reactorSelector.renderReactorDisplay();
    } else if (tabName === 'external') {
      this.externalComponentSelector.renderExternalComponentsDisplay();
    } else if (tabName === 'arche') {
      this.archeTuning.renderArcheTuningBoard();
    }
  }

  createNewBuild() {
    UIComponents.showConfirmDialog(
      'Create a new build? This will reset your current build.',
      () => {
        UIComponents.hideBuildTabs();
        UIComponents.updateMobileShareButton(false);
        this.archeTuning.reset();

        // Clear build hash from URL so refresh doesn't reload the old build
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname);
        }

        const descendantSection = document.querySelector(
          'section:has(#descendant-selector)'
        );
        if (descendantSection) {
          descendantSection.classList.remove('hidden');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    );
  }

  // Module selector methods (delegated to ModuleSelector)
  openModuleSelector(slotIndex, slotType) {
    this.moduleSelector.openModuleSelector(slotIndex, slotType);
  }

  closeModuleSelector() {
    this.moduleSelector.closeModuleSelector();
  }

  selectModule(moduleId) {
    this.moduleSelector.selectModule(moduleId);
  }

  filterModules() {
    // Check if we're in weapon module selection mode
    if (state.currentWeaponSlot?.type === 'module') {
      this.weaponSelector.filterWeaponModules();
    } else {
      this.moduleSelector.filterModules();
    }
  }

  filterModulesBySocket(socket) {
    if (state.currentWeaponSlot?.type === 'module') {
      this.weaponSelector.filterWeaponModulesBySocket(socket);
    } else {
      this.moduleSelector.filterModulesBySocket(socket);
    }
  }

  filterModulesByTier(tier) {
    if (state.currentWeaponSlot?.type === 'module') {
      this.weaponSelector.filterWeaponModulesByTier(tier);
    } else {
      this.moduleSelector.filterModulesByTier(tier);
    }
  }

  // Weapon selector methods (delegated to WeaponSelector)
  openWeaponSelector(weaponIndex) {
    this.weaponSelector.openWeaponSelector(weaponIndex);
  }

  closeWeaponSelector() {
    this.weaponSelector.closeWeaponSelector();
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

  selectWeaponModule(moduleId) {
    this.weaponSelector.selectWeaponModule(moduleId);
  }

  filterWeaponModules() {
    this.weaponSelector.filterWeaponModules();
  }

  filterWeaponModulesBySocket(socket) {
    this.weaponSelector.filterWeaponModulesBySocket(socket);
  }

  filterWeaponModulesByTier(tier) {
    this.weaponSelector.filterWeaponModulesByTier(tier);
  }

  // Core selector methods (delegated to CoreSelector)
  openCoreTypeSelector(weaponIndex) {
    this.coreSelector.openCoreTypeSelector(weaponIndex);
  }

  closeCoreSelector() {
    this.coreSelector.closeCoreSelector();
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

  toggleExternalComponentCoreStat(
    equipmentType,
    coreTypeId,
    optionId,
    statId,
    checked
  ) {
    this.coreSelector.toggleExternalComponentCoreStat(
      equipmentType,
      coreTypeId,
      optionId,
      statId,
      checked
    );
  }

  updateExternalComponentCoreStatValue(
    equipmentType,
    coreTypeId,
    optionId,
    statId,
    value
  ) {
    this.coreSelector.updateExternalComponentCoreStatValue(
      equipmentType,
      coreTypeId,
      optionId,
      statId,
      value
    );
  }

  selectExternalComponentCoreType(coreTypeId, equipmentType) {
    this.coreSelector.selectExternalComponentCoreType(
      coreTypeId,
      equipmentType
    );
  }

  // Custom stat selector methods (delegated to CustomStatSelector)
  openCustomStatSelector(weaponIndex, statSlot) {
    this.customStatSelector.openCustomStatSelector(weaponIndex, statSlot);
  }

  closeCustomStatSelector() {
    this.customStatSelector.closeCustomStatSelector();
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

  // Build import methods
  openImportBuild() {
    const modal = document.getElementById('import-build-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const input = document.getElementById('import-username');
      if (input) {
        input.value = '';
        input.focus();
      }
      // Clear previous error/loading states
      const errorEl = document.getElementById('import-error');
      if (errorEl) errorEl.classList.add('hidden');
      const loadingEl = document.getElementById('import-loading');
      if (loadingEl) loadingEl.classList.add('hidden');
      const submitBtn = document.getElementById('import-submit-btn');
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  closeImportBuild() {
    const modal = document.getElementById('import-build-modal');
    if (modal) modal.classList.add('hidden');
  }

  async importBuild() {
    const input = document.getElementById('import-username');
    const errorEl = document.getElementById('import-error');
    const loadingEl = document.getElementById('import-loading');
    const submitBtn = document.getElementById('import-submit-btn');

    const username = input?.value?.trim();
    if (!username) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a username.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    // Show loading, hide error, disable submit
    if (errorEl) errorEl.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const result = await this.buildImporter.importBuild(username);

      if (result.warnings.length > 0) {
        UIComponents.showWarning(
          `Build imported with warnings: ${result.warnings.join(', ')}`
        );
      }

      // Close the modal
      this.closeImportBuild();

      // Reset arche tuning before loading new data
      this.archeTuning.reset();

      // Load the imported build
      await this.selectDescendant(result.descendant);
      state.currentBuild = result.build;

      // Re-render everything with imported build
      this.renderModules();
      this.renderWeapons();

      if (result.build.reactor) {
        this.reactorSelector.renderReactorDisplay();
      }

      const hasArcheData = Array.isArray(result.build.archeTuning)
        ? result.build.archeTuning.some((s) => s !== null)
        : result.build.archeTuning !== null;
      if (hasArcheData) {
        this.archeTuning.renderArcheTuningBoard();
      }

      UIComponents.showSuccess(
        `Build imported for ${result.userName || username}`
      );
    } catch (error) {
      console.error('Import failed:', error);
      if (errorEl) {
        errorEl.textContent =
          error.message || 'Failed to import build. Please try again.';
        errorEl.classList.remove('hidden');
      }
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // Build sharing methods
  shareBuild() {
    try {
      if (!state.currentDescendant) {
        UIComponents.showError(
          'No descendant selected. Please create a build first.'
        );
        return;
      }

      const url = this.buildSerializer.generateUrl();

      // Save to localStorage as backup
      this.buildSerializer.saveToLocalStorage();

      // Copy to clipboard
      navigator.clipboard
        .writeText(url)
        .then(() => {
          UIComponents.showSuccess('Build URL copied to clipboard!');
        })
        .catch(() => {
          // Fallback: select text in a temporary input
          const tempInput = document.createElement('input');
          tempInput.value = url;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          UIComponents.showSuccess('Build URL copied to clipboard!');
        });
    } catch (error) {
      console.error('Failed to share build:', error);
      UIComponents.showError(
        `Failed to create shareable URL: ${error.message}`
      );
    }
  }
}

// Initialize the application
const app = new Application();

// Make app globally available for HTML onclick handlers
window.app = app;

// Global Escape key handler for modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = [
      { id: 'module-selector-modal', close: () => app.closeModuleSelector() },
      { id: 'weapon-selector-modal', close: () => app.closeWeaponSelector() },
      { id: 'core-selector-modal', close: () => app.closeCoreSelector() },
      {
        id: 'reactor-selector-modal',
        close: () =>
          document
            .getElementById('reactor-selector-modal')
            ?.classList.add('hidden'),
      },
      {
        id: 'external-component-selector-modal',
        close: () =>
          document
            .getElementById('external-component-selector-modal')
            ?.classList.add('hidden'),
      },
      {
        id: 'custom-stat-modal',
        close: () => app.closeCustomStatSelector(),
      },
      {
        id: 'import-build-modal',
        close: () => app.closeImportBuild(),
      },
    ];

    for (const modal of modals) {
      const el = document.getElementById(modal.id);
      if (el && !el.classList.contains('hidden')) {
        modal.close();
        break;
      }
    }
  }
});

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
