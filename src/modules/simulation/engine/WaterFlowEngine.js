// WaterFlowEngine.js — Core physics simulation loop with graph-based rerouting
import { calculatePressure, calculateFlow, getDemandMultiplier } from '@/utils/physics.js';
import { buildNetworkGraph, bfsPath } from './NetworkGraph.js';
import { pipeAgingManager } from './PipeAgingManager.js';

// Safe debug initialization (Strict Mode compatible)
if (typeof window !== "undefined" && window.__debug === undefined) {
  window.__debug = false;
}

export function debugLog(...args) {
  if (typeof window !== "undefined" && window.__debug === true) {
    console.log(...args);
  }
}

export class WaterFlowEngine {
  constructor(networkData, buildings) {
    this.nodes = JSON.parse(JSON.stringify(networkData.nodes));
    this.pipes = JSON.parse(JSON.stringify(networkData.pipes));
    this.valves = JSON.parse(JSON.stringify(networkData.valves));
    this.reservoirs = JSON.parse(JSON.stringify(networkData.reservoirs));
    this.zones = JSON.parse(JSON.stringify(buildings));
    this.treatmentPlants = JSON.parse(JSON.stringify(networkData.treatmentPlants || []));
    this.rivers = JSON.parse(JSON.stringify(networkData.rivers || []));
    this.listeners = [];
    this.rerouteInfo = null; // Store active reroute for visualization
  }

  _debug(category, data) {
    debugLog(`[DEBUG:${category}]`, data);
  }

