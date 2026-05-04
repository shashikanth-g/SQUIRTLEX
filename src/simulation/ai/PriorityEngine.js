// PriorityEngine.js — Intelligent issue prioritization for autonomous decision-making

const SEVERITY_WEIGHTS = {
  critical: 100,
  warning: 50,
  info: 20,
};

const ISSUE_TYPE_URGENCY = {
  LOW_RESERVOIR: 95,        // Infrastructure-wide impact
  BLOCKAGE: 90,             // Immediate flow disruption
  UNDER_SUPPLY: 85,         // Direct population impact
  WATER_QUALITY: 80,        // Health risk
  POLLUTION: 75,            // Environmental + health
  PRESSURE_IMBALANCE: 60,   // Performance degradation
  OVER_SUPPLY: 30,          // Inefficiency, not critical
};

const POPULATION_IMPACT = {
  Z1_residential: 25000,    // Downtown
  Z2_residential: 18000,    // North Hills
  IND1: 500,                // Manufacturing
  SCH1: 3000,               // School
  Z3_industrial: 800,       // South Park
};

/**
 * Calculate priority score for an issue.
 * Higher score = more urgent.
 *
 * Formula:
 *   base = severity_weight + type_urgency + confidence_bonus
 *   multiplier = affected_population_factor
 *   final = base * multiplier
 */
export function calculatePriority(issue) {
  if (!issue) return 0;

  const severityScore = SEVERITY_WEIGHTS[issue.severity] || 20;
  const typeScore = ISSUE_TYPE_URGENCY[issue.type] || 40;
  const confidenceBonus = (issue.confidence || 0) * 0.2; // max +20 for 100% confidence

  let baseScore = severityScore + typeScore + confidenceBonus;

  // Population impact multiplier
  const zoneId = issue.zoneId || issue.location?.zoneId;
  if (zoneId) {
    const population = POPULATION_IMPACT[zoneId] || 1000;
    const popFactor = 1 + (population / 50000); // 1.0 to 1.5x
    baseScore *= popFactor;
  }

  // Time urgency — older issues get slight boost (prevents starvation)
  const ageSeconds = (Date.now() - (issue.firstDetected || Date.now())) / 1000;
  const ageFactor = Math.min(1.15, 1 + (ageSeconds / 300)); // max +15% after 5 min
  baseScore *= ageFactor;

  return Math.round(baseScore);
}

/**
 * Sort issues by priority descending (highest first).
 */
export function getPrioritizedIssues(issues) {
  if (!issues || !Array.isArray(issues)) return [];

  return [...issues]
    .map((issue) => ({
      ...issue,
      priorityScore: calculatePriority(issue),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get top N critical issues for immediate action.
 */
export function getTopCriticalIssues(issues, limit = 5) {
  const prioritized = getPrioritizedIssues(issues);
  return prioritized.slice(0, limit);
}

export function rank(issues) {
  return getPrioritizedIssues(issues);
}
