// FallbackStrategies.js — Multi-tier action strategies with intelligent fallbacks

import { tankerManager } from '@sim/engine/TankerManager.js';
import { buildNetworkGraph, bfsPath } from '@sim/engine/NetworkGraph.js';

/**
 * Get all possible actions for an issue type, ordered by preference.
 * Returns array of strategy objects with condition checks.
 */
export function getActionStrategies(issue, state) {
  const { valves, zones, nodes, pipes, reservoirs } = state;

  switch (issue.type) {
    case 'PRESSURE_IMBALANCE': {
      const strategies = [];
      const vid = issue.suggestedValve;
      const v = valves.find((v) => v.id === vid);

      // Strategy 1: Throttle suggested valve
      if (v && v.mode === 'auto' && v.openPercentage > 30) {
        strategies.push({
          priority: 1,
          type: 'ADJUST_VALVE',
          valveId: vid,
          targetOpen: Math.max(30, v.openPercentage - 12),
          reason: `Throttle ${vid} to balance pressure`,
          condition: () => v.openPercentage > 30,
        });
      }

      // Strategy 2: Fallback to any auto valve
      const autoV = valves.find((v) => v.mode === 'auto' && v.openPercentage > 40);
      if (autoV) {
        strategies.push({
          priority: 2,
          type: 'ADJUST_VALVE',
          valveId: autoV.id,
          targetOpen: Math.max(35, autoV.openPercentage - 10),
          reason: `Fallback valve adjustment ${autoV.id}`,
          condition: () => autoV.openPercentage > 40,
        });
      }

      return strategies;
    }

    case 'UNDER_SUPPLY': {
      const strategies = [];
      const zoneId = issue.zoneId || issue.location?.zoneId;
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return [];

      // Strategy 1: Open nearby valve
      const nearValve = valves.find(
        (v) => v.mode === 'auto' &&
               v.connected.includes(zone.connectedNode) &&
               v.openPercentage < 90
      );
      if (nearValve) {
        strategies.push({
          priority: 1,
          type: 'ADJUST_VALVE',
          valveId: nearValve.id,
          targetOpen: Math.min(100, nearValve.openPercentage + 20),
          reason: `Boost supply to ${zone.name} via ${nearValve.id}`,
          condition: () => nearValve.openPercentage < 95,
        });
      }

      // Strategy 2: Dispatch tanker (if not already serving)
      if (!tankerManager.isServingZone(zoneId)) {
        strategies.push({
          priority: 2,
          type: 'DISPATCH_TANKER',
          zoneId,
          zonePosition: zone.position,
          reason: `Emergency tanker to ${zone.name}`,
          condition: () => !tankerManager.isServingZone(zoneId),
        });
      }

      // Strategy 3: Reroute from surplus zones
      const surplusZone = zones.find(
        (z) => z.id !== zoneId &&
               z.supplyCurrent > z.demandCurrent * 1.15 &&
               z.connectedNode
      );
      if (surplusZone) {
        strategies.push({
          priority: 3,
          type: 'REROUTE_SURPLUS',
          fromZone: surplusZone.id,
          toZone: zoneId,
          reason: `Transfer surplus from ${surplusZone.name} to ${zone.name}`,
          condition: () => true,
        });
      }

      return strategies;
    }

    case 'BLOCKAGE': {
      const strategies = [];
      const pid = issue.pipeId || issue.location?.pipeId;
      if (!pid) return [];

      // Strategy 1: Find alternate path + open valve
      const altPipes = pipes.filter((p) => p.id !== pid && p.status !== 'blocked');
      const graph = buildNetworkGraph(altPipes, nodes, valves);
      const cutZone = zones.find(
        (z) => z.connectedNode && z.demandCurrent > 0 && z.supplyCurrent < z.demandCurrent * 0.8
      );

      if (cutZone && reservoirs[0]) {
        const path = bfsPath(reservoirs[0].id, cutZone.connectedNode, graph);
        if (path.length >= 2) {
          for (let i = 0; i < path.length - 1; i++) {
            const altV = valves.find(
              (v) => v.mode === 'auto' &&
                     v.connected.includes(path[i]) &&
                     v.connected.includes(path[i + 1]) &&
                     v.openPercentage < 90
            );
            if (altV) {
              strategies.push({
                priority: 1,
                type: 'ADJUST_VALVE',
                valveId: altV.id,
                targetOpen: Math.min(100, altV.openPercentage + 30),
                reason: `Reroute around ${pid} via ${altV.id}`,
                condition: () => altV.openPercentage < 95,
              });
              break;
            }
          }
        }
      }

      // Strategy 2: Emergency tanker
      if (cutZone && !tankerManager.isServingZone(cutZone.id)) {
        strategies.push({
          priority: 2,
          type: 'DISPATCH_TANKER',
          zoneId: cutZone.id,
          zonePosition: cutZone.position,
          reason: `No alternate path for ${cutZone.name}`,
          condition: () => !tankerManager.isServingZone(cutZone.id),
        });
      }

      // Strategy 3: Fallback valve open
      const autoV = valves.filter((v) => v.mode === 'auto').sort((a, b) => a.openPercentage - b.openPercentage)[0];
      if (autoV) {
        strategies.push({
          priority: 3,
          type: 'ADJUST_VALVE',
          valveId: autoV.id,
          targetOpen: Math.min(100, autoV.openPercentage + 25),
          reason: `General flow boost around ${pid}`,
          condition: () => true,
        });
      }

      return strategies;
    }

    case 'LOW_RESERVOIR': {
      return [
        {
          priority: 1,
          type: 'CONSERVE_FLOW',
          reason: 'Reservoir conservation mode',
          condition: () => true,
        },
      ];
    }

    case 'ASSET_AGING': {
      const strategies = [];

      if (issue.assetType === 'pipe' && issue.pipeId) {
        const pipe = pipes.find(p => p.id === issue.pipeId);
        if (!pipe) return [];

        // Reduce pressure on aging pipe
        const nearValves = valves.filter(v =>
          v.mode === 'auto' &&
          (v.connected.includes(pipe.source) || v.connected.includes(pipe.target))
        );

        nearValves.forEach(v => {
          if (v.openPercentage > 50) {
            strategies.push({
              priority: 1,
              type: 'ADJUST_VALVE',
              valveId: v.id,
              targetOpen: Math.max(40, v.openPercentage - 20),
              reason: `Reduce stress on aging ${issue.pipeId}`,
              condition: () => v.openPercentage > 50,
            });
          }
        });

        strategies.push({
          priority: 2,
          type: 'REROUTE_SURPLUS',
          pipeId: issue.pipeId,
          reason: `Divert flow from aging ${issue.pipeId}`,
          condition: () => true,
        });
      }

      if (issue.assetType === 'valve' && issue.valveId) {
        // For aging valves: reduce usage, reroute around
        strategies.push({
          priority: 1,
          type: 'ADJUST_VALVE',
          valveId: issue.valveId,
          targetOpen: 50, // Set to safe mid-position
          reason: `Reduce wear on aging ${issue.valveId}`,
          condition: () => true,
        });
      }

      return strategies;
    }

    case 'MID_PIPE_BLOCKAGE': {
      const strategies = [];
      const pipeId = issue.pipeId;

      // Same as BLOCKAGE: reroute + tanker
      const altPipes = pipes.filter((p) => p.id !== pipeId && p.status !== 'blocked');
      const graph = buildNetworkGraph(altPipes, nodes, valves);
      const cutZone = zones.find(
        (z) => z.connectedNode && z.demandCurrent > 0 && z.supplyCurrent < z.demandCurrent * 0.8
      );

      if (cutZone && reservoirs[0]) {
        const path = bfsPath(reservoirs[0].id, cutZone.connectedNode, graph);
        if (path.length >= 2) {
          for (let i = 0; i < path.length - 1; i++) {
            const altV = valves.find(
              (v) => v.mode === 'auto' &&
                     v.connected.includes(path[i]) &&
                     v.connected.includes(path[i + 1]) &&
                     v.openPercentage < 90
            );
            if (altV) {
              strategies.push({
                priority: 1,
                type: 'ADJUST_VALVE',
                valveId: altV.id,
                targetOpen: Math.min(100, altV.openPercentage + 30),
                reason: `Reroute around ${pipeId} segment ${issue.segment}`,
                condition: () => altV.openPercentage < 95,
              });
              break;
            }
          }
        }
      }

      if (cutZone && !tankerManager.isServingZone(cutZone.id)) {
        strategies.push({
          priority: 2,
          type: 'DISPATCH_TANKER',
          zoneId: cutZone.id,
          zonePosition: cutZone.position,
          reason: `Emergency supply for ${cutZone.name}`,
          condition: () => !tankerManager.isServingZone(cutZone.id),
        });
      }

      return strategies;
    }

    case 'MID_PIPE_LEAK': {
      const strategies = [];
      const pipeId = issue.pipeId;
      const pipe = pipes.find(p => p.id === pipeId);
      if (!pipe) return [];

      // Strategy 1: Reduce pressure to slow leak
      const nearValves = valves.filter(v =>
        v.mode === 'auto' &&
        (v.connected.includes(pipe.source) || v.connected.includes(pipe.target))
      );

      nearValves.forEach(v => {
        if (v.openPercentage > 30) {
          strategies.push({
            priority: 1,
            type: 'ADJUST_VALVE',
            valveId: v.id,
            targetOpen: Math.max(20, v.openPercentage - 25),
            reason: `Reduce pressure at ${pipeId} leak`,
            condition: () => v.openPercentage > 30,
          });
        }
      });

      // Strategy 2: Isolate pipe if critical
      if (issue.severity === 'critical') {
        nearValves.forEach(v => {
          strategies.push({
            priority: 2,
            type: 'CLOSE_VALVE',
            valveId: v.id,
            reason: `Isolate critical leak in ${pipeId}`,
            condition: () => true,
          });
        });
      }

      return strategies;
    }

    case 'WATER_QUALITY': {
      const strategies = [];
      const nodeId = issue.nodeId;
      if (!nodeId) return [];

      // Strategy 1: Isolate contaminated node
      const upValve = valves.find(
        (v) => v.mode === 'auto' && v.connected.includes(nodeId) && v.openPercentage > 15
      );
      if (upValve) {
        strategies.push({
          priority: 1,
          type: 'ADJUST_VALVE',
          valveId: upValve.id,
          targetOpen: 5,
          reason: `Isolate contaminated ${nodeId}`,
          condition: () => upValve.openPercentage > 10,
        });
      }

      // Strategy 2: Dispatch clean water tanker
      const affectedZone = zones.find((z) => z.connectedNode === nodeId);
      if (affectedZone && !tankerManager.isServingZone(affectedZone.id)) {
        strategies.push({
          priority: 2,
          type: 'DISPATCH_TANKER',
          zoneId: affectedZone.id,
          zonePosition: affectedZone.position,
          reason: `Clean water to ${affectedZone.name}`,
          condition: () => !tankerManager.isServingZone(affectedZone.id),
        });
      }

      return strategies;
    }

    case 'POLLUTION': {
      const strategies = [];
      const zoneId = issue.zoneId;
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return [];

      // Strategy 1: Isolate upstream valve (stop contaminated water)
      const upValve = valves.find(
        (v) => v.mode === 'auto' && v.connected.includes(zone.connectedNode) && v.openPercentage > 15
      );
      if (upValve) {
        strategies.push({
          priority: 1,
          type: 'ADJUST_VALVE',
          valveId: upValve.id,
          targetOpen: 5,
          reason: `Isolate contaminated source feeding ${zone.name}`,
          condition: () => upValve.openPercentage > 10,
        });
      }

      // Strategy 2: Dispatch clean water tanker
      if (!tankerManager.isServingZone(zoneId)) {
        strategies.push({
          priority: 2,
          type: 'DISPATCH_TANKER',
          zoneId,
          zonePosition: zone.position,
          reason: `Emergency clean water for ${zone.name}`,
          condition: () => !tankerManager.isServingZone(zoneId),
        });
      }

      return strategies;
    }

    case 'CONTAMINATION': {
      const strategies = [];
      const zoneId = issue.zoneId;
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return [];

      // Strategy 1: Redirect to treatment plant (primary)
      strategies.push({
        priority: 1,
        type: 'REDIRECT_TO_TREATMENT',
        zoneId,
        reason: `Redirect ${zone.name} contaminated water to treatment`,
        condition: () => true,
      });

      // Strategy 2: Dispatch tanker as backup
      if (!tankerManager.isServingZone(zoneId)) {
        strategies.push({
          priority: 2,
          type: 'DISPATCH_TANKER',
          zoneId,
          zonePosition: zone.position,
          reason: `Emergency clean water for ${zone.name} during treatment`,
          condition: () => !tankerManager.isServingZone(zoneId),
        });
      }

      return strategies;
    }

    case 'SEWAGE_INFLOW': {
      const strategies = [];
      const zoneId = issue.zoneId;
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return [];

      // Strategy 1: Isolate and treat (severe)
      strategies.push({
        priority: 1,
        type: 'ISOLATE_AND_TREAT',
        zoneId,
        reason: `Isolate ${zone.name} sewage discharge and send to treatment`,
        condition: () => true,
      });

      // Strategy 2: Fallback to treatment redirection
      strategies.push({
        priority: 2,
        type: 'REDIRECT_TO_TREATMENT',
        zoneId,
        reason: `Redirect ${zone.name} sewage to treatment plant`,
        condition: () => true,
      });

      // Strategy 3: Emergency tanker
      if (!tankerManager.isServingZone(zoneId)) {
        strategies.push({
          priority: 3,
          type: 'DISPATCH_TANKER',
          zoneId,
          zonePosition: zone.position,
          reason: `Emergency clean water for ${zone.name}`,
          condition: () => !tankerManager.isServingZone(zoneId),
        });
      }

      return strategies;
    }

    default:
      return [];
  }
}

/**
 * Get next fallback action after current one failed.
 */
export function getNextFallback(issue, state, failedActions = []) {
  const strategies = getActionStrategies(issue, state);
  const failedTypes = new Set(failedActions.map((a) => `${a.type}_${a.valveId || a.zoneId || ''}`));

  for (const strategy of strategies) {
    const key = `${strategy.type}_${strategy.valveId || strategy.zoneId || ''}`;
    if (failedTypes.has(key)) continue; // Skip already-tried actions

    // Check condition still valid
    if (strategy.condition && !strategy.condition()) continue;

    return strategy;
  }

  return null; // No more fallbacks
}