  tick(simTime) {
    const hour = simTime.hour + simTime.minute / 60;
    const demandMult = getDemandMultiplier(hour);

    // 1. Update zone demands based on time of day
    this.zones.forEach((zone) => {
      zone.demandCurrent = Math.round(zone.demandBase * demandMult);
    });

    // 2. Auto-rerouting: detect blocked pipes and find alternate paths
    this.autoReroute();

    // 3. Update reservoir output pressure
    this.reservoirs.forEach((r) => {
      const levelPct = r.currentLevel / r.capacity;
      r.outputPressure = 120 * levelPct;
      const outPipes = this.pipes.filter((p) => p.source === r.id);
      const totalOut = outPipes.reduce((s, p) => s + p.flowRate, 0);
      r.currentLevel = Math.max(0, r.currentLevel - totalOut * 0.0167);
      r.currentLevel = Math.min(r.capacity, r.currentLevel + 500 * 0.0017);
    });

    // 4. Set reservoir nodes pressure
    this.reservoirs.forEach((r) => {
      const firstPipe = this.pipes.find((p) => p.source === r.id);
      if (firstPipe) {
        const node = this.nodes.find((n) => n.id === firstPipe.target);
        if (node) {
          node.pressure = Math.min(150, node.pressure + (r.outputPressure - node.pressure) * 0.05);
        }
      }
    });

    // 5. Build active pipe list (exclude blocked for pressure calculation)
    const activePipes = this.pipes.filter((p) => p.status !== 'blocked');

    // 6. Propagate pressure through network (using only active pipes)
    for (let iter = 0; iter < 3; iter++) {
      this.nodes.forEach((node) => {
        const oldPressure = node.pressure;
        const newPressure = calculatePressure(node, this.nodes, activePipes, this.zones);
        node.pressure = node.pressure + (newPressure - node.pressure) * 0.3;
        if (iter === 2) {
          this._debug('PRESSURE', `${node.id}: ${oldPressure.toFixed(1)} → ${node.pressure.toFixed(1)} PSI`);
        }
      });
    }

    // 7. Apply pressure drop to isolated nodes (connected only via blocked pipes)
    this.nodes.forEach((node) => {
      const connectedPipes = this.pipes.filter(
        (p) => (p.source === node.id || p.target === node.id) && p.status !== 'blocked'
      );
      if (connectedPipes.length === 0) {
        // Node isolated — sharp pressure drop
        node.pressure = Math.max(10, node.pressure - 20);
      }
    });

    // 8. Calculate flows through pipes (blocked pipes HARD zero)
    this.pipes.forEach((pipe) => {
      if (pipe.status === 'blocked') {
        pipe.flowRate = 0;
        this._debug('PIPE', `${pipe.id} BLOCKED → flow = 0`);
        return;
      }
      const srcNode = this.findNode(pipe.source);
      const tgtNode = this.findNode(pipe.target);
      if (srcNode && tgtNode) {
        const oldFlow = pipe.flowRate;
        const newFlow = calculateFlow(pipe, srcNode, tgtNode, this.valves);
        pipe.flowRate = pipe.flowRate + (newFlow - pipe.flowRate) * 0.2;
        this._debug('FLOW', `${pipe.id}: ${oldFlow.toFixed(1)} → ${pipe.flowRate.toFixed(1)}`);
      }
    });

    // 9. Persistent leak effect — 'leak' pipes continuously drain pressure and reduce flow.
    // createLeak() marks pipes; this keeps the effect alive every tick so physics can't recover.
    this.pipes.forEach((pipe) => {
      if (pipe.status !== 'leak') return;
      pipe.flowRate *= 0.7; // 30% of flow escapes at the rupture
      const nA = this.nodes.find((n) => n.id === pipe.source);
      const nB = this.nodes.find((n) => n.id === pipe.target);
      if (nA) nA.pressure = Math.max(10, nA.pressure - 1.5);
      if (nB) nB.pressure = Math.max(10, nB.pressure - 1.5);
    });

    // 10. Calculate supply to zones (only count active pipes).
    // tankerSupply is set each tanker-tick by TankerManager and held constant until
    // the next tanker-tick (no per-engine-tick decay — that was causing tanker to have zero effect).
    this.zones.forEach((zone) => {
      const node = this.nodes.find((n) => n.id === zone.connectedNode);
      if (node) {
        const incomingPipes = activePipes.filter((p) => p.target === node.id);
        const totalIncoming = incomingPipes.reduce((s, p) => s + Math.max(0, p.flowRate), 0);
        const networkSupply = Math.min(zone.demandCurrent, totalIncoming);
        zone.supplyCurrent = Math.min(
          zone.demandCurrent,
          networkSupply + (zone.tankerSupply || 0)
        );

        // If no active pipes AND no tanker → zero supply
        if (incomingPipes.length === 0 && !zone.tankerSupply) {
          zone.supplyCurrent = 0;
        }
      }
    });

    // 11. Update node flow readings (only active pipes)
    this.nodes.forEach((node) => {
      const connPipes = activePipes.filter(
        (p) => p.source === node.id || p.target === node.id
      );
      node.flow = connPipes.reduce((s, p) => s + Math.abs(p.flowRate), 0) / 2;
    });

    // 12. Update sensor values on nodes
    this.nodes.forEach((node) => {
      if (node.sensors) {
        node.sensors.pressure = { ...node.sensors.pressure, value: Math.round(node.pressure * 10) / 10 };
        node.sensors.flow = { ...node.sensors.flow, value: Math.round(node.flow * 10) / 10 };
      }
    });

    // 13. Update pollution effects on river
    this.updatePollution();

    // 14. Asset aging degradation (every 10th tick to reduce overhead)
    if (!this.tickCounter) this.tickCounter = 0;
    this.tickCounter++;
    if (this.tickCounter % 10 === 0) {
      pipeAgingManager.tick(this.pipes, this.valves, this.nodes);
    }

    this.notifyListeners();
  }

