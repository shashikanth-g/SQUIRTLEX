// FlowRouter.js — Multi-path optimization and rerouting logic
import { aStar } from './AStar.js';
import { dijkstra } from './Dijkstra.js';

/**
 * Find alternative paths when a pipe is blocked.
 * @param {string} blockedPipeId
 * @param {object} networkState - { nodes, pipes, valves, reservoirs, zones }
 * @returns {Array} reroutingPlan
 */
export function findAlternativeRoutes(blockedPipeId, networkState) {
  const { nodes, pipes, valves, reservoirs, zones } = networkState;
  const blockedPipe = pipes.find((p) => p.id === blockedPipeId);
  if (!blockedPipe) return [];

  // Find all downstream nodes affected by the blockage
  const affectedNodeIds = findDownstreamNodes(blockedPipe.target, pipes, nodes);
  const activePipes = pipes.filter((p) => p.id !== blockedPipeId && p.status !== 'blocked');

  const reroutingPlan = [];

  affectedNodeIds.forEach((nodeId) => {
    const zone = zones.find((z) => z.connectedNode === nodeId);
    if (!zone) return;

    // Try A* first for potentially better paths
    const reservoirId = reservoirs.length > 0 ? reservoirs[0].id : 'R1';
    let altPath = aStar(reservoirId, nodeId, activePipes, nodes);

    // Fallback to Dijkstra
    if (altPath.length === 0) {
      altPath = dijkstra(reservoirId, nodeId, activePipes, nodes);
    }

    if (altPath.length > 0) {
      const valvesInPath = identifyValvesInPath(altPath, valves);
      reroutingPlan.push({
        zoneId: zone.id,
        zoneName: zone.name,
        affectedPopulation: zone.population || 0,
        alternativePath: altPath,
        valvesToOpen: valvesInPath,
        estimatedRestoreTime: altPath.length * 30, // seconds
        confidence: Math.max(50, 100 - altPath.length * 5),
      });
    } else {
      reroutingPlan.push({
        zoneId: zone.id,
        zoneName: zone.name,
        affectedPopulation: zone.population || 0,
        alternativePath: [],
        valvesToOpen: [],
        estimatedRestoreTime: null,
        confidence: 0,
        critical: true,
        action: 'EMERGENCY_TANKER_DISPATCH',
      });
    }
  });

  return reroutingPlan;
}

/**
 * Find all nodes downstream of a given node.
 */
function findDownstreamNodes(startNodeId, pipes, nodes) {
  const visited = new Set();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    pipes
      .filter((p) => p.source === current && p.status !== 'blocked')
      .forEach((p) => {
        if (!visited.has(p.target)) queue.push(p.target);
      });
  }

  return Array.from(visited);
}

/**
 * Find valves that exist along a path.
 */
function identifyValvesInPath(path, valves) {
  const valvesFound = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    valves.forEach((v) => {
      if (v.connected.includes(a) && v.connected.includes(b)) {
        valvesFound.push(v.id);
      }
    });
  }
  return [...new Set(valvesFound)];
}

/**
 * Find all zones downstream of a node.
 */
export function findDownstreamZones(nodeId, pipes, zones) {
  const downstream = findDownstreamNodes(nodeId, pipes, []);
  return zones.filter((z) => downstream.includes(z.connectedNode));
}
