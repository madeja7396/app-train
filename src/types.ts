
export interface City {
  id: number;
  name: string;
  x: number;
  y: number;
}

export enum Algorithm {
  HeldKarp = 'Held-Karp (DP)',
  NearestNeighbor = 'Nearest Neighbor',
}

export interface DPTable {
  [subsetKey: string]: {
    [endNode: number]: {
      cost: number;
      path: number[];
    } | null;
  };
}

export interface Step {
  type: 'START' | 'SUBPROBLEM' | 'FINAL' | 'DONE';
  description: string;
  dpTable?: DPTable;
  distanceMatrix?: number[][];
  highlightedDpCell?: { subsetKey: string; endNode: number };
  pathBeingCalculated?: number[];
  subproblemPaths?: { path: number[]; cost: number }[];
  finalPath?: number[];
  finalCost?: number;
}