  /**
   * Auto-rerouting: detect blocked pipes, find alternate paths, boost valves on alternate routes.
   */
  autoReroute() {
    const blockedPipes = this.pipes.filter((p) => p.status === 'blocked');
    if (blockedPipes.length === 0) {
      this.rerouteInfo = null;
      return;
    }

    // Build graph excluding blocked pipes
    const activePipes = this.pipes.filter((p) => p.status !== 'blocked');
    const graph = buildNetworkGraph(activePipes, this.nodes, this.valves);

    for (const pipe of blockedPipes) {
      // Find zones affected by this blockage
      const affectedZones = this.zones.filter(
        (z) => z.connectedNode && z.supplyCurrent < z.demandCurrent * 0.8
      );

      for (const zone of affectedZones) {
        // Try to find alternate path from any reservoir to zone
        for (const reservoir of this.reservoirs) {
          const path = bfsPath(reservoir.id, zone.connectedNode, graph);
          if (path.length >= 2) {
            // Found alternate path — boost valves along this path
            const pathValves = [];
            for (let i = 0; i < path.length - 1; i++) {
              const valve = this.valves.find(
                (v) => v.connected.includes(path[i]) && v.connected.includes(path[i + 1])
              );
              if (valve && valve.mode === 'auto' && valve.openPercentage < 95) {
                valve.openPercentage = Math.min(100, valve.openPercentage + 15);
                pathValves.push(valve.id);
              }
            }

            // Store reroute info for visualization
            this.rerouteInfo = {
              blockedPipe: pipe.id,
              alternatePath: path,
              valvesAdjusted: pathValves,
              targetZone: zone.id,
            };

            console.log(`[AUTO-REROUTE] Blocked ${pipe.id}, alternate path found: ${path.join(' → ')}`);
            this._debug('REROUTE', {
              blockedPipe: pipe.id,
              alternatePath: path,
              valvesAdjusted: pathValves,
              targetZone: zone.id
            });
            break;
          }
        }
      }
    }
  }

  updatePollution() {
    const industrials = this.zones.filter((z) => z.wastewater);

    // Calculate total river pollution from all industrial discharges
    let riverPollutionLevel = 0;
    industrials.forEach((ind) => {
      if (!ind.wastewater) return;
      riverPollutionLevel += ind.wastewater.pollutionLevel || 0;
    });

    // Average pollution if multiple sources
    if (industrials.length > 0) {
      riverPollutionLevel = riverPollutionLevel / industrials.length;
    }

    // Update river sections based on pollution level
    this.rivers.forEach((river) => {
      river.pollutionLevel = riverPollutionLevel;
      river.sections.forEach((section) => {
        if (section.id === 'RIVER_DOWNSTREAM' || riverPollutionLevel > 40) {
          section.quality = riverPollutionLevel > 70 ? 'heavily_polluted' : riverPollutionLevel > 50 ? 'polluted' : 'moderate';
        } else {
          section.quality = 'clean';
        }
      });
    });

    // Propagate pollution to downstream nodes
    if (riverPollutionLevel > 50) {
      // Find nodes near polluted river sections
      const pollutedSections = this.rivers.flatMap(r => r.sections).filter(s => s.quality === 'polluted' || s.quality === 'heavily_polluted');

      pollutedSections.forEach(() => {
        // Mark downstream nodes as contaminated
        this.nodes.forEach((node) => {
          // Simplified: nodes with low elevation or near river y-coordinate
          const nearRiver = Math.abs(node.position.y - 380) < 100;
          if (nearRiver && node.position.x > 600) {
            node.waterQuality = 'poor';
          }
        });
      });
    }

    // Update zones connected to contaminated nodes
    this.zones.forEach((zone) => {
      const connNode = this.nodes.find((n) => n.id === zone.connectedNode);
      if (connNode && connNode.waterQuality === 'poor') {
        zone.waterQuality = 'poor';
        zone.affectedBy = ['river_pollution'];
      } else if (zone.waterSource === 'RIVER_DOWNSTREAM' && riverPollutionLevel > 50) {
        zone.waterQuality = 'poor';
        zone.affectedBy = ['river_discharge'];
      } else {
        // Reset if pollution cleared
        if (!zone.affectedBy || zone.affectedBy.length === 0) {
          zone.waterQuality = 'good';
        }
      }
    });
  }

  findNode(id) {
    const node = this.nodes.find((n) => n.id === id);
    if (node) return node;
    const res = this.reservoirs.find((r) => r.id === id);
    if (res) return { id: res.id, pressure: res.outputPressure, flow: 0 };
    const valve = this.valves.find((v) => v.id === id);
    if (valve) {
      const connNodes = valve.connected
        .map((cid) => this.nodes.find((n) => n.id === cid))
        .filter(Boolean);
      const avgPressure =
        connNodes.reduce((s, n) => s + n.pressure, 0) / (connNodes.length || 1);
      return { id: valve.id, pressure: avgPressure, flow: 0 };
    }
    return null;
  }

