import {
  computeLoadBalanceAdjustments,
  findSurplusZones,
  buildNetworkGraph,
  bfsPath,
} from '@sim/engine/NetworkGraph.js';
import { tankerManager } from '@sim/engine/TankerManager.js';
import { treatmentPlantManager } from '@sim/environment/TreatmentPlantManager.js';
import * as priorityEngine from '@ai/ai/PriorityEngine.js';
import { actionTracker } from '@ai/ai/ActionTracker.js';
import { getActionStrategies, getNextFallback } from '@ai/ai/FallbackStrategies.js';

const STABILITY_TICKS      = 3;  // Issue must be stable N ticks before resolving
const RECOVERY_CHECK_TICKS = 4;

let actionIdCounter = 1;

class AutoFixEngine {
  constructor() {
    this.activeActions = new Map(); // issueKey → ActionRecord
    this.stabilityCounters = new Map(); 
    this.completedLog  = [];
  }

  processTick(activeIssues, state, engine) {
    // 1. 🧠 ENFORCE PRIORITY ENGINE
    const prioritized = priorityEngine.rank(activeIssues.filter(
      (i) => i.lifecycle === 'validated' || i.lifecycle === 'in_progress'
    ));
    
    console.log(`[PRIORITY ENGINE] Processing ${prioritized.length} issues`);
    
    const issue = prioritized[0];
    if (!issue) return [];

    console.log(`[PRIORITY SELECTED] ${issue.id} | Priority Score: ${issue.priorityScore}`);

    // Skip if already being handled
    if (this.activeActions.has(issue.key)) {
      this._monitorActionIntelligent(issue, state, engine);
      return [];
    }

    // 2. 🚫 STOP ACTION SPAM + 🔁 REAL FALLBACK EXECUTION
    const strategies = getActionStrategies(issue, state);
    let actionTaken = null;

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];

      if (actionTracker.wasRecentlyTried(issue.id, strategy.type)) {
        console.log('[SKIP] Action already attempted recently:', strategy.type);
        continue;
      }

      console.log('[ACTION ATTEMPTED]', strategy.type);
      const success = this._applyAction(strategy, engine, state, issue);
      
      // Record attempt in memory
      actionTracker.record(issue.id, strategy.type, success);

