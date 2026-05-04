// TreatmentPlantPanel.jsx — Water treatment plant status & visualization
import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import styles from './TreatmentPlantPanel.module.css';

export function TreatmentPlantPanel() {
  const { treatmentState } = useSimulation();

  if (!treatmentState) return null;

  const { active, flowToPlant, treatedFlow } = treatmentState;
  const status = active ? (treatedFlow > 0 ? 'completed' : 'processing') : 'idle';

  const statusColor = {
    idle: '#999',
    processing: '#00d4ff',
    completed: '#6BCF7F',
  }[status] || '#999';

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>💧 Treatment Plant (STP1)</h3>

      <div className={styles.status} style={{ borderLeftColor: statusColor }}>
        <div className={styles.row}>
          <span>Status:</span>
          <strong style={{ color: statusColor }}>{status.toUpperCase()}</strong>
        </div>
        <div className={styles.row}>
          <span>Input Flow:</span>
          <strong>{Math.round(flowToPlant)} L/min</strong>
        </div>
        <div className={styles.row}>
          <span>Output Flow:</span>
          <strong>{Math.round(treatedFlow)} L/min</strong>
        </div>
        <div className={styles.row}>
          <span>Efficiency:</span>
          <strong>92%</strong>
        </div>
      </div>

      {status === 'processing' && (
        <div className={styles.animation}>
          <div className={styles.flowBar} />
          <p className="text-[10px] text-center mt-2 animate-pulse text-primary">Purifying Wastewater...</p>
        </div>
      )}

      {status === 'completed' && (
        <div className={styles.success}>✅ Purification Successful — Distributing to Reservoir</div>
      )}
    </div>
  );
}

export default TreatmentPlantPanel;
