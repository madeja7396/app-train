
import { City, Step, DPTable } from '../types';

const calculateDistance = (city1: City, city2: City): number => {
  return Math.sqrt(Math.pow(city1.x - city2.x, 2) + Math.pow(city1.y - city2.y, 2));
};

const getDistanceMatrix = (cities: City[]): number[][] => {
  const n = cities.length;
  const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const dist = calculateDistance(cities[i], cities[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }
  return matrix;
};

const formatSubset = (mask: number, cities: City[]): string => {
  const subset = [];
  for (let i = 0; i < cities.length; i++) {
    if ((mask >> i) & 1) {
      subset.push(cities[i].name);
    }
  }
  return `{${subset.join(',')}}`;
};


export const generateHeldKarpSteps = (cities: City[]): Step[] => {
  const n = cities.length;
  if (n === 0) return [];
  if (n > 12) {
      return [{
          type: 'DONE',
          description: `Error: Dynamic Programming is too slow for ${n} cities. Please use 12 or fewer cities.`,
      }];
  }

  const steps: Step[] = [];
  const dist = getDistanceMatrix(cities);
  const dp: DPTable = {};
  const startNode = 0;
  
  steps.push({
      type: 'START',
      description: `Initializing algorithm for ${n} cities. Start node is A. Calculating distance matrix.`,
      distanceMatrix: dist,
      dpTable: {},
  });

  // Base case: subset size 2 (start -> i)
  const baseMask = 1 << startNode;
  for (let i = 1; i < n; i++) {
    const currentMask = baseMask | (1 << i);
    const subsetKey = formatSubset(currentMask, cities);
    if (!dp[subsetKey]) dp[subsetKey] = {};
    dp[subsetKey][i] = { cost: dist[startNode][i], path: [startNode, i] };
    
    steps.push({
        type: 'SUBPROBLEM',
        description: `Base case (size 2): Cost from A to ${cities[i].name} is ${dist[startNode][i].toFixed(2)}.`,
        dpTable: JSON.parse(JSON.stringify(dp)),
        distanceMatrix: dist,
        pathBeingCalculated: [startNode, i],
        highlightedDpCell: { subsetKey, endNode: i },
    });
  }

  // DP for subsets of size 3 to n
  for (let size = 3; size <= n; size++) {
    for (let subsetMask = 1; subsetMask < (1 << n); subsetMask++) {
      // Ensure startNode is in subset and subset is of the correct size
      if (!((subsetMask >> startNode) & 1) || (subsetMask.toString(2).match(/1/g) || []).length !== size) {
        continue;
      }

      const subsetKey = formatSubset(subsetMask, cities);
      if (!dp[subsetKey]) dp[subsetKey] = {};

      for (let j = 1; j < n; j++) {
        if (!((subsetMask >> j) & 1)) continue; // j must be in the subset

        const prevMask = subsetMask ^ (1 << j);
        const prevSubsetKey = formatSubset(prevMask, cities);
        let minCost = Infinity;
        let bestPath: number[] = [];

        for (let k = 0; k < n; k++) {
          // k must be in previous subset, and k != j
          if (k === j || !((prevMask >> k) & 1)) continue;

          if (dp[prevSubsetKey]?.[k]) {
            const currentCost = (dp[prevSubsetKey][k]?.cost ?? 0) + dist[k][j];
            steps.push({
                type: 'SUBPROBLEM',
                description: `Calculating cost for {..., ${cities[k].name}} -> ${cities[j].name}. Cost = ${dp[prevSubsetKey][k]?.cost.toFixed(2)} + d(${cities[k].name},${cities[j].name}) = ${currentCost.toFixed(2)}`,
                dpTable: JSON.parse(JSON.stringify(dp)),
                distanceMatrix: dist,
                pathBeingCalculated: [...(dp[prevSubsetKey][k]?.path ?? []), j],
                highlightedDpCell: { subsetKey, endNode: j },
            });
            if (currentCost < minCost) {
              minCost = currentCost;
              bestPath = [...(dp[prevSubsetKey][k]?.path ?? []), j];
            }
          }
        }
        
        if (minCost !== Infinity) {
          dp[subsetKey][j] = { cost: minCost, path: bestPath };
          steps.push({
              type: 'SUBPROBLEM',
              description: `Minimum cost for subset ${subsetKey} ending at ${cities[j].name} is ${minCost.toFixed(2)}. Path: ${bestPath.map(p => cities[p].name).join('->')}`,
              dpTable: JSON.parse(JSON.stringify(dp)),
              distanceMatrix: dist,
              pathBeingCalculated: bestPath,
              highlightedDpCell: { subsetKey, endNode: j },
          });
        }
      }
    }
  }

  // Final step: find the minimum cost to return to start
  let minTourCost = Infinity;
  let finalPath: number[] = [];
  const finalMask = (1 << n) - 1;
  const finalSubsetKey = formatSubset(finalMask, cities);

  for (let i = 1; i < n; i++) {
    if (dp[finalSubsetKey]?.[i]) {
      const tourCost = (dp[finalSubsetKey][i]?.cost ?? 0) + dist[i][startNode];
      steps.push({
          type: 'FINAL',
          description: `Calculating final tour cost through ${cities[i].name}: ${dp[finalSubsetKey][i]?.cost.toFixed(2)} + d(${cities[i].name},A) = ${tourCost.toFixed(2)}`,
          dpTable: JSON.parse(JSON.stringify(dp)),
          distanceMatrix: dist,
          pathBeingCalculated: [...(dp[finalSubsetKey][i]?.path ?? []), startNode],
      });
      if (tourCost < minTourCost) {
        minTourCost = tourCost;
        finalPath = [...(dp[finalSubsetKey][i]?.path ?? []), startNode];
      }
    }
  }

  steps.push({
    type: 'DONE',
    description: `Optimal tour found! Total cost: ${minTourCost.toFixed(2)}. Path: ${finalPath.map(p => cities[p].name).join(' -> ')}`,
    dpTable: JSON.parse(JSON.stringify(dp)),
    distanceMatrix: dist,
    finalPath: finalPath,
    finalCost: minTourCost,
  });

  return steps;
};

export const generateNearestNeighborSteps = (cities: City[]): Step[] => {
  const n = cities.length;
  if (n === 0) return [];

  const steps: Step[] = [];
  const dist = getDistanceMatrix(cities);
  let unvisited = new Set(cities.map(c => c.id));
  let currentCityId = 0; // Start at city 'A'
  let tour = [currentCityId];
  let totalCost = 0;
  unvisited.delete(currentCityId);
  
  steps.push({
      type: 'START',
      description: `Initializing Nearest Neighbor algorithm starting from city A.`,
      distanceMatrix: dist,
  });

  while (unvisited.size > 0) {
    let nearestCityId = -1;
    let minDistance = Infinity;

    unvisited.forEach(cityId => {
      const distance = dist[currentCityId][cityId];
       steps.push({
          type: 'SUBPROBLEM',
          description: `Checking distance from ${cities[currentCityId].name} to ${cities[cityId].name}: ${distance.toFixed(2)}`,
          distanceMatrix: dist,
          pathBeingCalculated: [currentCityId, cityId],
          finalPath: [...tour],
       });
      if (distance < minDistance) {
        minDistance = distance;
        nearestCityId = cityId;
      }
    });

    if (nearestCityId !== -1) {
      totalCost += minDistance;
      currentCityId = nearestCityId;
      tour.push(currentCityId);
      unvisited.delete(currentCityId);
      steps.push({
          type: 'SUBPROBLEM',
          description: `Moving to nearest city: ${cities[currentCityId].name}. Current cost: ${totalCost.toFixed(2)}`,
          distanceMatrix: dist,
          finalPath: [...tour],
          finalCost: totalCost,
       });
    }
  }

  // Return to start
  totalCost += dist[currentCityId][0];
  tour.push(0);
  
  steps.push({
    type: 'DONE',
    description: `Tour complete! Total cost: ${totalCost.toFixed(2)}. Path: ${tour.map(id => cities[id].name).join(' -> ')}`,
    distanceMatrix: dist,
    finalPath: tour,
    finalCost: totalCost,
  });

  return steps;
};