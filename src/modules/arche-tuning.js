import { state } from '../state.js';

export class ArcheTuning {
  constructor() {
    this.selectedNodes = new Set();
    this.gridSize = 21; // 21x21 grid

    // Define the grid structure based on the visual template
    // true = visible node, false = invisible/empty
    this.gridStructure = this.createGridStructure();

    // Anchor positions (starting points)
    this.anchorPositions = [
      { row: 0, col: 10 }, // Top
      { row: 10, col: 0 }, // Left
      { row: 10, col: 10 }, // Center
      { row: 10, col: 20 }, // Right
      { row: 20, col: 10 }, // Bottom
    ];

    // Metadata storage
    this.archeBoardData = null;
    this.archeNodeData = null;
    this.statData = null;
    this.currentBoard = null; // Currently active board
    this.nodePositionMap = {}; // Maps "row,col" to node_id
    this.metadataLoaded = false;

    // DOM reference map for targeted updates (keyed by "row,col")
    this.nodeDomMap = new Map();
    // Shared floating tooltip element
    this.tooltipEl = null;
    // Long-press state for mobile tooltip
    this.longPressTimer = null;
    this.longPressTriggered = false;
  }

  reset() {
    this.selectedNodes = new Set();
    this.nodePositionMap = {};
    this.currentBoard = null;
    this.metadataLoaded = false;
    this.nodeDomMap.clear();
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  createGridStructure() {
    // Create a 21x21 grid marking which positions have visible nodes
    // Based on the exact template from the Go code (cmd.go lines 332-354)
    const grid = Array(21)
      .fill(null)
      .map(() => Array(21).fill(false));

    // Row 0
    [2, 3, 4, 5, 6, 10, 14, 15, 16, 17, 18].forEach((c) => (grid[0][c] = true));
    // Row 1
    [2, 6, 8, 9, 10, 11, 12, 14, 18].forEach((c) => (grid[1][c] = true));
    // Row 2
    [2, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 18].forEach(
      (c) => (grid[2][c] = true)
    );
    // Row 3
    [2, 4, 8, 12, 16, 18].forEach((c) => (grid[3][c] = true));
    // Row 4
    [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18].forEach(
      (c) => (grid[4][c] = true)
    );
    // Row 5
    [4, 6, 8, 12, 14, 16].forEach((c) => (grid[5][c] = true));
    // Row 6
    [4, 5, 6, 7, 8, 12, 13, 14, 15, 16].forEach((c) => (grid[6][c] = true));
    // Row 7
    [4, 8, 12, 16].forEach((c) => (grid[7][c] = true));
    // Row 8
    [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18].forEach(
      (c) => (grid[8][c] = true)
    );
    // Row 9
    [2, 4, 6, 8, 10, 12, 14, 16, 18].forEach((c) => (grid[9][c] = true));
    // Row 10
    [0, 1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 19, 20].forEach(
      (c) => (grid[10][c] = true)
    );
    // Row 11
    [2, 4, 6, 8, 10, 12, 14, 16, 18].forEach((c) => (grid[11][c] = true));
    // Row 12
    [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18].forEach(
      (c) => (grid[12][c] = true)
    );
    // Row 13
    [4, 8, 12, 16].forEach((c) => (grid[13][c] = true));
    // Row 14
    [4, 5, 6, 7, 8, 12, 13, 14, 15, 16].forEach((c) => (grid[14][c] = true));
    // Row 15
    [4, 6, 8, 12, 14, 16].forEach((c) => (grid[15][c] = true));
    // Row 16
    [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18].forEach(
      (c) => (grid[16][c] = true)
    );
    // Row 17
    [2, 4, 8, 12, 13, 16, 18].forEach((c) => (grid[17][c] = true));
    // Row 18
    [2, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 18].forEach(
      (c) => (grid[18][c] = true)
    );
    // Row 19
    [2, 6, 8, 9, 10, 11, 12, 14, 18].forEach((c) => (grid[19][c] = true));
    // Row 20
    [2, 3, 4, 5, 6, 10, 14, 15, 16, 17, 18].forEach(
      (c) => (grid[20][c] = true)
    );

    return grid;
  }

  loadMetadata() {
    // Clear previous selections when reloading metadata (e.g., descendant change)
    this.selectedNodes = new Set();
    this.nodePositionMap = {};

    // Get data from state (already loaded on page init)
    this.archeBoardData = state.archeTuningBoards;
    this.archeNodeData = state.archeTuningNodes;
    this.statData = state.stats;

    // Find the correct board based on the selected descendant
    let boardToUse = null;

    if (
      state.currentDescendant &&
      this.archeBoardData &&
      state.archeTuningBoardGroups &&
      state.descendantGroups
    ) {
      const descendantId = state.currentDescendant.descendant_id;
      const descendant = state.descendants.find(
        (d) => d.descendant_id === descendantId
      );
      const descendantGroupId = descendant?.descendant_group_id;

      if (descendantGroupId) {
        const boardGroup = state.archeTuningBoardGroups.find(
          (bg) => bg.descendant_group_id === descendantGroupId
        );
        const archeBoardId = boardGroup?.arche_tuning_board_id;

        if (archeBoardId) {
          boardToUse = this.archeBoardData.find(
            (b) => b.arche_tuning_board_id === archeBoardId
          );
        }
      }
    }

    // Fall back to first board if no descendant selected or board not found
    if (!boardToUse && this.archeBoardData && this.archeBoardData.length > 0) {
      boardToUse = this.archeBoardData[0];
    }

    this.currentBoard = boardToUse;

    // Create position map from the selected board
    if (boardToUse && boardToUse.node && Array.isArray(boardToUse.node)) {
      boardToUse.node.forEach((node) => {
        const key = `${node.position_row},${node.position_column}`;
        this.nodePositionMap[key] = node.node_id;
      });
    } else {
      console.error('Arche Tuning: Board data does not have node array');
    }

    this.metadataLoaded = true;
  }

  getNodeInfo(row, col) {
    const key = `${row},${col}`;
    const nodeId = this.nodePositionMap[key];

    if (!nodeId || !this.archeNodeData) {
      return null;
    }

    const nodeInfo = this.archeNodeData.find((n) => n.node_id === nodeId);
    if (!nodeInfo) {
      console.warn(
        `Node info not found for position ${key} with node_id ${nodeId}`
      );
    }
    return nodeInfo;
  }

  getStatName(statId) {
    if (!this.statData) return statId;
    const stat = this.statData.find((s) => s.stat_id === statId);
    return stat ? stat.stat_name : statId;
  }

  createNodeTooltip(nodeInfo) {
    if (!nodeInfo) return '';

    const tierNames = {
      Tier1: 'Normal',
      Tier2: 'Rare',
      Tier3: 'Ultimate',
    };
    const tierDisplay = tierNames[nodeInfo.tier_id] || nodeInfo.tier_id;

    let tooltip = `
      <div class="arche-tooltip">
        <div class="flex items-center gap-2 mb-1 sm:mb-2">
          <img src="${nodeInfo.node_image_url}" alt="${nodeInfo.node_name}" class="shrink-0" loading="lazy" />
          <div class="min-w-0">
            <div class="font-bold text-cyber-cyan text-xs sm:text-sm truncate">${nodeInfo.node_name}</div>
            <div class="text-[10px] sm:text-xs text-steel-grey">${nodeInfo.node_type}${nodeInfo.tier_id !== 'None' ? ` - ${tierDisplay}` : ''}</div>
          </div>
        </div>
    `;

    if (nodeInfo.required_tuning_point > 0) {
      tooltip += `<div class="text-amber-gold text-xs sm:text-sm mb-1 sm:mb-2">Cost: ${nodeInfo.required_tuning_point} point${nodeInfo.required_tuning_point > 1 ? 's' : ''}</div>`;
    }

    if (nodeInfo.node_effect && nodeInfo.node_effect.length > 0) {
      tooltip += '<div class="text-xs sm:text-sm">';
      nodeInfo.node_effect.forEach((effect) => {
        const statName = this.getStatName(effect.stat_id);
        tooltip += `<div class="text-steel-light">+${effect.stat_value} ${statName}</div>`;
      });
      tooltip += '</div>';
    }

    tooltip += '</div>';
    return tooltip;
  }

  isAnchor(row, col) {
    return this.anchorPositions.some(
      (anchor) => anchor.row === row && anchor.col === col
    );
  }

  isAdjacentToSelected(row, col) {
    const adjacentPositions = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    for (const pos of adjacentPositions) {
      if (
        pos.row >= 0 &&
        pos.row < this.gridSize &&
        pos.col >= 0 &&
        pos.col < this.gridSize &&
        this.gridStructure[pos.row][pos.col]
      ) {
        const posKey = `${pos.row},${pos.col}`;
        const isCenterAnchor = pos.row === 10 && pos.col === 10;
        if (this.selectedNodes.has(posKey) || isCenterAnchor) {
          return true;
        }
      }
    }

    return false;
  }

  countSelectedNeighbors(row, col) {
    let count = 0;

    const adjacentPositions = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    for (const pos of adjacentPositions) {
      if (
        pos.row >= 0 &&
        pos.row < this.gridSize &&
        pos.col >= 0 &&
        pos.col < this.gridSize &&
        this.gridStructure[pos.row][pos.col]
      ) {
        const posKey = `${pos.row},${pos.col}`;
        const isCenterAnchor = pos.row === 10 && pos.col === 10;
        if (this.selectedNodes.has(posKey) || isCenterAnchor) {
          count++;
        }
      }
    }

    return count;
  }

  // --- Floating Tooltip ---

  createFloatingTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
    }
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'arche-floating-tooltip';
    document.body.appendChild(this.tooltipEl);
  }

  showTooltip(nodeDiv, nodeInfo) {
    if (!this.tooltipEl || !nodeInfo) return;

    this.tooltipEl.innerHTML = this.createNodeTooltip(nodeInfo);
    this.tooltipEl.classList.remove('visible', 'below');

    // Place offscreen to measure dimensions without flicker
    this.tooltipEl.style.top = '0';
    this.tooltipEl.style.left = '-9999px';

    const tooltipWidth = this.tooltipEl.offsetWidth;
    const tooltipHeight = this.tooltipEl.offsetHeight;
    const rect = nodeDiv.getBoundingClientRect();

    // Default: above the node, horizontally centered
    let top = rect.top - tooltipHeight - 8;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let isBelow = false;

    // Flip below if tooltip would go above viewport
    if (top < 8) {
      top = rect.bottom + 8;
      isBelow = true;
    }

    // Clamp to viewport horizontal edges
    const pad = 8;
    if (left < pad) {
      left = pad;
    } else if (left + tooltipWidth > window.innerWidth - pad) {
      left = window.innerWidth - pad - tooltipWidth;
    }

    this.tooltipEl.style.top = `${top}px`;
    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.classList.toggle('below', isBelow);
    this.tooltipEl.classList.add('visible');
  }

  hideTooltip() {
    if (!this.tooltipEl) return;
    this.tooltipEl.classList.remove('visible', 'below');
  }

  // --- Rendering ---

  renderArcheTuningBoard() {
    const container = document.getElementById('arche-tuning');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <h4 class="text-cyber-cyan font-bold text-base sm:text-lg">Arche Tuning Board</h4>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="text-xs sm:text-sm text-steel-grey">
              Arche Points: <span id="selected-count" class="text-cyber-cyan font-bold">0</span><span class="text-steel-grey">/40</span>
            </div>
            <button 
              class="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              onclick="app.archeTuning.clearSelection()"
            >
              Clear Selection
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 sm:gap-4 mb-3 text-[10px] sm:text-xs text-steel-grey flex-wrap">
          <div class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border" style="border-color: #56b8f5; background: rgba(86,184,245,0.3);"></span>
            <span>Normal</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border" style="border-color: #d387f4; background: rgba(211,135,244,0.3);"></span>
            <span>Rare</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border" style="border-color: #f8e179; background: rgba(248,225,121,0.3);"></span>
            <span>Ultimate</span>
          </div>
          <div class="sm:hidden flex items-center gap-1 text-steel-grey/50 italic ml-auto">
            Long-press for details
          </div>
        </div>
        <div class="arche-scroll-container" id="arche-scroll-container">
          <div id="arche-grid" class="arche-grid">
            ${!this.metadataLoaded ? '<div class="text-steel-grey text-center py-8">Loading metadata...</div>' : ''}
          </div>
        </div>
        <div id="arche-stat-summary" class="mt-3 sm:mt-4"></div>
      </div>
    `;

    this.createFloatingTooltip();

    if (!this.metadataLoaded) {
      this.loadMetadata();
    }

    // Load any existing selection from state (must be after metadata load)
    this.loadFromState();

    this.renderGrid();
  }

  applyNodeClasses(nodeDiv, row, col) {
    const isAnchor = this.isAnchor(row, col);
    const nodeKey = `${row},${col}`;
    const isSelected = this.selectedNodes.has(nodeKey);
    const nodeInfo = this.getNodeInfo(row, col);

    const classes = ['arche-node'];

    if (isAnchor) classes.push('anchor');
    if (isSelected) classes.push('selected');

    if (nodeInfo) {
      if (nodeInfo.tier_id === 'Tier1') classes.push('tier-normal');
      else if (nodeInfo.tier_id === 'Tier2') classes.push('tier-rare');
      else if (nodeInfo.tier_id === 'Tier3') classes.push('tier-ultimate');

      if (nodeInfo.node_type === 'Hole') classes.push('tier-ultimate');
    }

    nodeDiv.className = classes.join(' ');
  }

  renderGrid() {
    const gridContainer = document.getElementById('arche-grid');
    if (!gridContainer) {
      console.error('Arche Tuning: Grid container not found');
      return;
    }

    gridContainer.innerHTML = '';
    this.nodeDomMap.clear();

    for (let row = 0; row < this.gridSize; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'arche-row';

      for (let col = 0; col < this.gridSize; col++) {
        const isVisible = this.gridStructure[row][col];
        const nodeKey = `${row},${col}`;

        if (isVisible) {
          const nodeDiv = document.createElement('div');
          this.applyNodeClasses(nodeDiv, row, col);
          nodeDiv.dataset.row = row;
          nodeDiv.dataset.col = col;

          const nodeInfo = this.getNodeInfo(row, col);

          // Node image
          if (nodeInfo && nodeInfo.node_image_url) {
            const imgEl = document.createElement('img');
            imgEl.src = nodeInfo.node_image_url;
            imgEl.alt = nodeInfo.node_name || '';
            imgEl.className = 'w-full h-full object-contain';
            imgEl.loading = 'lazy';
            nodeDiv.appendChild(imgEl);
          }

          // Desktop: hover to show tooltip
          if (nodeInfo) {
            nodeDiv.addEventListener('mouseenter', () => {
              this.showTooltip(nodeDiv, nodeInfo);
            });
            nodeDiv.addEventListener('mouseleave', () => {
              this.hideTooltip();
            });
          }

          // Click handler (tap on mobile, click on desktop)
          nodeDiv.addEventListener('click', () => {
            if (!this.longPressTriggered) {
              this.toggleNode(row, col);
            }
            this.longPressTriggered = false;
          });

          // Mobile: long-press (400ms) to show tooltip without toggling
          if (nodeInfo) {
            nodeDiv.addEventListener(
              'touchstart',
              () => {
                this.longPressTriggered = false;
                this.longPressTimer = setTimeout(() => {
                  this.longPressTriggered = true;
                  this.showTooltip(nodeDiv, nodeInfo);
                }, 400);
              },
              { passive: true }
            );

            nodeDiv.addEventListener('touchend', () => {
              clearTimeout(this.longPressTimer);
              if (this.longPressTriggered) {
                setTimeout(() => this.hideTooltip(), 1500);
              }
            });

            nodeDiv.addEventListener(
              'touchmove',
              () => {
                clearTimeout(this.longPressTimer);
                this.hideTooltip();
              },
              { passive: true }
            );
          }

          this.nodeDomMap.set(nodeKey, nodeDiv);
          rowDiv.appendChild(nodeDiv);
        } else {
          // Empty space (invisible node)
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'arche-node invisible';
          rowDiv.appendChild(emptyDiv);
        }
      }

      gridContainer.appendChild(rowDiv);
    }

    // Hide tooltip when scrolling (node moves but fixed tooltip stays)
    const scrollContainer = document.getElementById('arche-scroll-container');
    if (scrollContainer && !scrollContainer._tooltipScrollBound) {
      scrollContainer.addEventListener('scroll', () => this.hideTooltip(), {
        passive: true,
      });
      scrollContainer._tooltipScrollBound = true;
    }

    this.updateSelectedCount();
    this.updateStatSummary();
    this.autoScrollToCenter();
  }

  // Update only the toggled node and its immediate neighbors
  updateNodeVisuals(row, col) {
    const positions = [
      { row, col },
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    for (const pos of positions) {
      if (
        pos.row >= 0 &&
        pos.row < this.gridSize &&
        pos.col >= 0 &&
        pos.col < this.gridSize
      ) {
        const key = `${pos.row},${pos.col}`;
        const nodeDiv = this.nodeDomMap.get(key);
        if (nodeDiv) {
          this.applyNodeClasses(nodeDiv, pos.row, pos.col);
        }
      }
    }

    this.updateSelectedCount();
    this.updateStatSummary();
  }

  autoScrollToCenter() {
    if (window.innerWidth >= 640) return;

    const scrollContainer = document.getElementById('arche-scroll-container');
    const centerNode = this.nodeDomMap.get('10,10');

    if (!scrollContainer || !centerNode) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    const nodeRect = centerNode.getBoundingClientRect();

    const currentCenterX = containerRect.left + containerRect.width / 2;
    const nodeCenterX = nodeRect.left + nodeRect.width / 2;

    scrollContainer.scrollLeft += nodeCenterX - currentCenterX;
  }

  toggleNode(row, col) {
    const nodeKey = `${row},${col}`;

    if (this.selectedNodes.has(nodeKey)) {
      const selectedNeighbors = this.countSelectedNeighbors(row, col);

      if (selectedNeighbors <= 1) {
        this.selectedNodes.delete(nodeKey);
      } else {
        return;
      }
    } else {
      if (!this.isAdjacentToSelected(row, col)) {
        return;
      }

      const nodeInfo = this.getNodeInfo(row, col);
      const nodeCost = nodeInfo?.required_tuning_point || 0;
      const currentCost = this.calculateTotalCost();

      if (currentCost + nodeCost <= 40) {
        this.selectedNodes.add(nodeKey);
      } else {
        return;
      }
    }

    this.saveToState();
    this.updateNodeVisuals(row, col);
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.saveToState();
    // Full re-render since many nodes may change
    this.renderGrid();
  }

  calculateTotalCost() {
    let totalCost = 0;
    this.selectedNodes.forEach((nodeKey) => {
      const [row, col] = nodeKey.split(',').map(Number);
      const nodeInfo = this.getNodeInfo(row, col);
      if (nodeInfo) {
        totalCost += nodeInfo.required_tuning_point || 0;
      }
    });
    return totalCost;
  }

  updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
      const totalCost = this.calculateTotalCost();
      countElement.textContent = totalCost;

      if (totalCost >= 40) {
        countElement.className = 'text-amber-gold';
      } else if (totalCost >= 35) {
        countElement.className = 'text-yellow-400';
      } else {
        countElement.className = 'text-cyber-cyan';
      }
    }
  }

  // --- Stat Summary ---

  updateStatSummary() {
    const summaryContainer = document.getElementById('arche-stat-summary');
    if (!summaryContainer) return;

    if (this.selectedNodes.size === 0) {
      summaryContainer.innerHTML = '';
      return;
    }

    // Aggregate stats from all selected nodes
    const statMap = new Map();
    this.selectedNodes.forEach((nodeKey) => {
      const [row, col] = nodeKey.split(',').map(Number);
      const nodeInfo = this.getNodeInfo(row, col);
      if (nodeInfo && nodeInfo.node_effect) {
        nodeInfo.node_effect.forEach((effect) => {
          const statName = this.getStatName(effect.stat_id);
          const current = statMap.get(statName) || 0;
          statMap.set(statName, current + effect.stat_value);
        });
      }
    });

    if (statMap.size === 0) {
      summaryContainer.innerHTML = '';
      return;
    }

    const sortedStats = [...statMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    let html = `
      <div class="bg-void-deep/60 border border-cyber-cyan/20 rounded-lg p-3">
        <button class="flex items-center justify-between w-full text-left" id="arche-stat-toggle">
          <h5 class="text-cyber-cyan font-bold text-xs sm:text-sm uppercase tracking-wider">Selected Stats</h5>
          <svg class="w-4 h-4 text-cyber-cyan transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        <div class="stat-list grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
    `;

    sortedStats.forEach(([statName, value]) => {
      const displayValue = Number.isInteger(value) ? value : value.toFixed(2);
      html += `
        <div class="flex justify-between text-xs sm:text-sm py-0.5">
          <span class="text-steel-light truncate mr-2">${statName}</span>
          <span class="text-cyber-cyan font-bold whitespace-nowrap">+${displayValue}</span>
        </div>
      `;
    });

    html += '</div></div>';
    summaryContainer.innerHTML = html;

    // Wire up the toggle button for collapse/expand
    const toggleBtn = document.getElementById('arche-stat-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const statList = toggleBtn.parentElement.querySelector('.stat-list');
        const chevron = toggleBtn.querySelector('svg');
        if (statList) {
          statList.classList.toggle('hidden');
          if (chevron) {
            chevron.style.transform = statList.classList.contains('hidden')
              ? 'rotate(-90deg)'
              : '';
          }
        }
      });
    }
  }

  // Save current selection to state
  saveToState() {
    if (!this.metadataLoaded) {
      this.loadMetadata();
    }

    if (!this.currentBoard) {
      return;
    }

    const selectedNodes = [];
    this.selectedNodes.forEach((nodeKey) => {
      const [row, col] = nodeKey.split(',').map(Number);
      const nodeInfo = this.getNodeInfo(row, col);
      if (nodeInfo) {
        selectedNodes.push({
          ...nodeInfo,
          position_row: row,
          position_column: col,
        });
      }
    });

    state.currentBuild.archeTuning = {
      board: this.currentBoard,
      selectedNodes: selectedNodes,
    };
  }

  // Load selection from state
  loadFromState() {
    if (!state.currentBuild.archeTuning) {
      return;
    }

    const archeTuning = state.currentBuild.archeTuning;
    this.selectedNodes.clear();

    if (archeTuning.selectedNodes && Array.isArray(archeTuning.selectedNodes)) {
      archeTuning.selectedNodes.forEach((node) => {
        if (
          node.position_row !== undefined &&
          node.position_column !== undefined
        ) {
          const nodeKey = `${node.position_row},${node.position_column}`;
          this.selectedNodes.add(nodeKey);
        }
      });
    }
  }
}
