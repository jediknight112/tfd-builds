import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the state module before importing ArcheTuning
vi.mock('../src/state.js', () => ({
  state: {
    archeTuningBoards: [],
    archeTuningNodes: [],
    archeTuningBoardGroups: [],
    descendantGroups: [],
    descendants: [],
    stats: [],
    currentDescendant: null,
    currentBuild: { archeTuning: null },
  },
}));

import { ArcheTuning } from '../src/modules/arche-tuning.js';

describe('ArcheTuning - Pure Logic', () => {
  let tuning;

  beforeEach(() => {
    tuning = new ArcheTuning();
  });

  describe('createGridStructure', () => {
    it('should produce a 21x21 grid', () => {
      const grid = tuning.gridStructure;

      expect(grid).toHaveLength(21);
      grid.forEach((row) => {
        expect(row).toHaveLength(21);
      });
    });

    it('should mark center node (10,10) as visible', () => {
      expect(tuning.gridStructure[10][10]).toBe(true);
    });

    it('should mark all 5 anchor positions as visible', () => {
      const anchors = [
        [0, 10],
        [10, 0],
        [10, 10],
        [10, 20],
        [20, 10],
      ];

      anchors.forEach(([row, col]) => {
        expect(tuning.gridStructure[row][col]).toBe(true);
      });
    });

    it('should mark corner cells as not visible', () => {
      expect(tuning.gridStructure[0][0]).toBe(false);
      expect(tuning.gridStructure[0][20]).toBe(false);
      expect(tuning.gridStructure[20][0]).toBe(false);
      expect(tuning.gridStructure[20][20]).toBe(false);
    });

    it('should have row 10 as the widest row with nodes at columns 0 and 20', () => {
      expect(tuning.gridStructure[10][0]).toBe(true);
      expect(tuning.gridStructure[10][20]).toBe(true);
    });
  });

  describe('isAnchor', () => {
    it('should return true for all 5 anchor positions', () => {
      expect(tuning.isAnchor(0, 10)).toBe(true);
      expect(tuning.isAnchor(10, 0)).toBe(true);
      expect(tuning.isAnchor(10, 10)).toBe(true);
      expect(tuning.isAnchor(10, 20)).toBe(true);
      expect(tuning.isAnchor(20, 10)).toBe(true);
    });

    it('should return false for non-anchor positions', () => {
      expect(tuning.isAnchor(0, 0)).toBe(false);
      expect(tuning.isAnchor(5, 5)).toBe(false);
      expect(tuning.isAnchor(10, 11)).toBe(false);
      expect(tuning.isAnchor(1, 10)).toBe(false);
    });
  });

  describe('isAdjacentToSelected', () => {
    it('should return true when adjacent to center anchor (10,10)', () => {
      // Node at (9,10) is directly above center anchor
      expect(tuning.isAdjacentToSelected(9, 10)).toBe(true);
      // Node at (10,9) is directly left of center anchor
      expect(tuning.isAdjacentToSelected(10, 9)).toBe(true);
      // Node at (11,10) is directly below center anchor
      expect(tuning.isAdjacentToSelected(11, 10)).toBe(true);
      // Node at (10,11) is directly right of center anchor
      expect(tuning.isAdjacentToSelected(10, 11)).toBe(true);
    });

    it('should return false when not adjacent to any selected node or anchor', () => {
      // (0,2) is visible but not adjacent to center or any selection
      expect(tuning.isAdjacentToSelected(0, 2)).toBe(false);
      // (4,4) is visible but not adjacent to center
      expect(tuning.isAdjacentToSelected(4, 4)).toBe(false);
    });

    it('should return true when adjacent to a selected node', () => {
      // Select (9,10) which is adjacent to center
      tuning.selectedNodes.add('9,10');

      // (8,10) is adjacent to (9,10)
      expect(tuning.isAdjacentToSelected(8, 10)).toBe(true);
    });

    it('should return false when diagonal but not orthogonally adjacent', () => {
      tuning.selectedNodes.add('9,10');

      // (8,9) is diagonal to (9,10) -- not adjacent
      expect(tuning.isAdjacentToSelected(8, 9)).toBe(false);
    });
  });

  describe('countSelectedNeighbors', () => {
    it('should count center anchor as a neighbor', () => {
      // (9,10) has center anchor (10,10) as its south neighbor
      const count = tuning.countSelectedNeighbors(9, 10);
      expect(count).toBe(1);
    });

    it('should count multiple selected neighbors correctly', () => {
      // Select nodes around (10,10) -- center anchor
      tuning.selectedNodes.add('9,10'); // above center
      tuning.selectedNodes.add('10,9'); // left of center
      tuning.selectedNodes.add('11,10'); // below center

      // Center (10,10) has 3 selected neighbors + none that are anchors on the other side
      // Actually, center is an anchor itself, not selected. Let's check (10,9):
      // (10,9) neighbors: (9,9)=false vis, (11,9)=false vis, (10,8)=true vis, (10,10)=center anchor
      // Center anchor counts as neighbor, so count = 1 (center anchor)
      const count = tuning.countSelectedNeighbors(10, 9);
      expect(count).toBe(1); // Only center anchor is a neighbor (no other selected nodes are adjacent to 10,9)
    });

    it('should count selected nodes on both sides of a path node', () => {
      tuning.selectedNodes.add('9,10'); // above
      tuning.selectedNodes.add('11,10'); // below

      // (10,10) is center anchor (not selected), but let's check neighbors of (10,10):
      // up=(9,10) selected, down=(11,10) selected, left=(10,9) not selected, right=(10,11) not selected
      const count = tuning.countSelectedNeighbors(10, 10);
      expect(count).toBe(2);
    });

    it('should return 0 for an isolated node with no selected neighbors', () => {
      // (0,2) has no selected neighbors and is not adjacent to center
      const count = tuning.countSelectedNeighbors(0, 2);
      expect(count).toBe(0);
    });
  });

  describe('calculateTotalCost', () => {
    it('should return 0 with no selections', () => {
      expect(tuning.calculateTotalCost()).toBe(0);
    });

    it('should sum costs of selected nodes correctly', () => {
      // Set up node data so getNodeInfo works
      tuning.archeNodeData = [
        {
          node_id: 'n1',
          node_name: 'Node 1',
          required_tuning_point: 2,
        },
        {
          node_id: 'n2',
          node_name: 'Node 2',
          required_tuning_point: 3,
        },
        {
          node_id: 'n3',
          node_name: 'Node 3',
          required_tuning_point: 5,
        },
      ];
      tuning.nodePositionMap = {
        '9,10': 'n1',
        '8,10': 'n2',
        '7,8': 'n3',
      };

      tuning.selectedNodes.add('9,10');
      tuning.selectedNodes.add('8,10');

      expect(tuning.calculateTotalCost()).toBe(5); // 2 + 3
    });

    it('should handle nodes with zero or missing cost', () => {
      tuning.archeNodeData = [
        { node_id: 'n1', node_name: 'Free Node', required_tuning_point: 0 },
      ];
      tuning.nodePositionMap = { '9,10': 'n1' };

      tuning.selectedNodes.add('9,10');

      expect(tuning.calculateTotalCost()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all internal state', () => {
      // Set up some state
      tuning.selectedNodes.add('9,10');
      tuning.selectedNodes.add('8,10');
      tuning.nodePositionMap = { '9,10': 'n1' };
      tuning.currentBoard = { arche_tuning_board_id: 'board1' };
      tuning.metadataLoaded = true;

      tuning.reset();

      expect(tuning.selectedNodes.size).toBe(0);
      expect(tuning.nodePositionMap).toEqual({});
      expect(tuning.currentBoard).toBeNull();
      expect(tuning.metadataLoaded).toBe(false);
    });
  });

  describe('getNodeInfo', () => {
    it('should return node info when node exists in position map', () => {
      tuning.archeNodeData = [{ node_id: 'n1', node_name: 'Test Node' }];
      tuning.nodePositionMap = { '9,10': 'n1' };

      const info = tuning.getNodeInfo(9, 10);

      expect(info).toBeDefined();
      expect(info.node_id).toBe('n1');
      expect(info.node_name).toBe('Test Node');
    });

    it('should return null for positions not in the map', () => {
      tuning.archeNodeData = [];
      tuning.nodePositionMap = {};

      expect(tuning.getNodeInfo(0, 0)).toBeNull();
    });
  });

  describe('getStatName', () => {
    it('should return stat name when found', () => {
      tuning.statData = [{ stat_id: 's1', stat_name: 'Firearm ATK' }];

      expect(tuning.getStatName('s1')).toBe('Firearm ATK');
    });

    it('should return the stat_id when stat is not found', () => {
      tuning.statData = [];

      expect(tuning.getStatName('unknown')).toBe('unknown');
    });

    it('should return stat_id when statData is null', () => {
      tuning.statData = null;

      expect(tuning.getStatName('test')).toBe('test');
    });
  });
});
