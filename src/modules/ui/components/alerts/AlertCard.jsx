// AlertCard.jsx — Individual alert with actions
import React from 'react';
import { useSimulation } from '@sim/../context/SimulationContext.jsx';
import { formatTimestamp, severityColor } from '@/utils/formatters.js';
import { AlertTriangle, Zap, Droplets, Waves, ShieldAlert, X } from 'lucide-react';

const ICONS = {
  PRESSURE_IMBALANCE: Zap,
  UNDER_SUPPLY: Droplets,
  OVER_SUPPLY: Waves,
  BLOCKAGE: ShieldAlert,
  WATER_QUALITY: AlertTriangle,
  LOW_RESERVOIR: Droplets,
  POLLUTION: AlertTriangle,
  NO_ALTERNATIVE_PATH: ShieldAlert,
};

export default function AlertCard({ alert }) {
  if (!alert) return null;

  const { dismissAlert, executeAIPlan, aiPlan } = useSimulation();
  const Icon = ICONS[alert?.type] || AlertTriangle;
  const color = severityColor(alert?.severity);

  return (
    <div className="alert-card" style={{ '--alert-color': color }}>
      <div className="alert-card-header">
        <Icon size={16} style={{ color }} />
        <span className="alert-type">{alert?.type?.replace(/_/g, ' ') || 'ALERT'}</span>
        <span className={`alert-severity ${alert?.severity}`}>{alert?.severity?.toUpperCase() || 'INFO'}</span>
        <span className="alert-time">{formatTimestamp(alert?.firstDetected || alert?.timestamp)}</span>
      </div>

      <p className="alert-message">{alert?.message || 'No details available'}</p>

      {(alert?.affectedPopulation || 0) > 0 && (
        <div className="alert-impact">
          ⚠ Affects {alert.affectedPopulation.toLocaleString()} people
        </div>
      )}

      <div className="alert-actions">
        {alert?.autoFixAvailable && (
          <button
            className="btn-fix"
            onClick={() => {
              if (aiPlan) executeAIPlan();
            }}
          >
            <Zap size={12} /> AUTO-FIX
          </button>
        )}
        <button className="btn-dismiss" onClick={() => dismissAlert(alert?.id)}>
          <X size={12} /> DISMISS
        </button>
      </div>
    </div>
  );
}
