// AlertFeed.jsx — Real-time alert stream
import React from 'react';
import { useSimulation } from '@sim/../context/SimulationContext.jsx';
import AlertCard from './AlertCard.jsx';
import { Bell, CheckCircle } from 'lucide-react';

export default function AlertFeed({ maxItems = 20 }) {
  const { alerts } = useSimulation();
  const allAlerts = alerts || [];
  const activeAlerts = allAlerts.filter((a) => !a?.dismissed).slice(0, maxItems);
  const dismissedCount = allAlerts.filter((a) => a?.dismissed).length;

  return (
    <div className="alert-feed">
      <div className="alert-feed-header">
        <div className="feed-title">
          <Bell size={16} />
          <h3>Live Alert Feed</h3>
          {activeAlerts.length > 0 && (
            <span className="alert-count-badge">{activeAlerts.length}</span>
          )}
        </div>
        {dismissedCount > 0 && (
          <span className="dismissed-count">
            <CheckCircle size={12} /> {dismissedCount} resolved
          </span>
        )}
      </div>

      <div className="alert-feed-list">
        {activeAlerts.length === 0 ? (
          <div className="no-alerts">
            <CheckCircle size={32} className="no-alerts-icon" />
            <p>All systems nominal</p>
            <span>No active alerts</span>
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <AlertCard key={alert?.id || Math.random()} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
