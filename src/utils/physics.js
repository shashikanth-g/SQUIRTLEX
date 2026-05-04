// Physics utilities for water flow simulation

/**
 * Calculate pressure at a node based on incoming flows and consumption.
 * Uses a simplified model: pressure drops proportional to flow * resistance.
 */
export function calculatePressure(node, allNodes, pipes, zones) {
  const connectedPipes = pipes.filter(
    (p) => p.source === node.id || p.target === node.id
  );

  let netPressureChange = 0;
  let contributorCount = 0;

  connectedPipes.forEach((pipe) => {
    const isIncoming = pipe.target === node.id;
    const otherNodeId = isIncoming ? pipe.source : pipe.target;
    const otherNode = allNodes.find((n) => n.id === otherNodeId);
    if (!otherNode) return;

    const flowResistance = pipe.length / (pipe.diameter * pipe.diameter);
    const pressureDrop = pipe.flowRate * flowResistance * 0.001;

    if (isIncoming && otherNode.pressure > node.pressure) {
      netPressureChange +=
        (otherNode.pressure - pressureDrop - node.pressure) * 0.1;
      contributorCount++;
    } else if (!isIncoming && node.pressure > otherNode.pressure) {
      netPressureChange -= pressureDrop * 0.05;
    }
  });

  // Consumption reduces pressure
  const zone = zones.find((z) => z.connectedNode === node.id);
  if (zone) {
    const consumption = zone.demandCurrent || 0;
    netPressureChange -= consumption * 0.02;
  }

  const newPressure = node.pressure + netPressureChange;
  return Math.max(0, Math.min(150, newPressure));
}

/**
 * Calculate flow rate through a pipe based on pressure differential + valve state.
 * CRITICAL: Valve = 0 → flow = 0 (hard stop).
 */
export function calculateFlow(pipe, sourceNode, targetNode, valves) {
  if (!sourceNode || !targetNode) return 0;
  if (pipe.status === 'blocked' || pipe.blockagePercent >= 100) return 0;

  // Find valve on this pipe
  const valve = valves.find(
    (v) =>
      (v.connected.includes(pipe.source) && v.connected.includes(pipe.target)) ||
      v.id === pipe.source ||
      v.id === pipe.target
  );

  // HARD VALVE CLOSURE: If valve = 0, flow = 0 (no matter what pressure)
  if (valve && valve.openPercentage <= 0) {
    if (window.__debug) {
      console.log(`[VALVE CLOSED] ${valve.id} → flow = 0 (blocking ${pipe.id})`);
    }
    return 0;
  }

  const pressureDiff = sourceNode.pressure - targetNode.pressure;
  const valveMultiplier = valve ? valve.openPercentage / 100 : 1;
  const blockageMultiplier = (100 - (pipe.blockagePercent || 0)) / 100;

  // Flow proportional to pressure difference + valve opening
  const baseFlow = Math.sqrt(Math.abs(pressureDiff)) * pipe.diameter * 0.5;
  const direction = pressureDiff >= 0 ? 1 : -1;

  const finalFlow = Math.max(0, baseFlow * valveMultiplier * blockageMultiplier * direction);

  // Log valve flow reduction (debug)
  if (valve && valve.openPercentage < 100 && finalFlow > 0) {
    if (window.__debug) {
      console.log(`[VALVE FLOW] ${valve.id} @ ${valve.openPercentage}% → ${Math.round(finalFlow)} L/min`);
    }
  }

  return finalFlow;
}

/**
 * Calculate the demand multiplier based on time of day.
 * Peaks in morning (7-9am) and evening (6-8pm).
 */
export function getDemandMultiplier(hour) {
  if (hour >= 7 && hour <= 9) return 1.4; // morning peak
  if (hour >= 18 && hour <= 20) return 1.3; // evening peak
  if (hour >= 0 && hour <= 5) return 0.5; // night low
  if (hour >= 12 && hour <= 14) return 1.1; // lunch bump
  return 1.0;
}

/**
 * Calculate water quality downstream of a pollution source.
 * @param {number} pollutionLevel 0-100
 * @param {number} distanceFromSource in arbitrary units
 * @returns pH deviation from neutral 7
 */
export function calculatePollutionImpact(pollutionLevel, distanceFromSource) {
  const decay = Math.exp(-distanceFromSource * 0.005);
  return (pollutionLevel / 100) * 2.5 * decay; // max 2.5 pH deviation
}

/**
 * Classify a sensor value's status based on thresholds from sensorConfig.
 */
export function classifyStatus(value, sensorType, sensorConfig) {
  const config = sensorConfig.sensorTypes[sensorType];
  if (!config) return 'normal';

  const [optLow, optHigh] = config.optimalRange;
  if (value >= optLow && value <= optHigh) return 'normal';

  for (const [wLow, wHigh] of config.warningRange) {
    if (value >= wLow && value <= wHigh) return 'warning';
  }

  return 'critical';
}

/**
 * Compute a simple moving trend from recent values.
 * Returns 'rising', 'falling', or 'stable'.
 */
export function calculateTrend(history, windowSize = 5) {
  if (!history || history.length < windowSize) return 'stable';
  const recent = history.slice(-windowSize);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  const pct = Math.abs(diff / (first || 1)) * 100;
  if (pct < 2) return 'stable';
  return diff > 0 ? 'rising' : 'falling';
}