  // --- State modification ---

  setValveOpening(valveId, percentage) {
    const valve = this.valves.find((v) => v.id === valveId);
    if (valve) {
      valve.openPercentage = Math.max(0, Math.min(100, percentage));
      console.log(`[ENGINE] Valve ${valveId} opening → ${valve.openPercentage}%`);

      // IMMEDIATE SYSTEM RECALCULATION
      this._triggerSystemRecalc(valveId);
    }
  }

  setValveMode(valveId, mode) {
    const valve = this.valves.find((v) => v.id === valveId);
    if (valve) {
      valve.mode = mode;
      console.log(`[ENGINE] Valve ${valveId} mode → ${mode.toUpperCase()}`);
    }
  }

  /**
   * Full system recalculation after valve change.
   * Propagates: Valve → Pipe Flow → Node Pressure → Zone Supply
   */
  _triggerSystemRecalc(valveId) {
    const valve = this.valves.find(v => v.id === valveId);
    if (!valve) return;

    // Find affected pipes
    const affectedPipes = this.pipes.filter(p =>
      valve.connected.includes(p.source) || valve.connected.includes(p.target)
    );

    // Recalc flows through affected pipes
    affectedPipes.forEach(pipe => {
      if (pipe.status === 'blocked') {
        pipe.flowRate = 0;
        return;
      }
      const srcNode = this.findNode(pipe.source);
      const tgtNode = this.findNode(pipe.target);
      if (srcNode && tgtNode) {
        const newFlow = calculateFlow(pipe, srcNode, tgtNode, this.valves);
        pipe.flowRate = newFlow;
      }
    });

    // Find affected nodes (connected to changed pipes)
    const affectedNodeIds = new Set();
    affectedPipes.forEach(p => {
      affectedNodeIds.add(p.source);
      affectedNodeIds.add(p.target);
    });

    // Propagate pressure through affected nodes (3 iterations)
    for (let iter = 0; iter < 3; iter++) {
      affectedNodeIds.forEach(nodeId => {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
          const newPressure = calculatePressure(node, this.nodes, this.pipes, this.zones);
          node.pressure = node.pressure + (newPressure - node.pressure) * 0.3;
        }
      });
    }

    // Find affected zones (connected to changed nodes)
    const affectedZones = this.zones.filter(z => affectedNodeIds.has(z.connectedNode));

    // Recalc zone supply
    affectedZones.forEach(zone => {
      const node = this.nodes.find(n => n.id === zone.connectedNode);
      if (node) {
        const activePipes = this.pipes.filter(p => p.status !== 'blocked');
        const incomingPipes = activePipes.filter(p => p.target === node.id);
        const totalIncoming = incomingPipes.reduce((s, p) => s + Math.max(0, p.flowRate), 0);
        const networkSupply = Math.min(zone.demandCurrent, totalIncoming);
        zone.supplyCurrent = Math.min(
          zone.demandCurrent,
          networkSupply + (zone.tankerSupply || 0)
        );

        if (incomingPipes.length === 0 && !zone.tankerSupply) {
          zone.supplyCurrent = 0;
        }
      }
    });

    console.log(`[SYSTEM RECALC]`, {
      valve: valveId,
      opening: valve.openPercentage,
      affectedPipes: affectedPipes.map(p => p.id),
      affectedNodes: Array.from(affectedNodeIds),
      affectedZones: affectedZones.map(z => `${z.id} (${z.supplyCurrent}/${z.demandCurrent})`),
    });

