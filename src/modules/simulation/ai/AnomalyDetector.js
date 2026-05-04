// AnomalyDetector.js — Pattern recognition for water network anomalies
import { PRESSURE, SUPPLY, PH, ALERT_TYPES, SEVERITY } from '@/utils/constants.js';

let alertIdCounter = 1;

/**
 * Scan the entire network state and return raw anomaly detections.
 * These are passed to IssueManager for temporal filtering / lifecycle management.
 */
export function detectAnomalies(state) {
  const { nodes, pipes, valves, reservoirs, zones } = state;
  const anomalies = [];

  // 1. Supply-Demand Mismatch
  zones.forEach((zone) => {
    if (!zone.demandCurrent || zone.demandCurrent === 0) return;
    const ratio = zone.supplyCurrent / zone.demandCurrent;

    if (ratio < SUPPLY.UNDER_SUPPLY_CRITICAL) {
      anomalies.push(createAnomaly({
        type:              ALERT_TYPES.UNDER_SUPPLY,
        severity:          SEVERITY.CRITICAL,
        zoneId:            zone.id,
        zoneName:          zone.name,
        message:           `${zone.name} critically under-supplied: ${Math.round(zone.supplyCurrent)}/${Math.round(zone.demandCurrent)} L/min`,
        gap:               Math.round(zone.demandCurrent - zone.supplyCurrent),
        affectedPopulation: zone.population || 0,
        autoFixAvailable:  true,
        action:            'REDISTRIBUTE',
      }));
    } else if (ratio < SUPPLY.UNDER_SUPPLY_WARN) {
      anomalies.push(createAnomaly({
        type:              ALERT_TYPES.UNDER_SUPPLY,
        severity:          SEVERITY.WARNING,
        zoneId:            zone.id,
        zoneName:          zone.name,
        message:           `${zone.name} under-supplied by ${Math.round(zone.demandCurrent - zone.supplyCurrent)} L/min`,
        gap:               Math.round(zone.demandCurrent - zone.supplyCurrent),
        affectedPopulation: zone.population || 0,
        autoFixAvailable:  true,
        action:            'REDISTRIBUTE',
      }));
    }
  });

  // 2. Pressure Imbalances between connected nodes
  pipes.forEach((pipe) => {
    if (pipe.status === 'blocked') return;
    const srcNode = nodes.find((n) => n.id === pipe.source);
    const tgtNode = nodes.find((n) => n.id === pipe.target);
    if (!srcNode || !tgtNode) return;

    const srcP = srcNode.sensors?.pressure?.value ?? srcNode.pressure;
    const tgtP = tgtNode.sensors?.pressure?.value ?? tgtNode.pressure;
    const diff = Math.abs(srcP - tgtP);

    if (diff > PRESSURE.IMBALANCE_CRITICAL) {
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.PRESSURE_IMBALANCE,
        severity:         SEVERITY.CRITICAL,
        nodes:            [srcNode.id, tgtNode.id],
        message:          `Critical pressure gap ${Math.round(diff)} PSI between ${srcNode.id}↔${tgtNode.id}`,
        difference:       diff,
        autoFixAvailable: true,
        action:           'ADJUST_VALVE',
        suggestedValve:   findValveBetween(srcNode.id, tgtNode.id, valves),
      }));
    } else if (diff > PRESSURE.IMBALANCE_WARN) {
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.PRESSURE_IMBALANCE,
        severity:         SEVERITY.WARNING,
        nodes:            [srcNode.id, tgtNode.id],
        message:          `Pressure gap ${Math.round(diff)} PSI between ${srcNode.id}↔${tgtNode.id}`,
        difference:       diff,
        autoFixAvailable: true,
        action:           'ADJUST_VALVE',
        suggestedValve:   findValveBetween(srcNode.id, tgtNode.id, valves),
      }));
    }
  });

  // 3. Blockage Detection
  pipes.forEach((pipe) => {
    if (pipe.status === 'blocked') {
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.BLOCKAGE,
        severity:         SEVERITY.CRITICAL,
        pipeId:           pipe.id,
        // Include source/target so AutoFixEngine can identify which zones are cut off
        pipeSource:       pipe.source,
        pipeTarget:       pipe.target,
        message:          `Pipe ${pipe.id} blocked (${pipe.source}→${pipe.target}). Flow = 0.`,
        autoFixAvailable: true,
        action:           'REROUTE',
      }));
    } else if ((pipe.blockagePercent || 0) > 50) {
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.BLOCKAGE,
        severity:         SEVERITY.WARNING,
        pipeId:           pipe.id,
        pipeSource:       pipe.source,
        pipeTarget:       pipe.target,
        message:          `Pipe ${pipe.id} ${pipe.blockagePercent}% blocked — flow reduced`,
        autoFixAvailable: false,
        action:           'INSPECT',
      }));
    }
  });

  // 4. Water Quality (pH out of range + pollution from zones)
  // Critical pH anomalies get autoFix so the engine can isolate the contaminated pipe.
  nodes.forEach((node) => {
    const ph = node.sensors?.pH?.value;
    if (ph == null) return;
    if (ph >= PH.OPTIMAL_LOW && ph <= PH.OPTIMAL_HIGH) return;

    const isCritical = ph < PH.WARNING_LOW || ph > PH.WARNING_HIGH;
    anomalies.push(createAnomaly({
      type:             ALERT_TYPES.WATER_QUALITY,
      severity:         isCritical ? SEVERITY.CRITICAL : SEVERITY.WARNING,
      nodeId:           node.id,
      message:          `${node.id} pH ${ph.toFixed(2)} — ${isCritical ? 'CRITICAL' : 'out of range'}`,
      currentPH:        ph,
      // Critical: auto-isolate the contaminated node to stop spread
      autoFixAvailable: isCritical,
      action:           'ISOLATE_SOURCE',
    }));
  });

  // 4b. Zone pollution detection (from contaminated water source)
  zones.forEach((zone) => {
    if (zone.waterQuality === 'poor' || zone.waterQuality === 'contaminated') {
      const isCritical = zone.type === 'school' || zone.type === 'hospital';
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.POLLUTION,
        severity:         isCritical ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        zoneId:           zone.id,
        message:          `${zone.name} receiving contaminated water${isCritical ? ' — CRITICAL INFRASTRUCTURE' : ''}`,
        autoFixAvailable: true,
        action:           isCritical ? 'ISOLATE_AND_TANKER' : 'DISPATCH_TANKER',
      }));
    }
  });

  // 5. Low Reservoir
  reservoirs.forEach((r) => {
    const pct = (r.currentLevel / r.capacity) * 100;
    if (pct < 20) {
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.LOW_RESERVOIR,
        severity:         SEVERITY.CRITICAL,
        reservoirId:      r.id,
        message:          `Reservoir ${r.id} critically low: ${pct.toFixed(1)}%`,
        autoFixAvailable: true,
        action:           'REDUCE_CONSUMPTION',
      }));
    } else if (pct < 40) {
      anomalies.push(createAnomaly({
        type:             ALERT_TYPES.LOW_RESERVOIR,
        severity:         SEVERITY.WARNING,
        reservoirId:      r.id,
        message:          `Reservoir ${r.id} running low: ${pct.toFixed(1)}%`,
        autoFixAvailable: false,
        action:           'REDUCE_CONSUMPTION',
      }));
    }
  });

  // 6. Pollution (zone receiving poor-quality water)
  // autoFixAvailable: true so AutoFixEngine can dispatch a clean-water tanker.
  zones
    .filter((z) => z.waterQuality === 'poor')
    .forEach((z) => {
      anomalies.push(createAnomaly({
        type:              ALERT_TYPES.POLLUTION,
        severity:          SEVERITY.WARNING,
        zoneId:            z.id,
        zoneName:          z.name,
        message:           `${z.name} receiving polluted water — quality: poor`,
        affectedPopulation: z.population || 0,
        autoFixAvailable:  true,   // triggers tanker dispatch with clean water
        action:            'DISPATCH_TANKER',
      }));
    });

  // 7. Water Contamination (new: zone flagged as contaminated)
  zones
    .filter((z) => z.isContaminated === true)
    .forEach((z) => {
      const severity = z.contaminationSeverity === 'severe' ? SEVERITY.CRITICAL : SEVERITY.WARNING;
      anomalies.push(createAnomaly({
        type:              ALERT_TYPES.CONTAMINATION,
        severity,
        zoneId:            z.id,
        zoneName:          z.name,
        message:           `${z.name} contaminated water detected — redirecting to treatment`,
        affectedPopulation: z.population || 0,
        autoFixAvailable:  true,
        action:            'REDIRECT_TO_TREATMENT',
        contaminationLevel: z.contaminationLevel || 1,
      }));
    });

  // 8. Sewage Inflow (new: industrial/sewage discharge events)
  zones
    .filter((z) => z.sewageInflow === true && z.type === 'industrial')
    .forEach((z) => {
      anomalies.push(createAnomaly({
        type:              ALERT_TYPES.SEWAGE_INFLOW,
        severity:          SEVERITY.CRITICAL,
        zoneId:            z.id,
        zoneName:          z.name,
        message:           `${z.name} sewage/industrial discharge detected — contamination risk`,
        affectedPopulation: z.population || 0,
        autoFixAvailable:  true,
        action:            'ISOLATE_AND_TREAT',
        contaminationLevel: 2,
      }));
    });

  return anomalies;
}

function createAnomaly(data) {
  return {
    id:        `ALERT_${alertIdCounter++}`,
    timestamp: Date.now(),
    dismissed: false,
    ...data,
  };
}

function findValveBetween(nodeA, nodeB, valves) {
  return valves.find(
    (v) => v.connected.includes(nodeA) && v.connected.includes(nodeB)
  )?.id || null;
}

export function resetAlertCounter() {
  alertIdCounter = 1;
}
