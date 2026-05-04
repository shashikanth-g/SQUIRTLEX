// TankerManager.js — Emergency tanker dispatch, movement, and delivery
import { buildNetworkGraph, bfsPath } from './NetworkGraph.js';
import { debugLog } from './WaterFlowEngine.js';

const DEPOT_POSITION      = { x: 80, y: 640 };
const DEPOT_NODE          = 'N16'; // Closest node to depot
const MOVE_SPEED_TRANSIT  = 3;     // nodes per tanker-tick while in transit
const MOVE_SPEED_RETURN   = 4;     // faster on return
const TANKER_CAPACITY     = 4000;
// DELIVERY_RATE is the supply-rate boost (same units as zone.demandCurrent) that a
// delivering tanker injects into zone.tankerSupply each tanker-tick.
// The engine reads zone.tankerSupply every physics tick (no engine-side decay),
// so this rate stays applied until the next tanker-tick resets it.
const DELIVERY_RATE = 60;

let tankerIdCounter = 1;

class TankerManager {
  constructor() {
    this.tankers = [];
    this.networkState = null; // Store reference to network for path planning
  }

  /** Set network state for path planning */
  setNetworkState(state) {
    this.networkState = state;
  }

  /** Dispatch a tanker to a zone. Deduplicates: skips if zone already being served. */
  dispatch(zoneId, targetPosition) {
    const alreadyServing = this.tankers.some(
      (t) => t.targetZoneId === zoneId && t.status !== 'returning' && t.status !== 'completed'
    );
    if (alreadyServing) return null;

    // Find zone's connected node
    const zone = this.networkState?.zones?.find(z => z.id === zoneId);
    const targetNode = zone?.connectedNode || null;

    // Compute path from depot to target node
    let path = [];
    if (this.networkState && targetNode) {
      const graph = buildNetworkGraph(
        this.networkState.pipes,
        this.networkState.nodes,
        this.networkState.valves
      );
      path = bfsPath(DEPOT_NODE, targetNode, graph);

      // Validate all path nodes exist in nodes list
      if (path.length > 0) {
        const nodeIds = new Set(this.networkState.nodes.map(n => n.id));
        const validPath = path.every(id => nodeIds.has(id));
        if (!validPath) {
          console.warn(`[TANKER] Invalid path contains non-nodes: ${path.join(' → ')}`);
          path = [];
        }
      }
      console.log(`[TANKER PATH] ${DEPOT_NODE} → ${targetNode}: [${path.join(' → ')}] (${path.length} nodes)`);
    }

    const tanker = {
      id:             `TK_${String(tankerIdCounter++).padStart(3, '0')}`,
      status:         'in_transit',
      targetZoneId:   zoneId,
      capacity:       TANKER_CAPACITY,
      currentLoad:    TANKER_CAPACITY,
      position:       { ...DEPOT_POSITION },
      targetPosition: { ...(targetPosition || DEPOT_POSITION) },
      path:           path, // [nodeIds] from depot to zone
      pathIndex:      0,    // Current position in path
      dispatchedAt:   Date.now(),
    };
    this.tankers.push(tanker);
    console.log(`[TANKER] ${tanker.id} dispatched → zone ${zoneId} via ${path.length} nodes`);
    return tanker;
  }

