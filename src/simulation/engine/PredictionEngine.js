// PredictionEngine.js — Phase 3: Predictive intelligence via trend analysis

import { getSensorHistory } from './SensorSimulator.js';

const TREND_WINDOW  = 10; // ticks to compute rate-of-change
const LOOKAHEAD     = 20; // ticks to project ahead for threshold crossing

let predIdCounter = 1;

// ----- Public API -----

/**
 * Scan current network state + sensor histories and return predicted future issues.
 * @param {object} state  - networkState from engine.getState()
 * @param {object} simTime - { day, hour, minute, second }
 * @returns {PredictionObject[]}
 */
export function generatePredictions(state, simTime) {
  const { nodes, reservoirs, zones } = state;
  const predictions = [];

  // Phase 3a: Reservoir depletion forecast
  reservoirs.forEach(r => {
    const pred = _predictReservoirDepletion(r);
    if (pred) predictions.push(pred);
  });

  // Phase 3b: Node pressure failure forecast
  nodes.forEach(node => {
    const pred = _predictPressureFailure(node);
    if (pred) predictions.push(pred);
  });

  // Phase 3c: Zone supply shortage forecast
  zones.forEach(zone => {
    const pred = _predictSupplyShortage(zone, nodes);
    if (pred) predictions.push(pred);
  });

  // Phase 3d: Time-of-day demand surge (rule-based forward awareness)
  const hour = simTime.hour + simTime.minute / 60;
  const demandPred = _predictDemandSurge(hour);
  if (demandPred) predictions.push(demandPred);

  return predictions;
}

export function resetPredictions() {
  predIdCounter = 1;
}

// ----- Internal predictors -----

function _predictReservoirDepletion(reservoir) {
  const pct = (reservoir.currentLevel / reservoir.capacity) * 100;
  if (pct <= 20) return null; // already critical — not a prediction

  // Use a conservative depletion rate estimate (in % per simulated hour)
  // The engine drains ~totalOutgoing*0.0167 per tick @ ~100ms → rough daily drain ~72L
  // We use a simplified rate: if below 60%, warn
  const netDrainPerHour = 2.0; // % per simulated hour (conservative)
  const hoursToWarning  = (pct - 40) / netDrainPerHour;
  const hoursToCritical = (pct - 20) / netDrainPerHour;

  if (hoursToWarning > 72) return null; // too far away to matter

  return {
    id:          `PRED_${String(predIdCounter++).padStart(4,'0')}`,
    type:        'RESERVOIR_DEPLETION',
    isPrediction: true,
    severity:    hoursToCritical < 8 ? 'critical' : 'warning',
    confidence:  Math.min(95, 55 + (72 - hoursToWarning)),
    title:       `Reservoir ${reservoir.id} Depletion Forecast`,
    description: `At current usage rate, ${reservoir.id} will reach critical level (20%) in approximately ${_formatHours(hoursToCritical)}.`,
    timeToEvent: hoursToCritical * 3_600_000,
    timeLabel:   _formatHours(hoursToCritical),
    action:      'REDUCE_CONSUMPTION',
    currentValue: Math.round(pct),
    projectedValue: 20,
    location:    { reservoirId: reservoir.id },
  };
}

function _predictPressureFailure(node) {
  const history = getSensorHistory(node.id, 'pressure');
  if (history.length < TREND_WINDOW) return null;

  const { ratePerTick, trend, ticksToThreshold } = _analyzeTrend(history, 40);
  if (trend !== 'falling' || ratePerTick > -0.15) return null;
  if (ticksToThreshold <= 0 || ticksToThreshold > 60) return null;

  const estimatedMs = ticksToThreshold * 2_000;
  const hours       = estimatedMs / 3_600_000;

  return {
    id:           `PRED_${String(predIdCounter++).padStart(4,'0')}`,
    type:         'PRESSURE_FAILURE',
    isPrediction: true,
    severity:     ticksToThreshold < 15 ? 'critical' : 'warning',
    confidence:   Math.min(90, 45 + Math.abs(ratePerTick) * 50),
    title:        `Pressure Failure Predicted — ${node.id}`,
    description:  `${node.id} pressure dropping at ${Math.abs(ratePerTick).toFixed(2)} PSI/check. Will breach warning threshold in ~${_formatHours(hours)}.`,
    timeToEvent:  estimatedMs,
    timeLabel:    _formatHours(hours),
    action:       'PREEMPTIVE_VALVE_ADJUST',
    currentValue: Math.round(node.pressure),
    projectedValue: 40,
    location:     { nodeId: node.id },
  };
}

