// NodeTooltip.jsx — Detailed sensor data with premium styling
import React from 'react';
import { formatNumber, trendArrow } from '@/utils/formatters.js';

export default function NodeTooltip({ node, mousePos }) {
  if (!node) return null;
  const s = node.sensors || {};
  const q = node.quality || {};
  const status = getNodeStatus(node);

  return (
    <div
      className="node-tooltip"
      style={{
        position: 'absolute',
        left: `${(mousePos?.x ?? 0) + 16}px`,
        top: `${(mousePos?.y ?? 0) - 90}px`,
      }}
    >
      <div className="tooltip-header">
        <span className="node-type-badge">{(node.type || 'junction').toUpperCase()}</span>
        <span className="tooltip-id">{node.id}</span>
        <span className={`status-badge ${status}`}>
          {status.toUpperCase()}
        </span>
      </div>
      
      <div className="tooltip-body">
        <SensorRow label="💧 Pressure" value={`${formatNumber(s.pressure?.value ?? node.pressure, 1)} PSI`} trend={s.pressure?.trend} status={s.pressure?.status} />
        <SensorRow label="🌊 Flow Rate" value={`${formatNumber(s.flow?.value ?? node.flow, 0)} L/min`} trend={s.flow?.trend} status={s.flow?.status} />
        <SensorRow label="⚗️ pH Level" value={formatNumber(q.pH ?? s.pH?.value, 2)} trend={s.pH?.trend} status={q.status === 'unsafe' ? 'critical' : 'normal'} />
        <SensorRow label="💊 Turbidity" value={`${formatNumber(q.turbidity ?? s.turbidity?.value, 2)} NTU`} trend={s.turbidity?.trend} status={s.turbidity?.status} />
        <SensorRow label="🌡️ TDS" value={`${formatNumber(q.tds, 0)} PPM`} status="normal" />
      </div>
      
      <div className="tooltip-footer">
        <button className="tooltip-action-btn">
          View Details →
        </button>
      </div>
    </div>
  );
}

function SensorRow({ label, value, trend, status }) {
  return (
    <div className="sensor-row">
      <span className="sensor-label">{label}</span>
      <span className="sensor-value">{value}</span>
      <span className={`trend-indicator ${trend || 'stable'}`}>{trendArrow(trend)}</span>
      <span className={`status-icon ${status || 'normal'}`}>
        {status === 'normal' || !status ? '✓' : '⚠'}
      </span>
    </div>
  );
}

function getNodeStatus(node) {
  if (node.quality?.status === 'unsafe') return 'critical';
  const p = node.sensors?.pressure?.value ?? node.pressure;
  if (p < 40 || p > 110) return 'critical';
  if (p < 60 || p > 90) return 'warning';
  return 'normal';
}
