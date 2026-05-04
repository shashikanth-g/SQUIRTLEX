// Alerts.jsx — Alert management page
import React, { useState } from 'react';
import AlertFeed from '../components/alerts/AlertFeed.jsx';
import WaterSafetyAlert from '../components/alerts/WaterSafetyAlert.jsx';
import { useSimulation } from '../context/SimulationContext.jsx';
import { Bell, Filter, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Alerts() {
  const { alerts, networkState } = useSimulation();
  const [filter, setFilter] = useState('all');

  const allAlerts = alerts || [];
  const activeAlerts = allAlerts.filter((a) => !a?.dismissed);
  const criticalAlerts = activeAlerts.filter((a) => a?.severity === 'critical');
  const warningAlerts = activeAlerts.filter((a) => a?.severity === 'warning');
  const resolvedAlerts = allAlerts.filter((a) => a?.dismissed);

  // Water quality alert from contamination issues
  const contaminationIssue = activeAlerts.find((a) => a?.type === 'CONTAMINATION' || a?.type === 'SEWAGE_INFLOW');
  const contaminatedZone = contaminationIssue && networkState?.zones?.find((z) => z?.id === contaminationIssue.zoneId);
  const waterSafetySeverity = contaminationIssue ? contaminationIssue.severity : null;

  return (
    <div className="page alerts-page">
      <div className="page-header">
        <h2>Alert Management</h2>
        <span className="page-subtitle">Monitor, resolve, and manage system alerts</span>
      </div>

      {/* Water Safety Alert */}
      {waterSafetySeverity && (
        <WaterSafetyAlert
          severity={waterSafetySeverity}
          zone={contaminatedZone}
          status={contaminationIssue?.lifecycle}
        />
      )}

      {/* Alert stats */}
      <div className="alert-stats">
        <div className="alert-stat" onClick={() => setFilter('all')}>
          <Bell size={20} className="text-primary" />
          <span className="alert-stat-value">{activeAlerts.length}</span>
          <span className="alert-stat-label">Total Active</span>
        </div>
        <div className="alert-stat" onClick={() => setFilter('critical')}>
          <ShieldAlert size={20} style={{ color: '#FF6B6B' }} />
          <span className="alert-stat-value" style={{ color: '#FF6B6B' }}>{criticalAlerts.length}</span>
          <span className="alert-stat-label">Critical</span>
        </div>
        <div className="alert-stat" onClick={() => setFilter('warning')}>
          <AlertTriangle size={20} style={{ color: '#FFD93D' }} />
          <span className="alert-stat-value" style={{ color: '#FFD93D' }}>{warningAlerts.length}</span>
          <span className="alert-stat-label">Warning</span>
        </div>
        <div className="alert-stat" onClick={() => setFilter('resolved')}>
          <CheckCircle size={20} style={{ color: '#6BCF7F' }} />
          <span className="alert-stat-value" style={{ color: '#6BCF7F' }}>{resolvedAlerts.length}</span>
          <span className="alert-stat-label">Resolved</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="filter-pills">
        {['all', 'critical', 'warning', 'resolved'].map((f) => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <AlertFeed maxItems={50} />
    </div>
  );
}
