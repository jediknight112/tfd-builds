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
      { row: 0, col: 10 },   // Top
      { row: 10, col: 0 },   // Left
      { row: 10, col: 10 },  // Center
      { row: 10, col: 20 },  // Right
      { row: 20, col: 10 }   // Bottom
    ];
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
        <div id="arche-grid" class="arche-grid"></div>
        <div class="mt-4 text-sm text-steel-grey">
          <div>Selected Nodes: <span id="selected-count" class="text-cyber-cyan">0</span></div>
        </div>
      </div>
    `;

    this.renderGrid();
  }

  renderGrid() {
    const gridContainer = document.getElementById('arche-grid');
    if (!gridContainer) return;

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
          
          // Show X when selected
          nodeDiv.innerHTML = isSelected ? '<span class="node-marker">×</span>' : '';
          
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
