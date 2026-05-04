// NetworkGraph.js — Phase 4: Graph-based network reasoning

/**
 * Build a bidirectional adjacency map from the active network.
 * ONLY uses nodes (excludes valves from pathfinding).
 * Returns Map<nodeId, EdgeInfo[]>
 */
export function buildNetworkGraph(pipes, nodes, valves) {
  const graph = new Map();
  const nodeIds = new Set(nodes.map(n => n.id));

  // Seed ONLY nodes (not valves)
  for (const n of nodes) {
    graph.set(n.id, []);
  }

  for (const pipe of pipes) {
    if (pipe.status === 'blocked') continue;

    // Check both endpoints are nodes (skip valve endpoints)
    if (!nodeIds.has(pipe.source) || !nodeIds.has(pipe.target)) {
      continue;
    }

    // Effective throughput considering valve and blockage
    const valve = valves.find(v =>
      (v.connected.includes(pipe.source) && v.connected.includes(pipe.target)) ||
      v.id === pipe.source ||
      v.id === pipe.target
    );
    const valveFactor    = valve ? valve.openPercentage / 100 : 1;
    const blockageFactor = (100 - (pipe.blockagePercent || 0)) / 100;
    const effectiveCap   = pipe.diameter * valveFactor * blockageFactor;
    const weight         = (pipe.length || 100) / Math.max(1, effectiveCap);

    // Add edges only between nodes
    for (const [src, tgt] of [[pipe.source, pipe.target], [pipe.target, pipe.source]]) {
      if (!graph.has(src)) graph.set(src, []);
      graph.get(src).push({ nodeId: tgt, pipeId: pipe.id, weight, capacity: effectiveCap });
    }
  }

  return graph;
}

/**
 * BFS shortest path (by hop count).
 * Returns only paths where all nodes exist in graph.
 */
export function bfsPath(startId, goalId, graph) {
  // Validate start/goal exist in graph (are actual nodes)
  if (!graph.has(startId) || !graph.has(goalId)) {
    console.warn(`[PATHFIND] Invalid nodes: ${startId} → ${goalId}`);
    return [];
  }

  const queue   = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path    = queue.shift();
    const current = path[path.length - 1];
    if (current === goalId) {
      // Validate ALL path nodes exist before returning
      const allValid = path.every(nodeId => graph.has(nodeId));
      if (!allValid) {
        console.warn(`[PATHFIND] Invalid path contains non-node IDs: ${path.join(' → ')}`);
        return [];
      }
      return path;
    }

    for (const { nodeId } of (graph.get(current) || [])) {
      if (!visited.has(nodeId) && graph.has(nodeId)) {
        visited.add(nodeId);
        queue.push([...path, nodeId]);
      }
    }
  }
  return [];
}

/**
 * Find all upstream node IDs (nodes that feed flow INTO targetId).
 */
export function findUpstreamNodes(targetId, pipes, maxDepth = 12) {
  const visited = new Set();
  const queue   = [{ id: targetId, depth: 0 }];
  const result  = [];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id) || depth > maxDepth) continue;
    visited.add(id);

    for (const p of pipes) {
      if (p.target === id && p.status !== 'blocked' && !visited.has(p.source)) {
        result.push(p.source);
        queue.push({ id: p.source, depth: depth + 1 });
      }
    }
  }
  return result;
}

/**
 * Find all downstream node IDs (nodes that receive flow FROM sourceId).
 */
export function findDownstreamNodes(sourceId, pipes, maxDepth = 12) {
  const visited = new Set();
  const queue   = [{ id: sourceId, depth: 0 }];
  const result  = [];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id) || depth > maxDepth) continue;
    visited.add(id);

    for (const p of pipes) {
      if (p.source === id && p.status !== 'blocked' && !visited.has(p.target)) {
        result.push(p.target);
        queue.push({ id: p.target, depth: depth + 1 });
      }
    }
  }
  return result;
}

/**
 * Estimate the bottleneck (min-capacity) flow transfer possible between two nodes.
 */
export function bottleneckCapacity(fromNodeId, toNodeId, graph) {
  const path = bfsPath(fromNodeId, toNodeId, graph);
  if (path.length < 2) return 0;

  let minCap = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const edges = graph.get(path[i]) || [];
    const edge  = edges.find(e => e.nodeId === path[i + 1]);
    if (edge) minCap = Math.min(minCap, edge.capacity);
  }
  return minCap === Infinity ? 0 : minCap;
}

/**
 * Find zones with supply surplus that can transfer to a deficit zone.
 * Returns array sorted by descending surplus, with transfer capacity estimate.
 */
export function findSurplusZones(deficitZoneId, state) {
  const { zones, nodes, pipes, valves } = state;
  const deficitZone = zones.find(z => z.id === deficitZoneId);
  if (!deficitZone) return [];

  const graph = buildNetworkGraph(pipes, nodes, valves);

  return zones
    .filter(z =>
      z.id !== deficitZoneId &&
      z.demandCurrent > 0 &&
      z.supplyCurrent > z.demandCurrent * 1.05
    )
    .map(z => {
      const surplus  = z.supplyCurrent - z.demandCurrent;
      const fromNode = z.connectedNode;
      const toNode   = deficitZone.connectedNode;
      const cap      = fromNode && toNode ? bottleneckCapacity(fromNode, toNode, graph) : 0;
      return { ...z, surplusAmount: surplus, transferCapacity: cap };
    })
    .filter(z => z.surplusAmount > 5)
    .sort((a, b) => b.surplusAmount - a.surplusAmount);
}

/**
 * Load-balance recommendation: redistribute valves to equalize pressure across zones.
 * Returns list of { valveId, targetOpen } adjustments.
 */
export function computeLoadBalanceAdjustments(state) {
  const { zones, nodes, pipes, valves } = state;
  const adjustments = [];

  const avgPressure =
    nodes.reduce((s, n) => s + n.pressure, 0) / Math.max(1, nodes.length);

  // For each valve: if downstream pressure is lower than average → open more
  for (const valve of valves) {
    if (valve.mode !== 'auto') continue;
    const downstreamNodes = valve.connected
      .flatMap(id => findDownstreamNodes(id, pipes))
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean);

    if (downstreamNodes.length === 0) continue;
    const avgDown = downstreamNodes.reduce((s, n) => s + n.pressure, 0) / downstreamNodes.length;

    let targetOpen = valve.openPercentage;
    if (avgDown < avgPressure * 0.85 && valve.openPercentage < 95) {
      targetOpen = Math.min(100, valve.openPercentage + 10);
    } else if (avgDown > avgPressure * 1.15 && valve.openPercentage > 20) {
      targetOpen = Math.max(10, valve.openPercentage - 10);
    }

    if (targetOpen !== valve.openPercentage) {
      adjustments.push({ valveId: valve.id, targetOpen, reason: `Load balance: downstream avg ${Math.round(avgDown)} PSI vs network avg ${Math.round(avgPressure)} PSI` });
    }
  }

  return adjustments;
}
