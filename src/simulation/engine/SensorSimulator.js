// SensorSimulator.js — Generate realistic sensor data with noise and drift
import sensorConfig from '../../data/sensorConfig.json';
import { classifyStatus, calculateTrend } from '../../utils/physics.js';

const sensorHistory = {}; // nodeId -> sensorType -> values[]

/**
 * Generate a realistic sensor reading for a node.
 */
export function generateSensorData(nodeId, baseValue, sensorType) {
  const noise = (Math.random() - 0.5) * 0.05 * baseValue; // ±2.5%
  const drift = Math.sin(Date.now() / 10000) * 0.02 * baseValue; // Slow drift
  const value = Math.round((baseValue + noise + drift) * 100) / 100;

  // Track history
  const key = `${nodeId}_${sensorType}`;
  if (!sensorHistory[key]) sensorHistory[key] = [];
  sensorHistory[key].push(value);
  if (sensorHistory[key].length > 60) sensorHistory[key].shift(); // Keep last 60 readings

  return {
    value,
    unit: sensorConfig.sensorTypes[sensorType]?.unit || '',
    timestamp: Date.now(),
    status: classifyStatus(value, sensorType, sensorConfig),
    trend: calculateTrend(sensorHistory[key]),
  };
}

/**
 * Update all sensors on a node in place.
 */
export function updateNodeSensors(node) {
  if (!node.sensors) return;
  node.sensors.pressure = generateSensorData(node.id, node.pressure, 'pressure');
  node.sensors.flow = generateSensorData(node.id, node.flow, 'flow');

  // pH and turbidity based on baseline with slight variation
  const basePH = node.sensors.pH?.value || 7.2;
  node.sensors.pH = generateSensorData(node.id, basePH, 'pH');

  const baseTurbidity = node.sensors.turbidity?.value || 0.5;
  node.sensors.turbidity = generateSensorData(node.id, baseTurbidity, 'turbidity');

  const baseTemp = node.sensors.temperature?.value || 22;
  node.sensors.temperature = generateSensorData(node.id, baseTemp, 'temperature');
}

/**
 * Get sensor history for charting.
 */
export function getSensorHistory(nodeId, sensorType) {
  const key = `${nodeId}_${sensorType}`;
  return sensorHistory[key] || [];
}

/**
 * Clear all sensor history (e.g., on scenario reset).
 */
export function clearSensorHistory() {
  Object.keys(sensorHistory).forEach((k) => delete sensorHistory[k]);
}
