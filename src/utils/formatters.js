// Display formatting utilities

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(n, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a PSI value.
 */
export function formatPressure(psi) {
  return `${formatNumber(psi, 1)} PSI`;
}

/**
 * Format a flow rate.
 */
export function formatFlow(lpm) {
  return `${formatNumber(lpm, 0)} L/min`;
}

/**
 * Format a percentage.
 */
export function formatPercent(value) {
  return `${formatNumber(value, 1)}%`;
}

/**
 * Format a timestamp to HH:MM:SS.
 */
export function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

/**
 * Format simulation time (Day X, HH:MM:SS).
 */
export function formatSimTime(time) {
  const { day, hour, minute, second } = time;
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  return `Day ${day}, ${hh}:${mm}:${ss}`;
}

/**
 * Format liters to a human-readable volume.
 */
export function formatVolume(liters) {
  if (liters >= 1_000_000) return `${(liters / 1_000_000).toFixed(1)}M L`;
  if (liters >= 1_000) return `${(liters / 1_000).toFixed(1)}K L`;
  return `${liters} L`;
}

/**
 * Get a severity color class.
 */
export function severityColor(severity) {
  switch (severity) {
    case 'critical':
      return '#FF6B6B';
    case 'warning':
      return '#FFD93D';
    case 'info':
      return '#00D4FF';
    default:
      return '#6BCF7F';
  }
}

/**
 * Get status color based on node/pipe status.
 */
export function statusColor(status) {
  switch (status) {
    case 'critical':
      return '#FF6B6B';
    case 'warning':
      return '#FFD93D';
    case 'blocked':
      return '#FF6B6B';
    case 'leak':
      return '#FFD93D';
    default:
      return '#00D4FF';
  }
}

/**
 * Get a trend arrow.
 */
export function trendArrow(trend) {
  switch (trend) {
    case 'rising':
      return '↑';
    case 'falling':
      return '↓';
    default:
      return '→';
  }
}
