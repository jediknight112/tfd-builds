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

      // Load all metadata in parallel. Use allSettled so a single slow or
      // failing endpoint degrades gracefully instead of stalling the whole
      // app for 30 s — the user still gets a usable UI for the data that
      // did arrive, with a warning naming what's missing.
      const fetches = [
        ['descendants', apiClient.fetchDescendants()],
        ['modules', apiClient.fetchModules()],
        ['weapons', apiClient.fetchWeapons()],
        ['reactors', apiClient.fetchReactors()],
        ['externalComponents', apiClient.fetchExternalComponents()],
        ['archeTuningNodes', apiClient.fetchArcheTuningNodes()],
        ['archeTuningBoards', apiClient.fetchArcheTuningBoards()],
        ['archeTuningBoardGroups', apiClient.fetchArcheTuningBoardGroups()],
        ['descendantGroups', apiClient.fetchDescendantGroups()],
        ['weaponTypes', apiClient.fetchWeaponTypes()],
        ['tiers', apiClient.fetchTiers()],
        ['stats', apiClient.fetchStats()],
        ['coreSlots', apiClient.fetchCoreSlots()],
        ['coreTypes', apiClient.fetchCoreTypes()],
      ];
      const settled = await Promise.allSettled(fetches.map(([, p]) => p));
      const data = {};
      const failed = [];
      settled.forEach((result, i) => {
        const [key] = fetches[i];
        if (result.status === 'fulfilled') {
          data[key] = result.value || [];
        } else {
          console.warn(`Failed to fetch ${key}:`, result.reason);
          failed.push(key);
          data[key] = [];
        }
      });

      // Store all data in state
      state.descendants = data.descendants;
      state.modules = data.modules;
      state.weapons = data.weapons;
      state.reactors = data.reactors;
      state.externalComponents = data.externalComponents;
      state.archeTuningNodes = data.archeTuningNodes;
      state.archeTuningBoards = data.archeTuningBoards;
      state.archeTuningBoardGroups = data.archeTuningBoardGroups;
      state.descendantGroups = data.descendantGroups;
      state.weaponTypes = data.weaponTypes;
      state.tiers = data.tiers;
      state.stats = data.stats;
      state.coreSlots = data.coreSlots;
      state.coreTypes = data.coreTypes;

      if (failed.length === fetches.length) {
        UIComponents.hideLoading();
        UIComponents.showError(
          'Could not load any game data. Please try again later.'
        );
        return;
      }
      if (failed.length > 0) {
        UIComponents.showWarning(
          `Some data failed to load (${failed.join(', ')}). Some features may not work.`
        );
      }
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
            '<p class="col-span-full text-center text-steel-grey">No descendants found</p>';
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
      img.className = 'w-full h-full object-cover rounded-lg game-img';
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

  // Wrappers for arche tuning buttons. The CSP-safe data-action delegator
  // can only call methods on `app` directly, not nested objects.
  switchArcheBoardSlot(index) {
    this.archeTuning.switchBoardSlot(Number.parseInt(index, 10));
  }

  clearArcheTuningSelection() {
    this.archeTuning.clearSelection();
  }

  // CSP-safe wrappers for delegated handlers that target nested selectors.
  openReactorSelector() {
    this.reactorSelector.openReactorSelector();
  }

  openExternalComponentSelector(equipmentType) {
    this.externalComponentSelector.openExternalComponentSelector(equipmentType);
  }

  // Toast close button. The button has `data-action="closeToast"` and the
  // toast root is the closest `.toast` ancestor.
  closeToast(_arg, target) {
    target?.closest('.toast')?.remove();
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

  // CSP-safe wrappers for the core-selector handlers. Each is wired up via
  // data-action / data-change-action on the rendered element; they read the
  // multi-arg payload off `target.dataset` (since the delegator only passes
  // one positional arg). The receiving methods above stay as the public API.
  onCoreStatToggle(checked, target) {
    const { coreType, optionId, statId } = target.dataset;
    this.toggleCoreStat(coreType, optionId, statId, checked);
  }

  onCoreStatValueChange(value, target) {
    const { coreType, optionId, statId } = target.dataset;
    this.updateCoreStatValue(coreType, optionId, statId, value);
  }

  onCoreTypeSelect(_arg, target) {
    const { coreType, weaponIndex } = target.dataset;
    this.selectCoreType(coreType, Number.parseInt(weaponIndex, 10));
  }

  onExternalCoreStatToggle(checked, target) {
    const { equipmentType, coreType, optionId, statId } = target.dataset;
    this.toggleExternalComponentCoreStat(
      equipmentType,
      coreType,
      optionId,
      statId,
      checked
    );
  }

  onExternalCoreStatValueChange(value, target) {
    const { equipmentType, coreType, optionId, statId } = target.dataset;
    this.updateExternalComponentCoreStatValue(
      equipmentType,
      coreType,
      optionId,
      statId,
      value
    );
  }

  onExternalCoreTypeSelect(_arg, target) {
    const { coreType, equipmentType } = target.dataset;
    this.selectExternalComponentCoreType(coreType, equipmentType);
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
      modal.showModal();
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
    if (modal?.open) modal.close();
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

  toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    state.setTheme(newTheme);
    this.applyTheme();
  }

  applyTheme() {
    const html = document.documentElement;
    if (state.theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    this.updateThemeToggleIcons();
  }

  updateThemeToggleIcons() {
    const isDark = state.theme === 'dark';
    document.querySelectorAll('.theme-icon-sun').forEach((el) => {
      el.classList.toggle('hidden', isDark);
    });
    document.querySelectorAll('.theme-icon-moon').forEach((el) => {
      el.classList.toggle('hidden', !isDark);
    });
  }

  // Build sharing methods
  async shareBuild() {
    try {
      if (!state.currentDescendant) {
        UIComponents.showError(
          'No descendant selected. Please create a build first.'
        );
        return;
      }

      UIComponents.showToast('Generating short link...', 'info');

      // Serialize build data
      const buildData = this.buildSerializer.serialize();
      const compressed = this.buildSerializer.compress(buildData);

      let finalUrl;
      try {
        // Try to generate short URL
        finalUrl = await apiClient.shortenUrl(compressed);
      } catch (shortenError) {
        console.warn(
          'URL shortening failed, falling back to long URL:',
          shortenError
        );
        // Fallback to long URL
        const baseUrl = window.location.origin + window.location.pathname;
        finalUrl = `${baseUrl}#${compressed}`;
      }

      // Save to localStorage as backup
      this.buildSerializer.saveToLocalStorage();

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(finalUrl);
        UIComponents.showToast('Build URL copied to clipboard!', 'success');
      } catch (clipboardError) {
        // Fallback: select text in a temporary input
        const tempInput = document.createElement('input');
        tempInput.value = finalUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        UIComponents.showToast('Build URL copied to clipboard!', 'success');
      }
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

// Apply saved theme immediately
app.applyTheme();

// Make app globally available for any debug/console use.
window.app = app;

// Event delegation: HTML uses data-action / data-input-action / data-change-action
// instead of inline onclick=, so we can ship a strict CSP without 'unsafe-inline'.
// Click format: data-action="methodName" or data-action="methodName:arg" (one string).
// Change/input handlers receive (value, target) so wrappers can read dataset.*
// and checked off the element when more than one piece of data is needed.
// For checkbox/radio inputs the first arg is `target.checked` instead of `target.value`.
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const spec = target.getAttribute('data-action');
  const colonIdx = spec.indexOf(':');
  const name = colonIdx === -1 ? spec : spec.slice(0, colonIdx);
  const arg = colonIdx === -1 ? undefined : spec.slice(colonIdx + 1);
  const fn = app?.[name];
  if (typeof fn !== 'function') return;
  if (arg === undefined) fn.call(app, target);
  else fn.call(app, arg, target);
});

document.addEventListener('input', (e) => {
  const action = e.target?.getAttribute?.('data-input-action');
  if (!action) return;
  const fn = app?.[action];
  if (typeof fn === 'function') fn.call(app, e.target.value, e.target);
});

// Enter-key submit. Inputs with data-enter-action="methodName" call
// app[methodName]() on Enter. CSP-safe replacement for inline onkeydown.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const action = e.target?.getAttribute?.('data-enter-action');
  if (!action) return;
  const fn = app?.[action];
  if (typeof fn === 'function') fn.call(app);
});

