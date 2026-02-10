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
      { row: 0, col: 10 },   // Top
      { row: 10, col: 0 },   // Left
      { row: 10, col: 10 },  // Center
      { row: 10, col: 20 },  // Right
      { row: 20, col: 10 }   // Bottom
    ];
    
    // Metadata storage
    this.archeBoardData = null;
    this.archeNodeData = null;
    this.statData = null;
    this.nodePositionMap = {}; // Maps "row,col" to node_id
    this.metadataLoaded = false;
  }

  createGridStructure() {
    // Create a 21x21 grid marking which positions have visible nodes
    // Based on the exact template from the Go code (cmd.go lines 332-354)
    const grid = Array(21).fill(null).map(() => Array(21).fill(false));
    
    // Parse each row from the template visualization
    // Each [ ] or [X] represents 3 characters, and 3 spaces = 1 invisible node
    
    // Row 0: "      [ ][ ][ ][ ][ ]         [X]         [ ][ ][ ][ ][ ]"
    [2,3,4,5,6,10,14,15,16,17,18].forEach(c => grid[0][c] = true);
    
    // Row 1: "      [ ]         [ ]   [ ][ ][ ][ ][ ]   [ ]         [ ]"
    [2,6,8,9,10,11,12,14,18].forEach(c => grid[1][c] = true);
    
    // Row 2: "      [ ]   [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]   [ ]"
    [2,4,5,6,7,8,12,13,14,15,16,18].forEach(c => grid[2][c] = true);
    
    // Row 3: "      [ ]   [ ]         [ ]         [ ]         [ ]   [ ]"
    [2,4,8,12,16,18].forEach(c => grid[3][c] = true);
    
    // Row 4: "      [ ][ ][ ]   [ ][ ][ ][ ][ ][ ][ ][ ][ ]   [ ][ ][ ]"
    [2,3,4,6,7,8,9,10,11,12,13,14,16,17,18].forEach(c => grid[4][c] = true);
    
    // Row 5: "            [ ]   [ ]   [ ]         [ ]   [ ]   [ ]"
    [4,6,8,12,14,16].forEach(c => grid[5][c] = true);
    
    // Row 6: "            [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]"
    [4,5,6,7,8,12,13,14,15,16].forEach(c => grid[6][c] = true);
    
    // Row 7: "            [ ]         [ ]         [ ]         [ ]"
    [4,8,12,16].forEach(c => grid[7][c] = true);
    
    // Row 8: "      [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]"
    [2,3,4,5,6,8,9,10,11,12,14,15,16,17,18].forEach(c => grid[8][c] = true);
    
    // Row 9: "      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]"
    [2,4,6,8,10,12,14,16,18].forEach(c => grid[9][c] = true);
    
    // Row 10: "[X][ ][ ]   [ ]   [ ][ ][ ][ ][X][ ][ ][ ][ ]   [ ]   [ ][ ][X]"
    [0,1,2,4,6,7,8,9,10,11,12,13,14,16,18,19,20].forEach(c => grid[10][c] = true);
    
    // Row 11: "      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]"
    [2,4,6,8,10,12,14,16,18].forEach(c => grid[11][c] = true);
    
    // Row 12: "      [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]   [ ][ ][ ][ ][ ]"
    [2,3,4,5,6,8,9,10,11,12,14,15,16,17,18].forEach(c => grid[12][c] = true);
    
    // Row 13: "            [ ]         [ ]         [ ]         [ ]"
    [4,8,12,16].forEach(c => grid[13][c] = true);
    
    // Row 14: "            [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]"
    [4,5,6,7,8,12,13,14,15,16].forEach(c => grid[14][c] = true);
    
    // Row 15: "            [ ]   [ ]   [ ]         [ ]   [ ]   [ ]"
    [4,6,8,12,14,16].forEach(c => grid[15][c] = true);
    
    // Row 16: "      [ ][ ][ ]   [ ][ ][ ][ ][ ][ ][ ][ ][ ]   [ ][ ][ ]"
    [2,3,4,6,7,8,9,10,11,12,13,14,16,17,18].forEach(c => grid[16][c] = true);
    
    // Row 17: "      [ ]   [ ]         [ ]         [ ][ ]      [ ]   [ ]"
    [2,4,8,12,13,16,18].forEach(c => grid[17][c] = true);
    
    // Row 18: "      [ ]   [ ][ ][ ][ ][ ]         [ ][ ][ ][ ][ ]   [ ]"
    [2,4,5,6,7,8,12,13,14,15,16,18].forEach(c => grid[18][c] = true);
    
    // Row 19: "      [ ]         [ ]   [ ][ ][ ][ ][ ]   [ ]         [ ]"
    [2,6,8,9,10,11,12,14,18].forEach(c => grid[19][c] = true);
    
    // Row 20: "      [ ][ ][ ][ ][ ]         [X]         [ ][ ][ ][ ][ ]"
    [2,3,4,5,6,10,14,15,16,17,18].forEach(c => grid[20][c] = true);
    
    return grid;
  }

  loadMetadata() {
    console.log('loadMetadata() called - loading from state');
    
    // Get data from state (already loaded on page init)
    this.archeBoardData = state.archeTuningBoards;
    this.archeNodeData = state.archeTuningNodes;
    this.statData = state.stats;
    
    console.log('Loaded from state:', {
      boards: this.archeBoardData?.length,
      nodes: this.archeNodeData?.length,
      stats: this.statData?.length
    });
    
    // Create position map from the first board (they should all have same structure)
    if (this.archeBoardData && this.archeBoardData.length > 0) {
      const firstBoard = this.archeBoardData[0];
      firstBoard.node.forEach(node => {
        const key = `${node.position_row},${node.position_column}`;
        this.nodePositionMap[key] = node.node_id;
      });
      console.log('Created position map with', Object.keys(this.nodePositionMap).length, 'entries');
    }
    
    console.log('Setting metadataLoaded to true');
    this.metadataLoaded = true;
  }

  getNodeInfo(row, col) {
    const key = `${row},${col}`;
    const nodeId = this.nodePositionMap[key];
    
    if (!nodeId || !this.archeNodeData) {
      return null;
    }
    
    const nodeInfo = this.archeNodeData.find(n => n.node_id === nodeId);
    if (!nodeInfo) {
      console.warn(`Node info not found for position ${key} with node_id ${nodeId}`);
    }
    return nodeInfo;
  }

  getStatName(statId) {
    if (!this.statData) return statId;
    const stat = this.statData.find(s => s.stat_id === statId);
    return stat ? stat.stat_name : statId;
  }

  createNodeTooltip(nodeInfo) {
    if (!nodeInfo) return '';
    
    let tooltip = `
      <div class="arche-tooltip">
        <div class="flex items-center gap-2 mb-2">
          <img src="${nodeInfo.node_image_url}" alt="${nodeInfo.node_name}" class="w-8 h-8" />
          <div>
            <div class="font-bold text-cyber-cyan">${nodeInfo.node_name}</div>
            <div class="text-xs text-steel-grey">${nodeInfo.node_type}${nodeInfo.tier_id !== 'None' ? ` - ${nodeInfo.tier_id}` : ''}</div>
          </div>
        </div>
    `;
    
    if (nodeInfo.required_tuning_point > 0) {
      tooltip += `<div class="text-amber-gold text-sm mb-2">Cost: ${nodeInfo.required_tuning_point} point${nodeInfo.required_tuning_point > 1 ? 's' : ''}</div>`;
    }
    
    if (nodeInfo.node_effect && nodeInfo.node_effect.length > 0) {
      tooltip += '<div class="text-sm">';
      nodeInfo.node_effect.forEach(effect => {
        const statName = this.getStatName(effect.stat_id);
        tooltip += `<div class="text-steel-light">+${effect.stat_value} ${statName}</div>`;
      });
      tooltip += '</div>';
    }
    
    tooltip += '</div>';
    return tooltip;
  }

  isAnchor(row, col) {
    return this.anchorPositions.some(anchor => anchor.row === row && anchor.col === col);
  }

  renderArcheTuningBoard() {
    const container = document.getElementById('arche-tuning');
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-cyber-cyan font-bold">Arche Tuning Board</h4>
          <button 
            class="btn-secondary text-sm"
            onclick="app.archeTuning.clearSelection()"
          >
            Clear Selection
          </button>
        </div>
        <div id="arche-grid" class="arche-grid">
          ${!this.metadataLoaded ? '<div class="text-steel-grey text-center py-8">Loading metadata...</div>' : ''}
        </div>
        <div class="mt-4 text-sm text-steel-grey">
          <div>Selected Nodes: <span id="selected-count" class="text-cyber-cyan">0</span></div>
        </div>
      </div>
    `;

    if (!this.metadataLoaded) {
      console.log('Loading metadata from state...');
      this.loadMetadata();
    }
    
    console.log('Rendering grid immediately...');
    this.renderGrid();
  }

  renderGrid() {
    const gridContainer = document.getElementById('arche-grid');
    if (!gridContainer) {
      console.error('Grid container not found!');
      return;
    }

    console.log('Rendering grid. Metadata loaded:', this.metadataLoaded);
    console.log('Position map entries:', Object.keys(this.nodePositionMap).length);
    console.log('Node data available:', this.archeNodeData?.length);

    gridContainer.innerHTML = '';
    
    let renderedNodes = 0;
    
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
          
          if (nodeInfo) {
            renderedNodes++;
          }
          
          // Always show node image if available
          if (nodeInfo && nodeInfo.node_image_url) {
            const imgEl = document.createElement('img');
            imgEl.src = nodeInfo.node_image_url;
            imgEl.alt = nodeInfo.node_name || '';
            imgEl.className = 'w-full h-full object-contain';
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
    console.log('Grid rendered. Total nodes with info:', renderedNodes);
    
      
      gridContainer.appendChild(rowDiv);
    }
    
    this.updateSelectedCount();
  }

  toggleNode(row, col) {
    const nodeKey = `${row},${col}`;
    
    if (this.selectedNodes.has(nodeKey)) {
      this.selectedNodes.delete(nodeKey);
    } else {
      this.selectedNodes.add(nodeKey);
    }
    
    this.renderGrid();
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.renderGrid();
  }

  updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
      countElement.textContent = this.selectedNodes.size;
    }
  }
}
