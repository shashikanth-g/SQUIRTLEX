// Scenarios — Pre-built test scenarios for the simulation
import { SCENARIOS } from '../../utils/constants.js';

export function applyScenario(scenarioName, engine) {
  // Reset everything first
  resetToNormal(engine);

  switch (scenarioName) {
    case SCENARIOS.NORMAL:
      resetToNormal(engine);
      break;
    case SCENARIOS.MORNING_PEAK:
      applyMorningPeak(engine);
      break;
    case SCENARIOS.PIPE_BURST:
      applyPipeBurst(engine);
      break;
    case SCENARIOS.POLLUTION:
      applyPollution(engine);
      break;
    case SCENARIOS.DROUGHT:
      applyDrought(engine);
      break;
    case SCENARIOS.MULTI_FAILURE:
      applyMultiFailure(engine);
      break;
    case SCENARIOS.WATER_CONTAMINATION:
      applyWaterContamination(engine);
      break;
    default:
      resetToNormal(engine);
  }
}

function resetToNormal(engine) {
  engine.pipes.forEach((p) => {
    p.status = 'normal';
    p.blockagePercent = 0;
  });
  engine.valves.forEach((v) => {
    v.openPercentage = v.id === 'V4' ? 60 : v.id === 'V11' ? 65 : v.id === 'V3' ? 75 : v.id === 'V2' ? 85 : 100;
    v.mode = 'auto';
  });
  engine.reservoirs.forEach((r) => {
    r.currentLevel = r.capacity * 0.92;
  });
  engine.zones.forEach((z) => {
    if (z.wastewater) z.wastewater.pollutionLevel = 75;
  });
}

function applyMorningPeak(engine) {
  engine.zones.forEach((z) => {
    z.demandCurrent = Math.round(z.demandBase * 1.5);
  });
}

function applyPipeBurst(engine) {
  engine.blockPipe('P12');
  // Also reduce pressure downstream
  const n8 = engine.nodes.find((n) => n.id === 'N8');
  if (n8) n8.pressure *= 0.3;
}

function applyPollution(engine) {
  const ind = engine.zones.find((z) => z.id === 'IND1');
  if (ind && ind.wastewater) {
    ind.wastewater.pollutionLevel = 95;
    ind.wastewater.treatment = 'none';
  }
  // Downstream nodes get poor pH
  ['N15'].forEach((nId) => {
    const node = engine.nodes.find((n) => n.id === nId);
    if (node && node.sensors && node.sensors.pH) {
      node.sensors.pH.value = 5.8;
    }
  });
}

function applyDrought(engine) {
  engine.reservoirs.forEach((r) => {
    r.currentLevel = r.capacity * 0.25;
  });
  // Reduce all valve openings
  engine.valves.forEach((v) => {
    v.openPercentage = Math.max(20, v.openPercentage * 0.5);
  });
}

function applyMultiFailure(engine) {
  engine.blockPipe('P12');
  engine.blockPipe('P16');
  engine.createLeak('N7');
  engine.reservoirs.forEach((r) => {
    r.currentLevel = r.capacity * 0.4;
  });
}

function applyWaterContamination(engine) {
  // Mark a zone as contaminated to trigger treatment system
  const zone = engine.zones.find((z) => z.id === 'Z3' || z.id === 'WEST');
  if (zone) {
    zone.isContaminated = true;
    zone.contaminationLevel = 2;
    zone.contaminationSeverity = 'moderate';
    zone.waterQuality = 'contaminated';
  }

  // Optional: trigger industrial sewage event
  const indZone = engine.zones.find((z) => z.type === 'industrial');
  if (indZone) {
    indZone.sewageInflow = true;
  }
}

export const SCENARIO_DESCRIPTIONS = {
  [SCENARIOS.NORMAL]: 'Standard operating conditions. All systems nominal.',
  [SCENARIOS.MORNING_PEAK]: 'Peak demand period (7-9 AM). All zones experience +50% demand surge.',
  [SCENARIOS.PIPE_BURST]: 'Pipe P12 (N6→N8) has burst. Zone Z1 (Downtown) loses primary supply.',
  [SCENARIOS.POLLUTION]: 'Industrial plant IND1 releases untreated wastewater. River downstream contaminated.',
  [SCENARIOS.DROUGHT]: 'Reservoir at 25% capacity. Emergency water conservation in effect.',
  [SCENARIOS.MULTI_FAILURE]: 'Multiple simultaneous failures: 2 pipe blockages, 1 leak, low reservoir.',
  [SCENARIOS.WATER_CONTAMINATION]: 'Water contamination detected in zone. Treatment plant activated. Automatic isolation & redirection.',
};
