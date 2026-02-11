import { state } from '../state.js';
import { API_BASE_URL, LANGUAGE_CODE } from '../config.js';

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
  }

  createGridStructure() {
    // Create a 21x21 grid marking which positions have visible nodes
    // Based on the exact template from the Go code (cmd.go lines 332-354)
    const grid = Array(21)
      .fill(null)
      .map(() => Array(21).fill(false));

    // Parse each row from the template visualization
    // Each [ ] or [X] represents 3 characters, and 3 spaces = 1 invisible node

    // Row 0: "      [ ][ ][ ][ ][ ]         [X]         [ ][ ][ ][ ][ ]"
    [2, 3, 4, 5, 6, 10, 14, 15, 16, 17, 18].forEach((c) => (grid[0][c] = true));

    // Row 1: "      [ ]         [ ]   [ ][ ][ ][ ][ ]   [ ]         [ ]"
    [2, 6, 8, 9, 10, 11, 12, 14, 18].forEach((c) => (grid[1][c] = true));

    // Row 2: "      [ ]   [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]   [ ]"
    [2, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 18].forEach(
      (c) => (grid[2][c] = true)
    );

    // Row 3: "      [ ]   [ ]         [ ]         [ ]         [ ]   [ ]"
    [2, 4, 8, 12, 16, 18].forEach((c) => (grid[3][c] = true));

    // Row 4: "      [ ][ ][ ]   [ ][ ][ ][ ][ ][ ][ ][ ][ ]   [ ][ ][ ]"
    [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18].forEach(
      (c) => (grid[4][c] = true)
    );

    // Row 5: "            [ ]   [ ]   [ ]         [ ]   [ ]   [ ]"
    [4, 6, 8, 12, 14, 16].forEach((c) => (grid[5][c] = true));

    // Row 6: "            [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]"
    [4, 5, 6, 7, 8, 12, 13, 14, 15, 16].forEach((c) => (grid[6][c] = true));

    // Row 7: "            [ ]         [ ]         [ ]         [ ]"
    [4, 8, 12, 16].forEach((c) => (grid[7][c] = true));

    // Row 8: "      [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]"
    [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18].forEach(
      (c) => (grid[8][c] = true)
    );

    // Row 9: "      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]"
    [2, 4, 6, 8, 10, 12, 14, 16, 18].forEach((c) => (grid[9][c] = true));

    // Row 10: "[X][ ][ ]   [ ]   [ ][ ][ ][ ][X][ ][ ][ ][ ]   [ ]   [ ][ ][X]"
    [0, 1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 19, 20].forEach(
      (c) => (grid[10][c] = true)
    );

    // Row 11: "      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]"
    [2, 4, 6, 8, 10, 12, 14, 16, 18].forEach((c) => (grid[11][c] = true));

    // Row 12: "      [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]"
    [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18].forEach(
      (c) => (grid[12][c] = true)
    );

    // Row 13: "            [ ]         [ ]         [ ]         [ ]"
    [4, 8, 12, 16].forEach((c) => (grid[13][c] = true));

    // Row 14: "            [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]"
    [4, 5, 6, 7, 8, 12, 13, 14, 15, 16].forEach((c) => (grid[14][c] = true));

    // Row 15: "            [ ]   [ ]   [ ]         [ ]   [ ]   [ ]"
    [4, 6, 8, 12, 14, 16].forEach((c) => (grid[15][c] = true));

    // Row 16: "      [ ][ ][ ]   [ ][ ][ ][ ][ ][ ][ ][ ][ ]   [ ][ ][ ]"
    [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18].forEach(
      (c) => (grid[16][c] = true)
    );

    // Row 17: "      [ ]   [ ]         [ ]         [ ][ ]      [ ]   [ ]"
    [2, 4, 8, 12, 13, 16, 18].forEach((c) => (grid[17][c] = true));

    // Row 18: "      [ ]   [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]   [ ]"
    [2, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 18].forEach(
      (c) => (grid[18][c] = true)
    );

    // Row 19: "      [ ]         [ ]   [ ][ ][ ][ ][ ]   [ ]         [ ]"
    [2, 6, 8, 9, 10, 11, 12, 14, 18].forEach((c) => (grid[19][c] = true));

    // Row 20: "      [ ][ ][ ][ ][ ]         [X]         [ ][ ][ ][ ][ ]"
    [2, 3, 4, 5, 6, 10, 14, 15, 16, 17, 18].forEach(
      (c) => (grid[20][c] = true)
    );

    return grid;
  }

  loadMetadata() {
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
      // Get the descendant_id from current descendant
      const descendantId = state.currentDescendant.descendant_id;

      // Find the descendant group by looking up the descendant
      const descendant = state.descendants.find(
        (d) => d.descendant_id === descendantId
      );
      const descendantGroupId = descendant?.descendant_group_id;

      if (descendantGroupId) {
        // Find the board group that matches this descendant group
        const boardGroup = state.archeTuningBoardGroups.find(
          (bg) => bg.descendant_group_id === descendantGroupId
        );
        const archeBoardId = boardGroup?.arche_tuning_board_id;

        if (archeBoardId) {
          // Find the actual board with this ID
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

    // Store the board for later use
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

    // Map tier IDs to display names
    const tierNames = {
      Tier1: 'Normal',
      Tier2: 'Rare',
      Tier3: 'Ultimate',
    };
    const tierDisplay = tierNames[nodeInfo.tier_id] || nodeInfo.tier_id;

    let tooltip = `
      <div class="arche-tooltip">
        <div class="flex items-center gap-2 mb-1 sm:mb-2">
          <img src="${nodeInfo.node_image_url}" alt="${nodeInfo.node_name}" class="flex-shrink-0" loading="lazy" />
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
    // Check if this node is adjacent (horizontally or vertically) to any selected node
    // Also returns true if adjacent to the center anchor (starting point)
    
    // Check all 4 adjacent positions (up, down, left, right)
    const adjacentPositions = [
      { row: row - 1, col }, // Up
      { row: row + 1, col }, // Down
      { row, col: col - 1 }, // Left
      { row, col: col + 1 }, // Right
    ];

    for (const pos of adjacentPositions) {
      // Check if position is in bounds and is a visible node
      if (
        pos.row >= 0 &&
        pos.row < this.gridSize &&
        pos.col >= 0 &&
        pos.col < this.gridSize &&
        this.gridStructure[pos.row][pos.col]
      ) {
        const posKey = `${pos.row},${pos.col}`;

        // Check if this adjacent position is selected or is the center anchor (10, 10)
        const isCenterAnchor = pos.row === 10 && pos.col === 10;
        if (this.selectedNodes.has(posKey) || isCenterAnchor) {
          return true;
        }
      }
    }

    return false;
  }

  countSelectedNeighbors(row, col) {
    // Count how many adjacent nodes are selected or are the center anchor node
    let count = 0;

    const adjacentPositions = [
      { row: row - 1, col }, // Up
      { row: row + 1, col }, // Down
      { row, col: col - 1 }, // Left
      { row, col: col + 1 }, // Right
    ];

    for (const pos of adjacentPositions) {
      // Check if position is in bounds and is a visible node
      if (
        pos.row >= 0 &&
        pos.row < this.gridSize &&
        pos.col >= 0 &&
        pos.col < this.gridSize &&
        this.gridStructure[pos.row][pos.col]
      ) {
        const posKey = `${pos.row},${pos.col}`;
        
        // Count if this adjacent position is selected OR is the center anchor (10, 10)
        const isCenterAnchor = pos.row === 10 && pos.col === 10;
        if (this.selectedNodes.has(posKey) || isCenterAnchor) {
          count++;
        }
      }
    }

    return count;
  }

  renderArcheTuningBoard() {
    const container = document.getElementById('arche-tuning');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
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
        <div class="arche-scroll-container">
          <div id="arche-grid" class="arche-grid">
            ${!this.metadataLoaded ? '<div class="text-steel-grey text-center py-8">Loading metadata...</div>' : ''}
          </div>
        </div>
      </div>
    `;

    if (!this.metadataLoaded) {
      this.loadMetadata();
    }

    // Load any existing selection from state (must be after metadata load)
    this.loadFromState();

    this.renderGrid();
  }

  renderGrid() {
    const gridContainer = document.getElementById('arche-grid');
    if (!gridContainer) {
      console.error('Arche Tuning: Grid container not found');
      return;
    }

    gridContainer.innerHTML = '';

    // Create grid
    for (let row = 0; row < this.gridSize; row++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'arche-row';

      for (let col = 0; col < this.gridSize; col++) {
        const isVisible = this.gridStructure[row][col];
        const isAnchor = this.isAnchor(row, col);
        const nodeKey = `${row},${col}`;
        const isSelected = this.selectedNodes.has(nodeKey);

        if (isVisible) {
          const nodeDiv = document.createElement('div');
          nodeDiv.className = 'arche-node';

          if (isAnchor) {
            nodeDiv.classList.add('anchor');
          }

          if (isSelected) {
            nodeDiv.classList.add('selected');
          }

          nodeDiv.dataset.row = row;
          nodeDiv.dataset.col = col;

          // Get node info to show image
          const nodeInfo = this.getNodeInfo(row, col);

          // Add tier-based class for border color
          if (nodeInfo) {
            if (nodeInfo.tier_id === 'Tier1') {
              nodeDiv.classList.add('tier-normal');
            } else if (nodeInfo.tier_id === 'Tier2') {
              nodeDiv.classList.add('tier-rare');
            } else if (nodeInfo.tier_id === 'Tier3') {
              nodeDiv.classList.add('tier-ultimate');
            }

            // Mutant Cells (Hole type) get ultimate tier color
            if (nodeInfo.node_type === 'Hole') {
              nodeDiv.classList.add('tier-ultimate');
            }
          }

          // Always show node image if available
          if (nodeInfo && nodeInfo.node_image_url) {
            const imgEl = document.createElement('img');
            imgEl.src = nodeInfo.node_image_url;
            imgEl.alt = nodeInfo.node_name || '';
            imgEl.className = 'w-full h-full object-contain';
            imgEl.loading = 'lazy';
            nodeDiv.appendChild(imgEl);
          }

          // Add tooltip
          if (nodeInfo) {
            nodeDiv.dataset.tooltip = 'true';

            // Create tooltip element
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'arche-node-tooltip';
            tooltipDiv.innerHTML = this.createNodeTooltip(nodeInfo);
            nodeDiv.appendChild(tooltipDiv);
          }

          nodeDiv.addEventListener('click', () => this.toggleNode(row, col));

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

    this.updateSelectedCount();
  }

  toggleNode(row, col) {
    const nodeKey = `${row},${col}`;

    if (this.selectedNodes.has(nodeKey)) {
      // Deselecting - only allowed if node is at the end of a trail
      // Count how many selected neighbors this node has
      const selectedNeighbors = this.countSelectedNeighbors(row, col);
      
      // Only allow deselection if the node has 1 or fewer selected neighbors
      // (meaning it's at the end of the trail)
      if (selectedNeighbors <= 1) {
        this.selectedNodes.delete(nodeKey);
      } else {
        return; // Don't re-render if deselection was blocked
      }
    } else {
      // Selecting - check adjacency first
      if (!this.isAdjacentToSelected(row, col)) {
        return; // Don't re-render if selection was blocked
      }

      // Check if it would exceed cost limit
      const nodeInfo = this.getNodeInfo(row, col);
      const nodeCost = nodeInfo?.required_tuning_point || 0;
      const currentCost = this.calculateTotalCost();

      if (currentCost + nodeCost <= 40) {
        this.selectedNodes.add(nodeKey);
      } else {
        return; // Don't re-render if selection was blocked
      }
    }

    this.saveToState();
    this.renderGrid();
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.saveToState();
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

      // Change color to indicate if at/near limit
      if (totalCost >= 40) {
        countElement.className = 'text-amber-gold';
      } else if (totalCost >= 35) {
        countElement.className = 'text-yellow-400';
      } else {
        countElement.className = 'text-cyber-cyan';
      }
    }
  }

  // Save current selection to state
  saveToState() {
    // Ensure metadata is loaded
    if (!this.metadataLoaded) {
      this.loadMetadata();
    }

    if (!this.currentBoard) {
      return;
    }

    // Convert selected nodes Set to array of node objects with position info
    const selectedNodes = [];
    this.selectedNodes.forEach((nodeKey) => {
      const [row, col] = nodeKey.split(',').map(Number);
      const nodeInfo = this.getNodeInfo(row, col);
      if (nodeInfo) {
        // Store node with position information
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

    // Clear current selection
    this.selectedNodes.clear();

    // Restore selected nodes
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
