// AStar.js — A* pathfinding with heuristic for the water network

/**
 * Find path from start to goal using A* algorithm.
 * @param {string} start - Starting node ID
 * @param {string} goal - Goal node ID
 * @param {Array} pipes - Array of pipe objects (pre-filtered to exclude blocked)
 * @param {Array} nodes - Array of node objects (need positions for heuristic)
 * @returns {string[]} - Array of node IDs forming the path, empty if none
 */
export function aStar(start, goal, pipes, nodes) {
  const nodeMap = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  const graph = buildGraph(pipes);
  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  // Initialize
  const allIds = new Set();
  pipes.forEach((p) => {
    allIds.add(p.source);
    allIds.add(p.target);
  });
  allIds.forEach((id) => {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = heuristic(start, goal, nodeMap);

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let current = null;
    let minF = Infinity;
    openSet.forEach((id) => {
      if (fScore[id] < minF) {
        minF = fScore[id];
        current = id;
      }
    });

    if (current === goal) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);
    const neighbors = graph[current] || [];

    neighbors.forEach(({ node: neighborId, weight }) => {
      const tentativeG = gScore[current] + weight;
      if (tentativeG < (gScore[neighborId] || Infinity)) {
        cameFrom[neighborId] = current;
        gScore[neighborId] = tentativeG;
        fScore[neighborId] = tentativeG + heuristic(neighborId, goal, nodeMap);
        openSet.add(neighborId);
      }
    });
  }

  return []; // No path found
}

/**
 * Euclidean distance heuristic based on node positions.
 */
function heuristic(a, b, nodeMap) {
  const nodeA = nodeMap[a];
  const nodeB = nodeMap[b];
  if (!nodeA?.position || !nodeB?.position) return 0;
  const dx = nodeA.position.x - nodeB.position.x;
  const dy = nodeA.position.y - nodeB.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Reconstruct the path from cameFrom map.
 */
function reconstructPath(cameFrom, current) {
  const path = [current];
  while (cameFrom[current]) {
    current = cameFrom[current];
    path.unshift(current);
  }
  return path;
}

/**
 * Build adjacency list from pipes (bidirectional).
 */
function buildGraph(pipes) {
  const graph = {};
  pipes.forEach((pipe) => {
    if (pipe.status === 'blocked') return;
    const weight = pipe.length || 1;
    if (!graph[pipe.source]) graph[pipe.source] = [];
    if (!graph[pipe.target]) graph[pipe.target] = [];
    graph[pipe.source].push({ node: pipe.target, weight, pipeId: pipe.id });
    graph[pipe.target].push({ node: pipe.source, weight, pipeId: pipe.id });
  });
  return graph;
}
