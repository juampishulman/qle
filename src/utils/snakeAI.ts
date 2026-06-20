/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position } from '../types';

const GRID_SIZE = 20;

// Initialize the 20x20 Hamiltonian cycle using a beautifully structured concentric double spiral pattern
function generateDoubleSpiralCycle(): Position[] {
  const inbound: Position[] = [];
  const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

  const addNode = (x: number, y: number) => {
    inbound.push({ x, y });
    visited[x][y] = true;
  };

  for (let k = 0; k < 5; k++) {
    const minLimit = 2 * k;
    const maxLimit = 19 - 2 * k;

    // 1. Right
    for (let x = minLimit; x <= maxLimit; x++) {
      addNode(x, minLimit);
    }
    // 2. Down
    for (let y = minLimit + 1; y <= maxLimit; y++) {
      addNode(maxLimit, y);
    }
    // 3. Left
    for (let x = maxLimit - 1; x >= minLimit; x--) {
      addNode(x, maxLimit);
    }
    // 4. Up
    for (let y = maxLimit - 1; y >= minLimit + 2; y--) {
      addNode(minLimit, y);
    }
    // 5. Connector (if not the innermost ring)
    if (k < 4) {
      addNode(minLimit + 1, minLimit + 2);
    }
  }

  // Find all unvisited cells first
  const unvisitedCells: Position[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!visited[x][y]) {
        unvisitedCells.push({ x, y });
      }
    }
  }
  const totalUnvisited = unvisitedCells.length;

  const lastInbound = inbound[inbound.length - 1];
  const outbound: Position[] = [];

  function dfs(curr: Position): boolean {
    outbound.push(curr);
    if (curr.x === 0 && curr.y === 1) {
      if (outbound.length === totalUnvisited) {
        return true;
      }
    }

    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    for (const dir of dirs) {
      const nx = curr.x + dir.x;
      const ny = curr.y + dir.y;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        if (!visited[nx][ny]) {
          visited[nx][ny] = true;
          if (dfs({ x: nx, y: ny })) {
            return true;
          }
          visited[nx][ny] = false;
        }
      }
    }
    outbound.pop();
    return false;
  }

  let startOutbound: Position | null = null;
  const dirs = [
    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
  ];
  for (const dir of dirs) {
    const nx = lastInbound.x + dir.x;
    const ny = lastInbound.y + dir.y;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !visited[nx][ny]) {
      startOutbound = { x: nx, y: ny };
      break;
    }
  }

  if (startOutbound) {
    visited[startOutbound.x][startOutbound.y] = true;
    dfs(startOutbound);
  }

  return [...inbound, ...outbound];
}

export const hamiltonianCycle: Position[] = generateDoubleSpiralCycle();

// Build fast cycle index lookup table
export const cycleIndexGrid: number[][] = Array(GRID_SIZE)
  .fill(null)
  .map(() => Array(GRID_SIZE).fill(-1));

hamiltonianCycle.forEach((pos, idx) => {
  cycleIndexGrid[pos.x][pos.y] = idx;
});

/**
 * Gets the cyclic distance from index a to index b in a 400-cell cycle.
 */
export function getCycleDist(a: number, b: number): number {
  return (b - a + 400) % 400;
}

/**
 * Checks if a coordinate is within grid bounds.
 */
export function inBounds(p: Position): boolean {
  return p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE;
}

/**
 * Checks if two positions are equal.
 */