function _predictSupplyShortage(zone, nodes) {
  if (!zone.connectedNode) return null;
  const ratio = zone.demandCurrent > 0 ? zone.supplyCurrent / zone.demandCurrent : 1;
  if (ratio < 0.7) return null; // already in shortage — not a prediction
  if (ratio > 0.95) return null; // healthy — no prediction needed

  const flowHistory = getSensorHistory(zone.connectedNode, 'flow');
  if (flowHistory.length < TREND_WINDOW) return null;

  const { trend, ratePerTick, ticksToThreshold } = _analyzeTrend(
    flowHistory,
    zone.demandCurrent * 0.7
  );

  if (trend !== 'falling' || ticksToThreshold <= 0 || ticksToThreshold > 50) return null;

  const estimatedMs = ticksToThreshold * 2_000;
  const hours       = estimatedMs / 3_600_000;

  return {
    id:           `PRED_${String(predIdCounter++).padStart(4,'0')}`,
    type:         'SUPPLY_SHORTAGE',
    isPrediction: true,
    severity:     'warning',
    confidence:   Math.min(85, 55 + Math.abs(ratePerTick) * 20),
    title:        `Shortage Incoming — ${zone.name}`,
    description:  `${zone.name} trending toward supply deficit. Projected shortfall in ~${_formatHours(hours)}. ${zone.population ? zone.population.toLocaleString() + ' residents at risk.' : ''}`,
    timeToEvent:  estimatedMs,
    timeLabel:    _formatHours(hours),
    action:       'PREEMPTIVE_REDISTRIBUTION',
    currentValue: Math.round(ratio * 100),
    projectedValue: 70,
    location:     { zoneId: zone.id },
    affectedPopulation: zone.population || 0,
  };
}

function _predictDemandSurge(hour) {
  // Morning peak 07:00 — warn 45 min before
  if (hour >= 6.25 && hour < 7) {
    const minsAway = Math.round((7 - hour) * 60);
    return {
      id:           `PRED_${String(predIdCounter++).padStart(4,'0')}`,
      type:         'DEMAND_SURGE',
      isPrediction: true,
      severity:     'info',
      confidence:   93,
      title:        'Morning Peak Demand Incoming',
      description:  `Historical data indicates 40–50% demand surge at 07:00. Pre-opening valves now will prevent pressure dips.`,
      timeToEvent:  minsAway * 60_000,
      timeLabel:    `In ~${minsAway} minutes`,
      action:       'PRE_OPEN_VALVES',
      location:     null,
    };
  }
  // Evening peak 18:00
  if (hour >= 17.25 && hour < 18) {
    const minsAway = Math.round((18 - hour) * 60);
    return {
      id:           `PRED_${String(predIdCounter++).padStart(4,'0')}`,
      type:         'DEMAND_SURGE',
      isPrediction: true,
      severity:     'info',
      confidence:   88,
      title:        'Evening Peak Demand Incoming',
      description:  `Residential demand typically spikes 30–40% at 18:00. Recommend pre-staging supply.`,
      timeToEvent:  minsAway * 60_000,
      timeLabel:    `In ~${minsAway} minutes`,
      action:       'PRE_OPEN_VALVES',
      location:     null,
    };
  }
  return null;
}

// ----- Trend analysis -----

function _analyzeTrend(history, threshold) {
  const recent     = history.slice(-TREND_WINDOW);
  const first      = recent[0];
  const last       = recent[recent.length - 1];
  const ratePerTick = (last - first) / recent.length;

  const pctChange = first !== 0 ? Math.abs((last - first) / first) * 100 : 0;
  const trend     = pctChange < 1.5 ? 'stable' : ratePerTick > 0 ? 'rising' : 'falling';

  let ticksToThreshold = Infinity;
  if (ratePerTick < 0 && last > threshold) {
    ticksToThreshold = (last - threshold) / Math.abs(ratePerTick);
  }

  const projectedValue = last + ratePerTick * LOOKAHEAD;

  return { trend, ratePerTick, ticksToThreshold, projectedValue };
}

function _formatHours(hours) {
  if (hours < 0.017) return 'Imminent (<1 min)';
  if (hours < 1)     return `~${Math.round(hours * 60)} minutes`;
  if (hours < 24)    return `~${Math.round(hours)} hours`;
  return `~${Math.round(hours / 24)} days`;
}
