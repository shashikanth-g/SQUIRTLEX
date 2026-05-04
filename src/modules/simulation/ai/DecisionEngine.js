// DecisionEngine.js — AI decision engine for water redistribution and auto-fixing
import { findAlternativeRoutes } from '@sim/pathfinding/FlowRouter.js';
import { dijkstra } from '@sim/pathfinding/Dijkstra.js';

/**
 * Generate a redistribution plan to fix supply-demand anomalies.
 */
export function generateRedistributionPlan(anomalies, state) {
  const { nodes, pipes, valves, reservoirs, zones } = state;
  const plan = {
    id: `PLAN_${Date.now()}`,
    timestamp: Date.now(),
    actions: [],
    analysis: [],
    expectedImpact: [],
    confidence: 0,
    problem: null,
  };

  const underSupply = anomalies.filter((a) => a.type === 'UNDER_SUPPLY');
  const overSupply = anomalies.filter((a) => a.type === 'OVER_SUPPLY');
  const blockages = anomalies.filter((a) => a.type === 'BLOCKAGE');
  const pressureIssues = anomalies.filter((a) => a.type === 'PRESSURE_IMBALANCE');

  // --- Handle blockages first ---
  blockages.forEach((blockage) => {
    const reroutes = findAlternativeRoutes(blockage.pipeId, state);
    plan.problem = `Pipe ${blockage.pipeId} is blocked, cutting water supply`;
    plan.analysis.push(`✓ Blockage confirmed in pipe ${blockage.pipeId}`);

    reroutes.forEach((route) => {
      if (route.alternativePath.length > 0) {
        plan.analysis.push(`✓ Alternative path found for ${route.zoneName}: ${route.alternativePath.join(' → ')}`);
        route.valvesToOpen.forEach((vId) => {
          const valve = valves.find((v) => v.id === vId);
          if (valve) {
            plan.actions.push({
              type: 'ADJUST_VALVE',
              valveId: vId,
              currentOpen: valve.openPercentage,
              targetOpen: Math.min(100, valve.openPercentage + 20),
              reason: `Open ${vId} to reroute water to ${route.zoneName}`,
            });
          }
        });
        plan.expectedImpact.push(`✓ ${route.zoneName} supply restored via alternate route`);
        plan.expectedImpact.push(`✓ Prevents outage for ${route.affectedPopulation.toLocaleString()} people`);
      } else {
        plan.analysis.push(`⚠ No alternative path found for ${route.zoneName}`);
        plan.expectedImpact.push(`✗ ${route.zoneName} requires emergency tanker dispatch`);
      }
    });
  });

  // --- Handle supply/demand imbalances ---
  if (underSupply.length > 0) {
    // Find zones with surplus capacity
    const surplusZones = zones.filter((z) => z.supplyCurrent > z.demandCurrent * 1.1);

    underSupply.forEach((deficit) => {
      const defZone = zones.find((z) => z.id === deficit.zoneId);
      if (!defZone) return;

      plan.problem = plan.problem ||
        `${defZone.name} under-supplied by ${deficit.gap} L/min. ${deficit.affectedPopulation.toLocaleString()} people affected.`;

      surplusZones.forEach((surZone) => {
        const activePipes = pipes.filter((p) => p.status !== 'blocked');
        const path = dijkstra(surZone.connectedNode, defZone.connectedNode, activePipes, nodes);

        if (path.length > 0) {
          plan.analysis.push(`✓ ${surZone.name} has ${Math.round(surZone.supplyCurrent - surZone.demandCurrent)} L/min surplus`);
          plan.analysis.push(`✓ Path exists: ${path.join(' → ')}`);

          // Find valves along the path
          for (let i = 0; i < path.length - 1; i++) {
            const valve = valves.find(
              (v) => v.connected.includes(path[i]) && v.connected.includes(path[i + 1])
            );
            if (valve && valve.mode === 'auto') {
              const transferAmount = Math.min(
                Math.abs(surZone.supplyCurrent - surZone.demandCurrent),
                deficit.gap
              );
              const targetOpen = calculateOptimalOpening(
                valve.openPercentage,
                transferAmount,
                valve.flowCapacity
              );
              plan.actions.push({
                type: 'ADJUST_VALVE',
                valveId: valve.id,
                currentOpen: valve.openPercentage,
                targetOpen,
                reason: `Transfer ~${transferAmount} L/min from ${surZone.name} to ${defZone.name}`,
              });
              plan.analysis.push(`✓ ${valve.id} currently at ${valve.openPercentage}%, can adjust to ${targetOpen}%`);
            }
          }

          plan.expectedImpact.push(`✓ ${defZone.name} supply restored to ~${Math.min(100, Math.round((defZone.supplyCurrent + deficit.gap * 0.7) / defZone.demandCurrent * 100))}%`);
          plan.expectedImpact.push(`✓ Prevents outage for ${deficit.affectedPopulation.toLocaleString()} people`);
        }
      });
    });
  }

  // --- Handle pressure imbalances ---
  pressureIssues.forEach((issue) => {
    if (issue.suggestedValve) {
      const valve = valves.find((v) => v.id === issue.suggestedValve);
      if (valve && valve.mode === 'auto') {
        plan.actions.push({
          type: 'ADJUST_VALVE',
          valveId: valve.id,
          currentOpen: valve.openPercentage,
          targetOpen: Math.max(30, valve.openPercentage - 15),
          reason: `Balance pressure between ${issue.nodes.join(' and ')} (gap: ${Math.round(issue.difference)} PSI)`,
        });
        plan.expectedImpact.push(`✓ Stabilizes pressure between ${issue.nodes.join(' and ')}`);
      }
    }
  });

  // Calculate overall confidence
  plan.confidence = calculateConfidence(plan.actions, anomalies);

  return plan;
}

function calculateOptimalOpening(currentOpen, transferAmount, maxCapacity) {
  const additionalFlow = transferAmount;
  const additionalPct = (additionalFlow / maxCapacity) * 100;
  return Math.max(10, Math.min(100, Math.round(currentOpen + additionalPct)));
}

function calculateConfidence(actions, anomalies) {
  if (actions.length === 0) return 0;
  const hasAllFixes = anomalies.every((a) => a.autoFixAvailable);
  const base = hasAllFixes ? 85 : 60;
  const actionBonus = Math.min(15, actions.length * 3);
  return Math.min(98, base + actionBonus);
}

/**
 * Execute a plan's actions on the engine.
 */
export function executePlan(plan, engine) {
  const results = [];
  plan.actions.forEach((action) => {
    if (action.type === 'ADJUST_VALVE') {
      engine.setValveOpening(action.valveId, action.targetOpen);
      results.push({
        action: action.type,
        valveId: action.valveId,
        success: true,
        from: action.currentOpen,
        to: action.targetOpen,
      });
    }
  });
  return results;
}
