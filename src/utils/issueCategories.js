// issueCategories.js — Issue type classification

export const AI_ISSUE_TYPES = [
  'ASSET_AGING',
  'PREDICTIVE_FAILURE',
];

export const SYSTEM_ALERT_TYPES = [
  'LEAK',
  'BLOCKAGE',
  'LOW_PRESSURE',
  'PRESSURE_IMBALANCE',
  'CONTAMINATION',
  'POLLUTION',
  'WATER_QUALITY',
  'UNDER_SUPPLY',
  'LOW_RESERVOIR',
  'MID_PIPE_LEAK',
  'MID_PIPE_BLOCKAGE',
];

/**
 * Categorize issue based on type.
 * Returns 'ai' or 'system'.
 */
export function categorizeIssue(issueType) {
  if (AI_ISSUE_TYPES.includes(issueType)) return 'ai';
  if (SYSTEM_ALERT_TYPES.includes(issueType)) return 'system';
  return 'system'; // Default to system for unknown types
}

/**
 * Filter issues by category.
 */
export function filterByCategory(issues, category) {
  return issues.filter(issue => categorizeIssue(issue.type) === category);
}
