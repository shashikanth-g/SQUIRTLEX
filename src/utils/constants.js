// System constants for SQUIRTLE-X simulation

export const TICK_INTERVAL = 100; // ms between physics updates
export const SENSOR_UPDATE_INTERVAL = 500; // ms between sensor readings
export const ANOMALY_CHECK_INTERVAL = 2000; // ms between anomaly scans
export const AI_DECISION_INTERVAL = 5000; // ms between AI evaluations

export const PRESSURE = {
  MIN: 0,
  MAX: 150,
  OPTIMAL_LOW: 60,
  OPTIMAL_HIGH: 90,
  WARNING_LOW: 40,
  WARNING_HIGH: 110,
  IMBALANCE_WARN: 25,
  IMBALANCE_CRITICAL: 40,
};

export const FLOW = {
  MIN: 0,
  CRITICAL_LOW: 50,
};

export const PH = {
  OPTIMAL_LOW: 6.5,
  OPTIMAL_HIGH: 8.5,
  WARNING_LOW: 6.0,
  WARNING_HIGH: 9.0,
};

export const SUPPLY = {
  UNDER_SUPPLY_WARN: 0.85, // 15% gap
  UNDER_SUPPLY_CRITICAL: 0.70, // 30% gap
};

export const VALVE = {
  ADJUSTMENT_DURATION: 3000, // ms for smooth animation
  MIN_OPEN: 0,
  MAX_OPEN: 100,
};

export const RESERVOIR = {
  CAPACITY: 50000000,
  REFILL_RATE: 500, // L/min natural inflow
};

export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export const NODE_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export const PIPE_STATUS = {
  NORMAL: 'normal',
  BLOCKED: 'blocked',
  LEAK: 'leak',
};

export const ALERT_TYPES = {
  PRESSURE_IMBALANCE: 'PRESSURE_IMBALANCE',
  UNDER_SUPPLY: 'UNDER_SUPPLY',
  OVER_SUPPLY: 'OVER_SUPPLY',
  BLOCKAGE: 'BLOCKAGE',
  WATER_QUALITY: 'WATER_QUALITY',
  LOW_RESERVOIR: 'LOW_RESERVOIR',
  NO_ALTERNATIVE_PATH: 'NO_ALTERNATIVE_PATH',
  POLLUTION: 'POLLUTION',
  CONTAMINATION: 'CONTAMINATION',
  SEWAGE_INFLOW: 'SEWAGE_INFLOW',
};

export const SCENARIOS = {
  NORMAL: 'Normal Operation',
  MORNING_PEAK: 'Morning Peak Demand',
  PIPE_BURST: 'Pipe Burst in Zone 2',
  POLLUTION: 'Industrial Pollution Event',
  DROUGHT: 'Drought Mode',
  MULTI_FAILURE: 'Multi-Point Failure',
  WATER_CONTAMINATION: 'Water Contamination & Treatment',
};

export const ISSUE_LIFECYCLE = {
  DETECTING:   'detecting',   // seen but not yet validated
  VALIDATED:   'validated',   // persisted VALIDATION_TICKS, ready for fix
  IN_PROGRESS: 'in_progress', // auto-fix applied, monitoring recovery
  RESOLVED:    'resolved',    // cleared for CLEARANCE_TICKS
  DISMISSED:   'dismissed',   // manually dismissed by operator
};

export const PREDICTION_TYPES = {
  RESERVOIR_DEPLETION: 'RESERVOIR_DEPLETION',
  PRESSURE_FAILURE:    'PRESSURE_FAILURE',
  SUPPLY_SHORTAGE:     'SUPPLY_SHORTAGE',
  DEMAND_SURGE:        'DEMAND_SURGE',
};

export const AUTO_FIX = {
  MAX_RETRIES:          3,
  COOLDOWN_TICKS:       10,
  RECOVERY_CHECK_TICKS: 4,
};