document.addEventListener('change', (e) => {
  const action = e.target?.getAttribute?.('data-change-action');
  if (!action) return;
  const fn = app?.[action];
  if (typeof fn !== 'function') return;
  const t = e.target;
  const value =
    t.type === 'checkbox' || t.type === 'radio' ? t.checked : t.value;
  fn.call(app, value, t);
});

// Native <dialog> elements handle Escape key automatically (fires "cancel" event
// then closes). We listen for "cancel" to run any cleanup logic (state resets, etc.).
// Backdrop click (clicking the dialog padding area, not a child) also closes.
const dialogHandlers = {
  'module-selector-modal': () => app.closeModuleSelector(),
  'weapon-selector-modal': () => app.closeWeaponSelector(),
  'core-selector-modal': () => app.closeCoreSelector(),
  'reactor-selector-modal': () => app.reactorSelector.closeReactorSelector(),
  'external-component-selector-modal': () =>
    app.externalComponentSelector.closeExternalComponentSelector(),
  'custom-stat-modal': () => app.closeCustomStatSelector(),
  'import-build-modal': () => app.closeImportBuild(),
};
Object.entries(dialogHandlers).forEach(([id, close]) => {
  const dialog = document.getElementById(id);
  if (!dialog) return;
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
});

// Hide game images that fail to load. Replaces the inline
// onerror="this.style.display='none'" handlers (those violate the strict CSP).
// The Nexon API currently returns null for every image URL, so this fires often.
// `error` events don't bubble, so the listener uses capture mode.
document.addEventListener(
  'error',
  (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && t.classList.contains('game-img')) {
      t.style.display = 'none';
    }
  },
  true
);

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