  /**
   * Advance tanker movement and delivery.
   * Called every ~3 s from SimulationContext.
   *
   * Key contract with WaterFlowEngine:
   *   - We RESET zone.tankerSupply to 0 for all zones first.
   *   - Delivering tankers then SET zone.tankerSupply = DELIVERY_RATE.
   *   - The engine reads zone.tankerSupply each physics tick WITHOUT decaying it.
   *   - So the boost stays applied between tanker-ticks — no accumulation, no washout.
   */
  tick(zones) {
    // 1. Clear all tanker supply boosts — will be re-applied only for active deliveries
    zones.forEach((z) => { z.tankerSupply = 0; });

    // 2. Process each tanker
    for (const tanker of this.tankers) {
      switch (tanker.status) {

        case 'in_transit': {
          // Follow path node-by-node
          if (tanker.path && tanker.path.length > 0) {
            const arrived = _moveAlongPath(tanker, MOVE_SPEED_TRANSIT, this.networkState);
            if (arrived) {
              tanker.status = 'delivering';
              console.log(`[TANKER] ${tanker.id} → arrived at zone ${tanker.targetZoneId}, delivering`);
            }
          } else {
            // Fallback: direct movement (if path planning failed)
            const arrived = _moveToward(tanker, tanker.targetPosition, 5);
            if (arrived) {
              tanker.status = 'delivering';
              console.log(`[TANKER] ${tanker.id} → arrived (direct), delivering`);
            }
          }
          break;
        }

        case 'delivering': {
          const zone = zones.find((z) => z.id === tanker.targetZoneId);
          if (zone) {
            const boost = Math.min(DELIVERY_RATE, tanker.currentLoad);
            // Set supply rate (not accumulate) — reset at top of tick handles multi-tanker zones
            zone.tankerSupply = (zone.tankerSupply || 0) + boost;
            tanker.currentLoad = Math.max(0, tanker.currentLoad - boost);

            debugLog(`[DEBUG:TANKER] ${tanker.id} delivering ${boost} to ${zone.id} (tankerSupply: ${zone.tankerSupply})`);
          }
          if (tanker.currentLoad <= 0) {
            tanker.status         = 'returning';
            tanker.targetPosition = { ...DEPOT_POSITION };
            // Compute return path
            if (this.networkState) {
              const zone = zones.find(z => z.id === tanker.targetZoneId);
              const startNode = zone?.connectedNode || DEPOT_NODE;
              const graph = buildNetworkGraph(
                this.networkState.pipes,
                this.networkState.nodes,
                this.networkState.valves
              );
              tanker.path = bfsPath(startNode, DEPOT_NODE, graph);
              tanker.pathIndex = 0;

              // Validate all return path nodes exist
              if (tanker.path.length > 0) {
                const nodeIds = new Set(this.networkState.nodes.map(n => n.id));
                const validPath = tanker.path.every(id => nodeIds.has(id));
                if (!validPath) {
                  console.warn(`[TANKER] Invalid return path: ${tanker.path.join(' → ')}`);
                  tanker.path = [];
                }
              }
              console.log(`[TANKER] ${tanker.id} → empty, return path: [${tanker.path.join(' → ')}]`);
            } else {
              console.log(`[TANKER] ${tanker.id} → empty, returning to depot (direct)`);
            }
          }
          break;
        }

        case 'returning': {
          if (tanker.path && tanker.path.length > 0) {
            const arrived = _moveAlongPath(tanker, MOVE_SPEED_RETURN, this.networkState);
            if (arrived) {
              tanker.status = 'completed';
              console.log(`[TANKER] ${tanker.id} → back at depot`);
            }
          } else {
            const arrived = _moveToward(tanker, DEPOT_POSITION, 7);
            if (arrived) {
              tanker.status = 'completed';
              console.log(`[TANKER] ${tanker.id} → back at depot (direct)`);
            }
          }
          break;
        }
      }
    }

    // 3. Prune completed tankers
    this.tankers = this.tankers.filter((t) => t.status !== 'completed');
  }

  getActive() {
    return this.tankers.filter((t) => t.status !== 'completed');
  }

  isServingZone(zoneId) {
    return this.tankers.some(
      (t) => t.targetZoneId === zoneId && t.status !== 'returning' && t.status !== 'completed'
    );
  }

  reset() {
    this.tankers = [];
    tankerIdCounter = 1;
  }
}

function _moveToward(tanker, target, speed) {
  const dx   = target.x - tanker.position.x;
  const dy   = target.y - tanker.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= speed) {
    tanker.position = { ...target };
    return true;
  }
  tanker.position = {
    x: tanker.position.x + (dx / dist) * speed,
    y: tanker.position.y + (dy / dist) * speed,
  };
  return false;
}

/**
 * Move tanker along its path (node-by-node).
 * Returns true when final destination reached.
 */
function _moveAlongPath(tanker, nodeSpeed, networkState) {
  if (!tanker.path || tanker.path.length === 0) return true;

  // Get current target node
  const nextNodeId = tanker.path[tanker.pathIndex];
  const nextNode = networkState?.nodes?.find(n => n.id === nextNodeId);

  if (!nextNode) {
    console.warn(`[TANKER] ${tanker.id} — node ${nextNodeId} not found, skipping`);
    tanker.pathIndex++;
    return tanker.pathIndex >= tanker.path.length;
  }

  const target = nextNode.position;
  const dx = target.x - tanker.position.x;
  const dy = target.y - tanker.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 15) {
    // Reached current waypoint, advance to next
    tanker.position = { ...target };
    tanker.pathIndex++;
    console.log(`[TANKER] ${tanker.id} → reached node ${nextNodeId} (${tanker.pathIndex}/${tanker.path.length})`);

    if (tanker.pathIndex >= tanker.path.length) {
      // Final node reached
      return true;
    }
    return false;
  }

  // Move toward current waypoint
  const moveSpeed = Math.min(8, dist); // Smooth movement speed (px per tick)
  tanker.position = {
    x: tanker.position.x + (dx / dist) * moveSpeed,
    y: tanker.position.y + (dy / dist) * moveSpeed,
  };
  return false;
}

export const tankerManager = new TankerManager();