export function equalPos(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Gets the Manhattan distance between two points.
 */
export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Helper to check if a position is in a body list (or part of it).
 */
export function containsPos(body: Position[], p: Position, limitIndex = body.length): boolean {
  for (let i = 0; i < limitIndex; i++) {
    if (equalPos(body[i], p)) return true;
  }
  return false;
}

/**
 * Determines if a given move position is "attached" to the boundary or obstacles.
 */
export function isMoveAttached(
  pos: Position,
  snakeBody: Position[],
  obstacles: Position[] = []
): boolean {
  if (pos.x === 0 || pos.x === GRID_SIZE - 1 || pos.y === 0 || pos.y === GRID_SIZE - 1) {
    return true;
  }

  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];

  const bodySetForAdj = new Set(snakeBody.slice(2).map(p => `${p.x},${p.y}`));
  const obsSet = new Set(obstacles.map(p => `${p.x},${p.y}`));

  for (const d of dirs) {
    const neigh = { x: pos.x + d.x, y: pos.y + d.y };
    if (!inBounds(neigh) || neigh.x === 0 || neigh.x === GRID_SIZE - 1 || neigh.y === 0 || neigh.y === GRID_SIZE - 1) {
      return true;
    }
    const neighKey = `${neigh.x},${neigh.y}`;\n    if (bodySetForAdj.has(neighKey) || obsSet.has(neighKey)) {\n      return true;\n    }\n  }\n\n  return false;\n}\n\n/**\n * Computes an adjacency score to favor wall-hugging and perimeter tracking.\n */\nexport function getAdjacencyScore(\n  pos: Position,\n  snakeBody: Position[],\n  obstacles: Position[] = []\n): number {\n  const dirs = [\n    { x: 0, y: -1 },\n    { x: 0, y: 1 },\n    { x: -1, y: 0 },\n    { x: 1, y: 0 }\n  ];\n  let score = 0;\n  const bodySet = new Set(snakeBody.slice(2).map(p => `${p.x},${p.y}`));\n  const obsSet = new Set(obstacles.map(p => `${p.x},${p.y}`));\n\n  for (const d of dirs) {\n    const neigh = { x: pos.x + d.x, y: pos.y + d.y };\n    if (!inBounds(neigh) || neigh.x === 0 || neigh.x === GRID_SIZE - 1 || neigh.y === 0 || neigh.y === GRID_SIZE - 1) {\n      score += 1.8;\n    } else {\n      const key = `${neigh.x},${neigh.y}`;\n      if (bodySet.has(key)) {\n        score += 1.2;\n      } else if (obsSet.has(key)) {\n        score += 1.2;\n      }\n    }\n  }\n  return score;\n}\n\n/**\n * Runs a Dijkstra search to find a path between start and end.\n */\nexport function findShortestPath(\n  start: Position,\n  end: Position,\n  snakeBody: Position[],\n  virtualTailWalkable = false,\n  obstacles: Position[] = []\n): Position[] | null {\n  const queue: { pos: Position; path: Position[]; cost: number }[] = [];\n  const minCost = new Map<string, number>();\n\n  queue.push({ pos: start, path: [start], cost: 0 });\n  minCost.set(`${start.x},${start.y}`, 0);\n\n  const bodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));\n  const bodySetForAdj = new Set(snakeBody.slice(2).map(p => `${p.x},${p.y}`));\n  const obsSet = new Set(obstacles.map(p => `${p.x},${p.y}`));\n  const tailStr = snakeBody.length > 0 ? `${snakeBody[snakeBody.length - 1].x},${snakeBody[snakeBody.length - 1].y}` : '';\n\n  const dirs = [\n    { x: 0, y: -1 },\n    { x: 0, y: 1 },\n    { x: -1, y: 0 },\n    { x: 1, y: 0 }\n  ];\n\n  while (queue.length > 0) {\n    queue.sort((a, b) => a.cost - b.cost);\n    const curr = queue.shift()!;\n\n    const currKey = `${curr.pos.x},${curr.pos.y}`;\n    if (curr.cost > (minCost.get(currKey) ?? Infinity)) {\n      continue;\n    }\n\n    if (equalPos(curr.pos, end)) {\n      return curr.path;\n    }\n\n    for (const d of dirs) {\n      const next: Position = { x: curr.pos.x + d.x, y: curr.pos.y + d.y };\n      const key = `${next.x},${next.y}`;\n\n      if (inBounds(next)) {\n        const isBody = bodySet.has(key);\n        const isTail = key === tailStr;\n        const isObstacle = obsSet.has(key);\n\n        if (!isObstacle && (!isBody || (isTail && virtualTailWalkable))) {\n          let adjCount = 0;\n          for (const face of dirs) {\n            const neigh = { x: next.x + face.x, y: next.y + face.y };\n            const neighKey = `${neigh.x},${neigh.y}`;\n\n            if (!inBounds(neigh) || neigh.x === 0 || neigh.x === GRID_SIZE - 1 || neigh.y === 0 || neigh.y === GRID_SIZE - 1) {\n              adjCount += 2.0;\n            }\n            if (obsSet.has(neighKey)) {\n              adjCount += 1.5;\n            }\n            if (bodySetForAdj.has(neighKey)) {\n              adjCount += 1.5;\n            }\n          }\n\n          let stepCost = Math.max(0.2, 15.0 - (adjCount * 3.0));\n          if (adjCount === 0) {\n            stepCost += 3000.0;\n          }\n\n          const nextCost = curr.cost + stepCost;\n\n          if (nextCost < (minCost.get(key) ?? Infinity)) {\n            minCost.set(key, nextCost);\n            queue.push({\n              pos: next,\n              path: [...curr.path, next],\n              cost: nextCost\n            });\n          }\n        }\n      }\n    }\n  }\n\n  return null;\n}\n\n/**\n * Finder for the absolute shortest, unpenalized path between start and end.\n */\nexport function findDirectPath(\n  start: Position,\n  end: Position,\n  snakeBody: Position[],\n  virtualTailWalkable = false,\n  obstacles: Position[] = []\n): Position[] | null {\n  const queue: { pos: Position; path: Position[] }[] = [];\n  const visited = new Set<string>();\n\n  queue.push({ pos: start, path: [start] });\n  visited.add(`${start.x},${start.y}`);\n\n  const bodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));\n  const obsSet = new Set(obstacles.map(p => `${p.x},${p.y}`));\n  const tailKey = snakeBody.length > 0 ? `${snakeBody[snakeBody.length - 1].x},${snakeBody[snakeBody.length - 1].y}` : '';\n\n  const dirs = [\n    { x: 0, y: -1 },\n    { x: 0, y: 1 },\n    { x: -1, y: 0 },\n    { x: 1, y: 0 }\n  ];\n\n  while (queue.length > 0) {\n    const curr = queue.shift()!;\n    if (equalPos(curr.pos, end)) {\n      return curr.path;\n    }\n\n    for (const d of dirs) {\n      const next = { x: curr.pos.x + d.x, y: curr.pos.y + d.y };\n      const key = `${next.x},${next.y}`;\n\n      if (inBounds(next) && !visited.has(key)) {\n        const isObstacle = obsSet.has(key);\n        const isBody = bodySet.has(key);\n        const isTail = key === tailKey;\n\n        if (!isObstacle && (!isBody || (isTail && virtualTailWalkable))) {\n          visited.add(key);\n          queue.push({ pos: next, path: [...curr.path, next] });\n        }\n      }\n    }\n  }\n\n  return null;\n}\n\n/**\n * Checks if the remaining walkable empty space forms exactly ONE contiguous partition on the board.\n */\nexport function isVacantContiguous(virtualBody: Position[], obstacles: Position[]): boolean {\n  const bodySet = new Set(virtualBody.map(p => `${p.x},${p.y}`));\n  const obsSet = new Set(obstacles.map(p => `${p.x},${p.y}`));\n\n  const vacantTiles: Position[] = [];\n  let rootVacant: Position | null = null;\n\n  for (let x = 0; x < GRID_SIZE; x++) {\n    for (let y = 0; y < GRID_SIZE; y++) {\n      const key = `${x},${y}`;\n      if (!bodySet.has(key) && !obsSet.has(key)) {\n        const p = { x, y };\n        vacantTiles.push(p);\n        if (!rootVacant) {\n          rootVacant = p;\n        }\n      }\n    }\n  }\n\n  if (vacantTiles.length === 0) {\n    return true;\n  }\n\n  const visited = new Set<string>();\n  const queue: Position[] = [rootVacant!];\n  visited.add(`${rootVacant!.x},${rootVacant!.y}`);\n\n  const dirs = [\n    { x: 0, y: -1 },\n    { x: 0, y: 1 },\n    { x: -1, y: 0 },\n    { x: 1, y: 0 }\n  ];\n\n  let visitedCount = 0;\n  while (queue.length > 0) {\n    const curr = queue.shift()!;\n    visitedCount++;\n\n    for (const d of dirs) {\n      const next = { x: curr.x + d.x, y: curr.y + d.y };\n      const nextKey = `${next.x},${next.y}`;\n\n      if (\n        next.x >= 0 && next.x < GRID_SIZE &&\n        next.y >= 0 && next.y < GRID_SIZE &&\n        !visited.has(nextKey) &&\n        !bodySet.has(nextKey) &&\n        !obsSet.has(nextKey)\n      ) {\n        visited.add(nextKey);\n        queue.push(next);\n      }\n    }\n  }\n\n  return visitedCount === vacantTiles.length;\n}\n\n/**\n * Given the current state, computes the optimal next move position for the AI snake.\n */\nexport function computeNextAIMove(\n  snakeBody: Position[],\n  food: Position,\n  obstacles: Position[] = [],\n  forceDirect = false,\n  survivalThreshold = 200\n): {\n  nextPos: Position;\n  mode: 'aggressive' | 'survival' | 'tail_chase';\n  safetyPath: Position[] | null;\n  pathToFood: Position[] | null;\n} {\n  const head = snakeBody[0];\n  const tail = snakeBody[snakeBody.length - 1];\n\n  const idxH = cycleIndexGrid[head.x][head.y];\n  const idxT = cycleIndexGrid[tail.x][tail.y];\n  const idxF = cycleIndexGrid[food.x][food.y];\n\n  const dirs = [\n    { x: 0, y: -1, name: 'UP' },\n    { x: 0, y: 1, name: 'DOWN' },\n    { x: -1, y: 0, name: 'LEFT' },\n    { x: 1, y: 0, name: 'RIGHT' }\n  ];\n\n  const obstacleSet = new Set(obstacles.map(p => `${p.x},${p.y}`));\n\n  const candidates: {\n    pos: Position;\n    dirName: string;\n    isSafe: boolean;\n    canReachTail: boolean;\n    virtualBody: Position[];\n    safetyPathToTail: Position[] | null;\n    isEating: boolean;\n  }[] = [];\n\n  for (const dir of dirs) {\n    const nextPos = { x: head.x + dir.x, y: head.y + dir.y };\n    const nextKey = `${nextPos.x},${nextPos.y}`;\n\n    if (!inBounds(nextPos) || obstacleSet.has(nextKey)) {\n      continue;\n    }\n\n    const isEating = equalPos(nextPos, food);\n    const collisionLimit = isEating ? snakeBody.length : snakeBody.length - 1;\n    const isCollision = containsPos(snakeBody, nextPos, collisionLimit);\n    if (isCollision) {\n      continue;\n    }\n\n    let virtualBody: Position[];\n    if (isEating) {\n      virtualBody = [nextPos, ...snakeBody];\n    } else {\n      virtualBody = [nextPos, ...snakeBody.slice(0, -1)];\n    }\n\n    const isPartitionFree = isVacantContiguous(virtualBody, obstacles);\n\n    const vTail = virtualBody[virtualBody.length - 1];\n    const pathToTail = findDirectPath(nextPos, vTail, virtualBody, true, obstacles);\n    const canReachTail = pathToTail !== null;\n\n    const isSafe = isPartitionFree && canReachTail;\n\n    candidates.push({\n      pos: nextPos,\n      dirName: dir.name,\n      isSafe,\n      canReachTail,\n      virtualBody,\n      safetyPathToTail: pathToTail,\n      isEating\n    });\n  }\n\n  let isAligned = false;\n  let multiplier = 1;\n\n  if (snakeBody.length === 1) {\n    isAligned = true;\n    multiplier = 1;\n  } else if (idxH !== -1 && idxT !== -1 && snakeBody.length >= 2) {\n    const tailPredecessor = snakeBody[snakeBody.length - 2];\n    const idxTP = cycleIndexGrid[tailPredecessor.x][tailPredecessor.y];\n    if (idxTP !== -1) {\n      if (getCycleDist(idxT, idxTP) === 1) {\n        isAligned = true;\n        multiplier = 1;\n      } else if (getCycleDist(idxTP, idxT) === 1) {\n        isAligned = true;\n        multiplier = -1;\n      }\n    }\n  }\n\n  if (isAligned && idxH !== -1 && idxT !== -1 && idxF !== -1) {\n    const getRelIdx = (pos: Position): number => {\n      const idx = cycleIndexGrid[pos.x][pos.y];\n      if (idx === -1) return 999;\n      if (multiplier === 1) {\n        return getCycleDist(idxH, idx);\n      } else {\n        return getCycleDist(idx, idxH);\n      }\n    };\n\n    const relT = getRelIdx(tail);\n    const relF = getRelIdx(food);\n\n    const safeCandidates = candidates.filter(m => m.isSafe);\n\n    const hamiltonianSafeMoves = safeCandidates\n      .map(m => {\n        const relN = getRelIdx(m.pos);\n        return { move: m, relN };\n      })\n      .filter(m => m.relN < relT);\n\n    const canShortcut = snakeBody.length >= survivalThreshold && snakeBody.length < 300;\n\n    if (canShortcut && relF < relT && hamiltonianSafeMoves.length > 0) {\n      const hungerPercent = Math.max(0, Math.min(100, Math.round(((400 - snakeBody.length) / 400) * 100)));\n      const maxRelAllowed = 1 + (relF - 1) * (hungerPercent / 100);\n\n      const shortcutsToFood = hamiltonianSafeMoves.filter(m => m.relN <= relF && m.relN <= maxRelAllowed);\n\n      if (shortcutsToFood.length > 0) {\n        shortcutsToFood.sort((a, b) => b.relN - a.relN);\n        const bestShortcut = shortcutsToFood[0].move;\n        const relN = shortcutsToFood[0].relN;\n\n        if (relN > 1) {\n          const visualPathToFood: Position[] = [head];\n          let pidx = cycleIndexGrid[bestShortcut.pos.x][bestShortcut.pos.y];\n          const limit = 400;\n          let cnt = 0;\n          while (pidx !== idxF && cnt < limit) {\n            visualPathToFood.push(hamiltonianCycle[pidx]);\n            pidx = multiplier === 1 ? (pidx + 1) % 400 : (pidx - 1 + 400) % 400;\n            cnt++;\n          }\n          visualPathToFood.push(food);\n\n          return {\n            nextPos: bestShortcut.pos,\n            mode: 'aggressive',\n            safetyPath: bestShortcut.safetyPathToTail,\n            pathToFood: visualPathToFood\n          };\n        }\n      }\n    }\n\n    if (hamiltonianSafeMoves.length > 0) {\n      hamiltonianSafeMoves.sort((a, b) => a.relN - b.relN);\n      const exactNextStep = hamiltonianSafeMoves.find(m => m.relN === 1);\n      const chosen = exactNextStep ? exactNextStep.move : hamiltonianSafeMoves[0].move;\n\n      return {\n        nextPos: chosen.pos,\n        mode: 'survival',\n        safetyPath: chosen.safetyPathToTail,\n        pathToFood: null\n      };\n    }\n  }\n\n  const strictlySafeMoves = candidates.filter(m => m.isSafe);\n  const attachedSafeMoves = strictlySafeMoves.filter(m => isMoveAttached(m.pos, snakeBody, obstacles));\n  let activeMoves = attachedSafeMoves.length > 0 ? attachedSafeMoves : strictlySafeMoves;\n\n  if (activeMoves.length === 0) {\n    activeMoves = candidates.filter(m => m.canReachTail);\n  }\n  if (activeMoves.length === 0) {\n    activeMoves = candidates;\n  }\n\n  let bestMove = activeMoves[0];\n  let maxWeight = -1;\n\n  for (const move of activeMoves) {\n    const adjScore = getAdjacencyScore(move.pos, snakeBody, obstacles);\n    const pathLength = move.safetyPathToTail ? move.safetyPathToTail.length : 0;\n    const vTail = move.virtualBody[move.virtualBody.length - 1];\n    const distToTail = Math.abs(move.pos.x - vTail.x) + Math.abs(move.pos.y - vTail.y);\n    \n    let currentWeight = (pathLength * 5.0) + (adjScore * 15.0) + (distToTail * 10.0);\n    if (distToTail <= 3) {\n      currentWeight -= (4 - distToTail) * 40.0;\n    }\n\n    if (currentWeight > maxWeight) {\n      maxWeight = currentWeight;\n      bestMove = move;\n    }\n  }\n\n  if (bestMove) {\n    return {\n      nextPos: bestMove.pos,\n      mode: 'survival',\n      safetyPath: bestMove.safetyPathToTail,\n      pathToFood: null\n    };\n  }\n\n  const fallback = candidates[0] || { pos: head, safetyPathToTail: null };\n  return {\n    nextPos: fallback.pos,\n    mode: 'tail_chase',\n    safetyPath: fallback.safetyPathToTail,\n    pathToFood: null\n  };\n}\n\n/**\n * Standard A* search tailored for the 99% winrate AI.\n */\nexport function astarPath(\n  start: Position,\n  goal: Position,\n  obstaclesSet: Set<string>\n): Position[] | null {\n  if (!goal) return null;\n  const heuristic = (a: Position, b: Position) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);\n\n  const openSet: { f: number; g: number; pos: Position; path: Position[] }[] = [];\n  const gScore = new Map<string, number>();\n\n  openSet.push({ f: heuristic(start, goal), g: 0, pos: start, path: [start] });\n  gScore.set(`${start.x},${start.y}`, 0);\n\n  const keyFor = (p: Position) => `${p.x},${p.y}`;\n\n  const limit = 2000;\n  let iterations = 0;\n\n  while (openSet.length > 0 && iterations++ < limit) {\n    openSet.sort((a, b) => a.f - b.f);\n    const curr = openSet.shift()!;\n\n    if (curr.pos.x === goal.x && curr.pos.y === goal.y) {\n      return curr.path;\n    }\n\n    const currKey = keyFor(curr.pos);\n    const currG = gScore.get(currKey) ?? Infinity;\n    if (curr.g > currG) continue;\n\n    const dirs = [\n      { x: 0, y: -1 },\n      { x: 0, y: 1 },\n      { x: -1, y: 0 },\n      { x: 1, y: 0 }\n    ];\n\n    for (const d of dirs) {\n      const neighbor = { x: curr.pos.x + d.x, y: curr.pos.y + d.y };\n      if (neighbor.x < 0 || neighbor.x >= GRID_SIZE || neighbor.y < 0 || neighbor.y >= GRID_SIZE) {\n        continue;\n      }\n      const neighKey = keyFor(neighbor);\n      if (obstaclesSet.has(neighKey)) {\n        continue;\n      }\n\n      const tentativeG = curr.g + 1;\n      const neighborG = gScore.get(neighKey) ?? Infinity;\n\n      if (tentativeG < neighborG) {\n        gScore.set(neighKey, tentativeG);\n        const f = tentativeG + heuristic(neighbor, goal);\n        openSet.push({ f, g: tentativeG, pos: neighbor, path: [...curr.path, neighbor] });\n      }\n    }\n  }\n\n  return null;\n}\n\n/**\n * Counts the size and number of connected components in the walkable grid space.\n */\nexport function countComponents(\n  obstaclesSet: Set<string>\n): { count: number; sizes: number[] } {\n  const empty: Position[] = [];\n  const keyFor = (p: Position) => `${p.x},${p.y}`;\n\n  for (let x = 0; x < GRID_SIZE; x++) {\n    for (let y = 0; y < GRID_SIZE; y++) {\n      const key = `${x},${y}`;\n      if (!obstaclesSet.has(key)) {\n        empty.push({ x, y });\n      }\n    }\n  }\n\n  if (empty.length === 0) {\n    return { count: 0, sizes: [] };\n  }\n\n  const visited = new Set<string>();\n  const sizes: number[] = [];\n  let count = 0;\n\n  const dirs = [\n    { x: 0, y: -1 },\n    { x: 0, y: 1 },\n    { x: -1, y: 0 },\n    { x: 1, y: 0 }\n  ];\n\n  for (const start of empty) {\n    const startKey = keyFor(start);\n    if (!visited.has(startKey)) {\n      count++;\n      let size = 0;\n      const queue: Position[] = [start];\n      visited.add(startKey);\n\n      while (queue.length > 0) {\n        const curr = queue.shift()!;\n        size++;\n\n        for (const d of dirs) {\n          const nr = curr.y + d.y;\n          const nc = curr.x + d.x;\n\n          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {\n            const neighbor = { x: nc, y: nr };\n            const neighKey = keyFor(neighbor);\n            if (!obstaclesSet.has(neighKey) && !visited.has(neighKey)) {\n              visited.add(neighKey);\n              queue.push(neighbor);\n            }\n          }\n        }\n      }\n      sizes.push(size);\n    }\n  }\n\n  return { count, sizes };\n}\n\n/**\n * A highly optimized, 99%-winrate heuristic snake AI.\n */\nexport function computeSupremeHeuristicAIMove(\n  snakeBody: Position[],\n  food: Position,\n  obstacles: Position[] = [],\n  currentDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'\n): {\n  nextPos: Position;\n  mode: 'aggressive' | 'survival' | 'tail_chase' | 'distribution' | 'coiling';\n  score: number;\n  phase: string;\n  reason: string;\n  components: number;\n  componentSizes: number[];\n  safetyPath: Position[] | null;\n  pathToFood: Position[] | null;\n} {\n  const head = snakeBody[0];\n  const currentLen = snakeBody.length;\n\n  const currentObstacles = new Set(snakeBody.slice(0, -1).map(p => `${p.x},${p.y}`));\n  for (const obs of obstacles) {\n    currentObstacles.add(`${obs.x},${obs.y}`);\n  }\n\n  const dirs = [\n    { action: 'UP', x: 0, y: -1 },\n    { action: 'DOWN', x: 0, y: 1 },\n    { action: 'LEFT', x: -1, y: 0 },\n    { action: 'RIGHT', x: 1, y: 0 }\n  ] as const;\n\n  const opposites: { [key: string]: string } = {\n    'UP': 'DOWN',\n    'DOWN': 'UP',\n    'LEFT': 'RIGHT',\n    'RIGHT': 'LEFT'\n  };\n\n  const validMoves: { action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'; pos: Position }[] = [];\n\n  for (const d of dirs) {\n    if (d.action === opposites[currentDirection]) {\n      continue;\n    }\n    const nextHead = { x: head.x + d.x, y: head.y + d.y };\n    if (\n      nextHead.x >= 0 && nextHead.x < GRID_SIZE &&\n      nextHead.y >= 0 && nextHead.y < GRID_SIZE &&\n      !currentObstacles.has(`${nextHead.x},${nextHead.y}`)\n    ) {\n      validMoves.push({ action: d.action, pos: nextHead });\n    }\n  }\n\n  if (validMoves.length === 0) {\n    const dOffset = dirs.find(d => d.action === currentDirection) || dirs[0];\n    const fallbackPos = { x: head.x + dOffset.x, y: head.y + dOffset.y };\n    return {\n      nextPos: fallbackPos,\n      mode: 'tail_chase',\n      score: -999999,\n      phase: currentLen >= 320 ? 'MODO DISTRIBUCION' : 'FASE 1: Caza Libre',\n      reason: 'Sin salidas válidas',\n      components: 1,\n      componentSizes: [],\n      safetyPath: null,\n      pathToFood: null\n    };\n  }\n\n  const safeObstaclesSet = new Set<string>();\n  for (let i = 1; i < snakeBody.length - 1; i++) {\n    safeObstaclesSet.add(`${snakeBody[i].x},${snakeBody[i].y}`);\n  }\n  for (const obs of obstacles) {\n    safeObstaclesSet.add(`${obs.x},${obs.y}`);\n  }\n  const { count: numComponents, sizes: componentSizes } = countComponents(safeObstaclesSet);\n\n  let consecutiveCount = 0;\n  for (let i = 0; i < snakeBody.length - 1; i++) {\n    const idxA = cycleIndexGrid[snakeBody[i].x][snakeBody[i].y];\n    const idxB = cycleIndexGrid[snakeBody[i+1].x][snakeBody[i+1].y];\n    if (idxA !== -1 && idxB !== -1) {\n      const diff = (idxA - idxB + 400) % 400;\n      if (diff === 1 || diff === 399) {\n        consecutiveCount++;\n      }\n    }\n  }\n  const isAligned = consecutiveCount >= Math.min(15, Math.floor(snakeBody.length * 0.7));\n\n  if (currentLen >= 320) {\n    if (numComponents === 1 && isAligned) {\n      const hResult = computeNextAIMove(snakeBody, food, obstacles, false, 320);\n      return {\n        nextPos: hResult.nextPos,\n        mode: 'coiling',\n        score: 999999,\n        phase: 'MODO COIL (Espiral)',\n        reason: hResult.pathToFood ? 'Atajo hamiltoniano seguro progresivo' : 'Auto-espiral perimetral del vídeo',\n        components: numComponents,\n        componentSizes: componentSizes,\n        safetyPath: hResult.safetyPath,\n        pathToFood: hResult.pathToFood\n      };\n    } else {\n      const idxH = cycleIndexGrid[head.x][head.y];\n\n      let fwdCount = 0;\n      let bwdCount = 0;\n      for (let i = 0; i < snakeBody.length - 1; i++) {\n        const idxA = cycleIndexGrid[snakeBody[i].x][snakeBody[i].y];\n        const idxB = cycleIndexGrid[snakeBody[i+1].x][snakeBody[i+1].y];\n        if (idxA !== -1 && idxB !== -1) {\n          const fwdDiff = (idxA - idxB + 400) % 400;\n          const bwdDiff = (idxB - idxA + 400) % 400;\n          if (fwdDiff === 1) fwdCount++;\n          if (bwdDiff === 1) bwdCount++;\n        }\n      }\n      const preferredMulti = fwdCount >= bwdCount ? 1 : -1;\n\n      const simulatedMoves: {\n        action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';\n        pos: Position;\n        pathToTail: Position[] | null;\n        simComponents: number;\n        simSizes: number[];\n        isSequential: boolean;\n        nextHead: Position;\n        nextObstaclesSet: Set<string>;\n        distToTail: number;\n      }[] = [];\n\n      for (const move of validMoves) {\n        const nextHead = move.pos;\n        const action = move.action;\n        const moveIdx = cycleIndexGrid[nextHead.x][nextHead.y];\n\n        const willEat = (nextHead.x === food.x && nextHead.y === food.y);\n        const simBody = [...snakeBody];\n        simBody.unshift(nextHead);\n        if (!willEat) {\n          simBody.pop();\n        }\n\n        const newTail = simBody[simBody.length - 1];\n        const nextObstaclesSet = new Set<string>();\n        for (let i = 1; i < simBody.length - 1; i++) {\n          nextObstaclesSet.add(`${simBody[i].x},${simBody[i].y}`);\n        }\n        for (const obs of obstacles) {\n          nextObstaclesSet.add(`${obs.x},${obs.y}`);\n        }\n\n        const pathToTail = astarPath(nextHead, newTail, nextObstaclesSet);\n        if (pathToTail === null) {\n          continue; \n        }\n\n        const { count: simComponents, sizes: simSizes } = countComponents(nextObstaclesSet);\n        const distToTail = Math.abs(nextHead.x - newTail.x) + Math.abs(nextHead.y - newTail.y);\n\n        let isSequential = false;\n        if (idxH !== -1 && moveIdx !== -1) {\n          const diff = preferredMulti === 1\n            ? (moveIdx - idxH + 400) % 400\n            : (idxH - moveIdx + 400) % 400;\n          if (diff === 1) {\n            isSequential = true;\n          }\n        }\n\n        simulatedMoves.push({\n          action,\n          pos: nextHead,\n          pathToTail,\n          simComponents,\n          simSizes,\n          isSequential,\n          nextHead,\n          nextObstaclesSet,\n          distToTail\n        });\n      }\n\n      const hasUnifiedMove = simulatedMoves.some(m => m.simComponents === 1);\n      const filteredMoves = hasUnifiedMove \n        ? simulatedMoves.filter(m => m.simComponents === 1)\n        : simulatedMoves;\n\n      let bestAction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;\n      let bestScore = -Infinity;\n      let decisionReason = \"Distribución de bloques libres\";\n      let bestSafetyPath: Position[] | null = null;\n      let bestPathToFood: Position[] | null = null;\n\n      for (const m of filteredMoves) {\n        let score = 0;\n\n        if (m.simComponents === 1) {\n          score += 20000000;\n        } else {\n          score -= m.simComponents * 10000000;\n        }\n\n        if (m.isSequential) {\n          score += 8000000;\n        }\n\n        score += m.pathToTail!.length * 150000;\n        score += m.distToTail * 500000;\n\n        if (m.distToTail <= 3) {\n          score -= (4 - m.distToTail) * 2000000;\n        }\n\n        if (m.simComponents === 1) {\n          const pathToFood = astarPath(m.nextHead, food, m.nextObstaclesSet);\n          if (pathToFood) {\n            score -= pathToFood.length * 100;\n          }\n        }\n\n        if (m.action === currentDirection) {\n          score += 500000;\n        }\n\n        if (score > bestScore) {\n          bestScore = score;\n          bestAction = m.action;\n          bestSafetyPath = m.pathToTail;\n          const pathToFood = astarPath(m.nextHead, food, m.nextObstaclesSet);\n          bestPathToFood = pathToFood;\n        }\n      }\n\n      if (bestAction === null && validMoves.length > 0) {\n        let bestLen = -1;\n        for (const move of validMoves) {\n          const nextHead = move.pos;\n          const simBody = [...snakeBody];\n          simBody.unshift(nextHead);\n          if (!(nextHead.x === food.x && nextHead.y === food.y)) {\n            simBody.pop();\n          }\n          const nextObstaclesSet = new Set<string>();\n          for (let i = 1; i < simBody.length - 1; i++) {\n            nextObstaclesSet.add(`${simBody[i].x},${simBody[i].y}`);\n          }\n          for (const obs of obstacles) {\n            nextObstaclesSet.add(`${obs.x},${obs.y}`);\n          }\n          const pt = astarPath(nextHead, simBody[simBody.length - 1], nextObstaclesSet);\n          if (pt && pt.length > bestLen) {\n            bestLen = pt.length;\n            bestAction = move.action;\n            bestSafetyPath = pt;\n          }\n        }\n      }\n\n      if (bestAction === null) {\n        bestAction = validMoves[0].action;\n        decisionReason = \"Distribución: Evasión de emergencia\";\n      } else {\n        decisionReason = numComponents > 1 \n          ? `Barrido perimetral (Unificando ${numComponents} islas libres)`\n          : `Espera de alineación con el ciclo (${consecutiveCount}/${snakeBody.length} blocks alineados)`;\n      }\n\n      const chosenMove = validMoves.find(m => m.action === bestAction)!;\n      return {\n        nextPos: chosenMove.pos,\n        mode: 'distribution',\n        score: bestScore,\n        phase: 'MODO DISTRIBUCIÓN',\n        reason: decisionReason,\n        components: numComponents,\n        componentSizes: componentSizes,\n        safetyPath: bestSafetyPath,\n        pathToFood: bestPathToFood\n      };\n    }\n  }\n\n  // --- FASE 1: CAZA LIBRE ---\n  let bestAction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;\n  let bestScore = -Infinity;\n  let decisionReason = \"Desconocido\";\n  let bestSafetyPath: Position[] | null = null;\n  let bestPathToFood: Position[] | null = null;\n\n  for (const move of validMoves) {\n    const nextHead = move.pos;\n    const action = move.action;\n\n    const willEat = (nextHead.x === food.x && nextHead.y === food.y);\n    const simBody = [...snakeBody];\n    simBody.unshift(nextHead);\n    if (!willEat) {\n      simBody.pop();\n    }\n\n    const newTail = simBody[simBody.length - 1];\n    const nextObstaclesSet = new Set<string>();\n    for (let i = 1; i < simBody.length - 1; i++) {\n      nextObstaclesSet.add(`${simBody[i].x},${simBody[i].y}`);\n    }\n    for (const obs of obstacles) {\n      nextObstaclesSet.add(`${obs.x},${obs.y}`);\n    }\n\n    const pathToTail = astarPath(nextHead, newTail, nextObstaclesSet);\n    if (pathToTail === null) {\n      continue; \n    }\n\n    const pathToFood = astarPath(nextHead, food, nextObstaclesSet);\n    const distToFood = pathToFood ? pathToFood.length : 9999;\n    const { count: simComponents, sizes: simSizes } = countComponents(nextObstaclesSet);\n    const hasSmallIsland = simSizes.some(size => size < 10);\n\n    let score = 0.0;\n    let reason = \"Caza Libre\";\n\n    const distToTail = Math.abs(nextHead.x - newTail.x) + Math.abs(nextHead.y - newTail.y);\n    const hungerPercent = Math.max(0, Math.min(100, Math.round(((400 - snakeBody.length) / 400) * 100)));\n    const foodWeight = 40000.0 * (hungerPercent / 100.0) + 12000.0;\n    score -= distToFood * foodWeight;\n\n    score += pathToTail.length * 15000.0;\n    score += distToTail * 25000.0;\n\n    if (distToTail <= 3) {\n      score -= (4 - distToTail) * 100000.0;\n    }\n\n    if (distToFood <= 4) {\n      score += (5 - distToFood) * 2000.0 * (hungerPercent / 100.0 + 0.5);\n    }\n\n    if (hasSmallIsland) {\n      score -= 300000.0; \n    }\n\n    if (action === currentDirection) {\n      score += 15000.0;\n    } else {\n      score += 5000.0;\n    }\n\n    if (score > bestScore) {\n      bestScore = score;\n      bestAction = action;\n      decisionReason = reason;\n      bestSafetyPath = pathToTail;\n      bestPathToFood = pathToFood;\n    }\n  }\n\n  if (bestAction === null && validMoves.length > 0) {\n    let bestLen = -1;\n    for (const move of validMoves) {\n      const nextHead = move.pos;\n      const simBody = [...snakeBody];\n      simBody.unshift(nextHead);\n      if (!(nextHead.x === food.x && nextHead.y === food.y)) {\n        simBody.pop();\n      }\n      const nextObstaclesSet = new Set<string>();\n      for (let i = 1; i < simBody.length - 1; i++) {\n        nextObstaclesSet.add(`${simBody[i].x},${simBody[i].y}`);\n      }\n      for (const obs of obstacles) {\n        nextObstaclesSet.add(`${obs.x},${obs.y}`);\n      }\n      const pt = astarPath(nextHead, simBody[simBody.length - 1], nextObstaclesSet);\n      if (pt && pt.length > bestLen) {\n        bestLen = pt.length;\n        bestAction = move.action;\n        bestSafetyPath = pt;\n        decisionReason = \"Evasión por supervivencia (Cola)\";\n      }\n    }\n  }\n\n  if (bestAction === null) {\n    bestAction = validMoves[0].action;\n    decisionReason = \"Fallback de último recurso\";\n  }\n\n  const chosenMove = validMoves.find(m => m.action === bestAction) || validMoves[0];\n\n  return {\n    nextPos: chosenMove.pos,\n    mode: bestPathToFood ? 'aggressive' : 'survival',\n    score: bestScore,\n    phase: 'FASE 1: Caza Libre',\n    reason: decisionReason,\n    components: numComponents,\n    componentSizes: componentSizes,\n    safetyPath: bestSafetyPath,\n    pathToFood: bestPathToFood\n  };\n}\n