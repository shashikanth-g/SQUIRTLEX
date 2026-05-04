// Dijkstra.js — Shortest path algorithm for the water network

/**
 * Find shortest path from start to goal using Dijkstra's algorithm.
 * @param {string} start - Starting node ID
 * @param {string} goal - Goal node ID
 * @param {Array} pipes - Array of pipe objects (filtered to exclude blocked)
 * @param {Array} nodes - Array of node objects
 * @returns {string[]} - Array of node IDs forming the path, empty if none found
 */
export function dijkstra(start, goal, pipes, nodes) {
  const graph = buildAdjacencyList(pipes);
  const dist = {};
  const prev = {};
  const visited = new Set();
  const allNodeIds = new Set();

  pipes.forEach((p) => {
    allNodeIds.add(p.source);
    allNodeIds.add(p.target);
  });

  allNodeIds.forEach((id) => {
    dist[id] = Infinity;
    prev[id] = null;
  });

  dist[start] = 0;

  while (true) {
    // Find unvisited node with smallest distance
    let current = null;
    let minDist = Infinity;
    allNodeIds.forEach((id) => {
      if (!visited.has(id) && dist[id] < minDist) {
        minDist = dist[id];
        current = id;
      }
    });

    if (current === null) break; // No reachable nodes left
    if (current === goal) break; // Found goal

    visited.add(current);

    const neighbors = graph[current] || [];
    neighbors.forEach(({ node: neighborId, weight }) => {
      if (visited.has(neighborId)) return;
      const alt = dist[current] + weight;
      if (alt < dist[neighborId]) {
        dist[neighborId] = alt;
        prev[neighborId] = current;
      }
    });
  }

  // Reconstruct path
  if (dist[goal] === Infinity) return [];
  const path = [];
  let current = goal;
  while (current) {
    path.unshift(current);
    current = prev[current];
  }
  return path;
}

/**
 * Build an adjacency list from pipes.
 * Pipes are bidirectional for pathfinding purposes.
 */
function buildAdjacencyList(pipes) {
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