      if (success) {
        console.log('[ACTION SUCCESS]', strategy.type);
        actionTaken = strategy;
        issue.lifecycle = 'in_progress';
        
        const record = {
          id: `ACT_${String(actionIdCounter++).padStart(4, '0')}`,
          issueKey: issue.key,
          action: strategy,
          checkTick: 0
        };
        this.activeActions.set(issue.key, record);
        actionTracker.startTracking(issue.key, strategy, issue);
        break; 
      } else {
        console.log('[ACTION FAILED → RETRY]', strategy.type);
      }
    }

    if (!actionTaken && strategies.length > 0) {
      console.log(`[AUTOFIX] No viable fallback for ${issue.key}`);
    }

    return actionTaken ? [actionTaken] : [];
  }

  _monitorActionIntelligent(issue, state, engine) {
    const record = this.activeActions.get(issue.key);
    record.checkTick++;

    // Update action status on issue
    if (issue.activeAction && issue.activeAction.status === 'executing') {
      const elapsed = Date.now() - issue.activeAction.startedAt;

      // After 2 ticks (6s), mark as completing
      if (record.checkTick >= 2) {
        issue.activeAction.status = 'completing';
        console.log('[ACTION STATUS] executing → completing');
      }
    }

    actionTracker.updateTracking(issue.key, issue, state);

    // 4. ⏳ ISSUE LIFECYCLE + STABILITY CHECK
    if (record.checkTick >= RECOVERY_CHECK_TICKS) {
      const improving = actionTracker.isImproving(issue.key);

      if (improving) {
        const counter = this.stabilityCounters.get(issue.key) || 0;
        const newCount = counter + 1;
        this.stabilityCounters.set(issue.key, newCount);

        console.log(`[STABILITY CHECK] ${issue.key} stable ${newCount}/${STABILITY_TICKS}`);

        if (newCount >= STABILITY_TICKS) {
          // Mark action as completed
          if (issue.activeAction) {
            issue.activeAction.status = 'completed';
            issue.activeAction.completedAt = Date.now();
            console.log('[ACTION COMPLETED]', issue.activeAction.type);
          }

          issue.lifecycle = 'resolved';
          issue.resolvedAt = Date.now();
          console.log('[ISSUE STABILIZED → RESOLVED]', issue.id);

          this.activeActions.delete(issue.key);
          this.stabilityCounters.delete(issue.key);
          actionTracker.markSuccess(issue.key);
        }
      } else {
        console.log('[ACTION FAILED] No improvement detected for', issue.id);

        // Mark action as failed
        if (issue.activeAction) {
          issue.activeAction.status = 'failed';
          issue.activeAction.failedAt = Date.now();
        }

        this.activeActions.delete(issue.key);
        this.stabilityCounters.delete(issue.key);
        actionTracker.markFailure(issue.key, 'no_improvement');
        issue.lifecycle = 'validated'; // Allow retry with fallback
      }
    }
  }

  handlePrediction(prediction, engine, state) {
     console.log('[PREDICTIVE ACTION]', prediction.type);
     // Map prediction types to issues for fallback strategies
     const pseudoIssue = {
       id: `PRED_${prediction.id}`,
       key: `pred_${prediction.type}_${prediction.location}`,
       type: prediction.type,
       location: prediction.location,
       ...prediction
     };
     
     const strategies = getActionStrategies(pseudoIssue, state);
     if (strategies.length > 0) {
       this._applyAction(strategies[0], engine, state, pseudoIssue);
     }
  }

  /**
   * Execute action from UI AutoFix button click.
   * Returns action record or null if failed.
   */
  execute(issue, state, engine) {
    console.log('[AUTOFIX START]', issue.id);

    // Get action strategy for this issue type
    const strategies = getActionStrategies(issue, state);
    if (strategies.length === 0) {
      console.log('[AUTOFIX] No strategies available for', issue.id);
      return null;
    }

    const strategy = strategies[0]; // Use first strategy

    // Apply action
    const success = this._applyAction(strategy, engine, state, issue);
    if (!success) {
      console.log('[ACTION FAILED]', strategy.type);
      return null;
    }

    console.log('[ACTION EXECUTING]', strategy.type);

    // Store action on issue
    issue.activeAction = {
      type: strategy.type,
      status: 'executing',
      startedAt: Date.now(),
      details: strategy,
    };

    issue.lifecycle = 'in_progress';

    // Track for completion monitoring
    const record = {
      id: `ACT_${String(actionIdCounter++).padStart(4, '0')}`,
      issueKey: issue.key,
      action: strategy,
      checkTick: 0
    };
    this.activeActions.set(issue.key, record);
    actionTracker.startTracking(issue.key, strategy, issue);

    return issue.activeAction;
  }

  _applyAction(action, engine, state, issue) {
    try {
      switch (action.type) {
        case 'ADJUST_VALVE':
          engine.setValveOpening(action.valveId, action.targetOpen);
          console.log(`[ACTION] Valve ${action.valveId} → ${action.targetOpen}%`);
          return true;

        case 'DISPATCH_TANKER':
          const result = tankerManager.dispatch(action.zoneId, action.zonePosition);
          if (result) console.log(`[ACTION] Tanker dispatched to ${action.zoneId}`);
          return !!result;

        case 'CONSERVE_FLOW':
          state.valves.filter(v => v.mode === 'auto').forEach(v => {
            engine.setValveOpening(v.id, Math.max(20, v.openPercentage - 15));
          });
          console.log(`[ACTION] Flow conservation applied`);
          return true;

        case 'REROUTE_SURPLUS':
          const surplusZones = findSurplusZones(action.zoneId || issue.zoneId, state);
          if (surplusZones.length > 0) {
            console.log(`[ACTION] Reroute from ${surplusZones[0].id}`);
            return true;
          }
          return false;

        case 'CLOSE_VALVE':
          if (action.valveId) {
            engine.setValveOpening(action.valveId, 0);
            console.log(`[ACTION] Closed valve ${action.valveId} (leak isolation)`);
            return true;
          }
          return false;

        case 'ISOLATE_NODE':
          // Close all valves connected to node
          if (issue.nodeId) {
            const connectedValves = state.valves.filter(v =>
              v.connected.includes(issue.nodeId)
            );
            connectedValves.forEach(v => engine.setValveOpening(v.id, 0));
            console.log(`[ACTION] Isolated node ${issue.nodeId} (${connectedValves.length} valves closed)`);
            return connectedValves.length > 0;
          }
          return false;

        case 'REDIRECT_TO_TREATMENT':
          // Redirect contaminated zone to treatment plant
          if (issue.zoneId) {
            const zone = state.zones.find(z => z.id === issue.zoneId);
            if (zone) {
              zone.isContaminated = true;
              zone.redirectToTreatment = true;
              const originalSupply = zone.supply || zone.supplyCurrent || 0;
              zone.supply = Math.max(0, originalSupply * 0.3); // Reduce supply during treatment

              // Process through treatment plant
              const contaminationLevel = issue.contaminationLevel || 1;
              const flowToTreat = zone.supplyCurrent || 0;
              treatmentPlantManager.process(flowToTreat, contaminationLevel);

              console.log(`[ACTION] Zone ${issue.zoneId} redirected to treatment plant`);
              return true;
            }
          }
          return false;

        case 'ISOLATE_AND_TREAT':
          // Isolate zone AND send to treatment (severe contamination)
          if (issue.zoneId) {
            const zone = state.zones.find(z => z.id === issue.zoneId);
            if (zone) {
              // Close upstream valves
              const upstreamValves = state.valves.filter(v =>
                v.connected.includes(zone.nodeId || zone.id)
              );
              upstreamValves.forEach(v => engine.setValveOpening(v.id, 0));

              // Mark contaminated & isolated
              zone.isContaminated = true;
              zone.redirectToTreatment = true;
              zone.supply = 0;

              // Process through treatment
              const flowToTreat = zone.supplyCurrent || 0;
              treatmentPlantManager.process(flowToTreat, issue.contaminationLevel || 2);

              console.log(`[ACTION] Zone ${issue.zoneId} isolated and sent to treatment (${upstreamValves.length} valves closed)`);
              return true;
            }
          }
          return false;

        default:
          return false;
      }
    } catch (e) {
      console.error('[ACTION ERROR]', e);
      return false;
    }
  }

  reset() {
    this.activeActions.clear();
    this.stabilityCounters.clear();
    this.completedLog = [];
    actionIdCounter = 1;
    actionTracker.reset();
  }
}

export const autoFixEngine = new AutoFixEngine();

export function runAutoFix(activeIssues, state, engine) {
  return autoFixEngine.processTick(activeIssues, state, engine);
}

export function resetAutoFix() {
  autoFixEngine.reset();
}