    this.notifyListeners();
  }

  blockPipe(pipeId) {
    const pipe = this.pipes.find((p) => p.id === pipeId);
    if (pipe) {
      pipe.status = 'blocked';
      pipe.blockagePercent = 100;
      pipe.flowRate = 0;
      console.log(`[ENGINE] Pipe ${pipeId} → BLOCKED`);
      this._fullSystemRecalc();
    }
  }

  unblockPipe(pipeId) {
    const pipe = this.pipes.find((p) => p.id === pipeId);
    if (pipe) {
      pipe.status = 'normal';
      pipe.blockagePercent = 0;
      console.log(`[ENGINE] Pipe ${pipeId} → UNBLOCKED`);
      this._fullSystemRecalc();
    }
  }

  createLeak(nodeId) {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) node.pressure *= 0.6;
    // Mark adjacent pipes as 'leak' — step 5b will keep draining every tick
    this.pipes
      .filter((p) => p.source === nodeId || p.target === nodeId)
      .forEach((p) => { p.status = 'leak'; });
    console.log(`[ENGINE] Leak created at ${nodeId}`);
    this._fullSystemRecalc();
  }

  // Repair a leak (called by AutoFixEngine after enough recovery ticks)
  repairLeak(nodeId) {
    this.pipes
      .filter((p) => (p.source === nodeId || p.target === nodeId) && p.status === 'leak')
      .forEach((p) => { p.status = 'normal'; });
    console.log(`[ENGINE] Leak repaired at ${nodeId}`);
    this._fullSystemRecalc();
  }

  surgeDemand(zoneId, multiplier) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (zone) {
      zone.demandCurrent = Math.round(zone.demandBase * multiplier);
      console.log(`[ENGINE] Demand surge at ${zoneId} → ${zone.demandCurrent}`);
      this._fullSystemRecalc();
    }
  }

  /**
   * Full system recalculation (all nodes, all zones).
   * Used after major state changes (block/unblock/leak/surge).
   */
  _fullSystemRecalc() {
    console.log('[FULL SYSTEM RECALC] Rebuilding network state...');

    const activePipes = this.pipes.filter((p) => p.status !== 'blocked');

    // Recalc all pipe flows
    this.pipes.forEach((pipe) => {
      if (pipe.status === 'blocked') {
        pipe.flowRate = 0;
        return;
      }
      const srcNode = this.findNode(pipe.source);
      const tgtNode = this.findNode(pipe.target);
      if (srcNode && tgtNode) {
        const newFlow = calculateFlow(pipe, srcNode, tgtNode, this.valves);
        pipe.flowRate = newFlow;
      }
    });

    // Recalc all node pressures (3 iterations)
    for (let iter = 0; iter < 3; iter++) {
      this.nodes.forEach((node) => {
        const newPressure = calculatePressure(node, this.nodes, activePipes, this.zones);
        node.pressure = node.pressure + (newPressure - node.pressure) * 0.3;
      });
    }

    // Recalc all zone supply
    this.zones.forEach((zone) => {
      const node = this.nodes.find((n) => n.id === zone.connectedNode);
      if (node) {
        const incomingPipes = activePipes.filter((p) => p.target === node.id);
        const totalIncoming = incomingPipes.reduce((s, p) => s + Math.max(0, p.flowRate), 0);
        const networkSupply = Math.min(zone.demandCurrent, totalIncoming);
        zone.supplyCurrent = Math.min(
          zone.demandCurrent,
          networkSupply + (zone.tankerSupply || 0)
        );

        if (incomingPipes.length === 0 && !zone.tankerSupply) {
          zone.supplyCurrent = 0;
        }
      }
    });

    console.log('[FULL SYSTEM RECALC] Complete');
    this.notifyListeners();
  }

  setReservoirLevel(reservoirId, level) {
    const res = this.reservoirs.find((r) => r.id === reservoirId);
    if (res) res.currentLevel = Math.max(0, Math.min(res.capacity, level));
  }

  setPollutionLevel(zoneId, level) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (zone && zone.wastewater) zone.wastewater.pollutionLevel = level;
  }

  // getState() returns live references — mutations to nodes/pipes/zones are immediately
  // visible to anyone holding this reference (used for consistent cross-module state).
  getState() {
    return {
      nodes: this.nodes,
      pipes: this.pipes,
      valves: this.valves,
      reservoirs: this.reservoirs,
      zones: this.zones,
      treatmentPlants: this.treatmentPlants,
      rivers: this.rivers,
      rerouteInfo: this.rerouteInfo,
    };
  }

  addListener(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  }

  notifyListeners() {
    this.listeners.forEach((fn) => fn(this.getState()));
  }
}
