// IssueEngine.js — Rule-based issue detection and decision system
import { ALERT_TYPES, SEVERITY } from '../../utils/constants.js';

/**
 * Detect operational issues based on simulation metrics.
 * @param {object} state - Current network state
 * @param {Array} existingIssues - Current issues to avoid duplicates
 */
export function detectIssues(state, existingIssues = []) {
  const { nodes, pipes, zones } = state;
  const newIssues = [];

  // 1. Imbalance Detection (Supply < 40%)
  zones.forEach(zone => {
    const ratio = zone.demandCurrent > 0 ? zone.supplyCurrent / zone.demandCurrent : 1;
    if (ratio < 0.4 && !isDuplicate(existingIssues, 'imbalance', zone.id)) {
      newIssues.push(createIssue({
        type: 'imbalance',
        zoneId: zone.id,
        locationName: zone.name,
        confidence: 94,
        severity: 'critical',
        description: `Severe supply deficit in ${zone.name}. Population affected.`,
        rootCause: "Local supply-demand imbalance or upstream restriction."
      }));
    }
  });

  // 2. Blockage Detection (Flow drop > 80% while nodes have pressure)
  pipes.forEach(pipe => {
    if (pipe.status === 'blocked' && !isDuplicate(existingIssues, 'blockage', pipe.id)) {
      newIssues.push(createIssue({
        type: 'blockage',
        pipelineId: pipe.id,
        locationName: pipe.id,
        confidence: 98,
        severity: 'critical',
        description: `Zero flow detected in ${pipe.id}. Infrastructure bypass required.`,
        rootCause: "Physical obstruction or structural pipe failure."
      }));
    }
  });

  // 3. Leak Detection (Sudden pressure drop at node with no change in demand)
  nodes.forEach(node => {
    const pressure = node.sensors?.pressure?.value ?? node.pressure;
    if (pressure < 25 && !isDuplicate(existingIssues, 'leak', node.id)) {
      newIssues.push(createIssue({
        type: 'leak',
        nodeId: node.id,
        locationName: node.id,
        confidence: 88,
        severity: 'warning',
        description: `Abnormal pressure drop at node ${node.id}.`,
        rootCause: "Potential structural leak or joint fracture."
      }));
    }
  });

  // 4. Contamination (pH out of safe range)
  nodes.forEach(node => {
    const ph = node.sensors?.pH?.value;
    if ((ph < 6.5 || ph > 8.5) && !isDuplicate(existingIssues, 'contamination', node.id)) {
      newIssues.push(createIssue({
        type: 'contamination',
        nodeId: node.id,
        locationName: node.id,
        confidence: 96,
        severity: 'critical',
        description: `Chemical imbalance detected at ${node.id} (pH: ${ph?.toFixed(1)}).`,
        rootCause: "External pollutant infiltration or treatment failure."
      }));
    }
  });

  return newIssues;
}

/**
 * Determine the best action for a given issue.
 */
export function getDecision(issue) {
  switch (issue.type) {
    case 'imbalance':
      return {
        action: 'DISPATCH_TANKER',
        description: `Deploy emergency water tankers to ${issue.locationName}.`,
        impact: "Restores minimum habitable supply to affected residents."
      };
    case 'blockage':
      return {
        action: 'REROUTE_FLOW',
        description: `Open bypass valves to circumvent ${issue.pipelineId}.`,
        impact: "Maintains network pressure through secondary paths."
      };
    case 'leak':
      return {
        action: 'PRESSURE_REDUCTION',
        description: `Decrease upstream pressure to minimize water loss at ${issue.locationName}.`,
        impact: "Reduces wastage and prevents further structural damage."
      };
    case 'contamination':
      return {
        action: 'ISOLATE_PIPELINE',
        description: `Close all valves leading to and from ${issue.locationName}.`,
        impact: "Contains pollutants and prevents network-wide spread."
      };
    default:
      return null;
  }
}

function createIssue(data) {
  return {
    id: `ISSUE_${Math.floor(Math.random() * 10000)}`,
    status: 'detected',
    timestamp: Date.now(),
    ...data
  };
}

function isDuplicate(existing, type, id) {
  return existing.some(i => i.type === type && (i.zoneId === id || i.pipelineId === id || i.nodeId === id) && i.status !== 'resolved');
}
