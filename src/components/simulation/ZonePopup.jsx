// ZonePopup.jsx — Zone detail modal
import React from 'react';
import { X } from 'lucide-react';

export default function ZonePopup({ zone, onClose, issues, actions }) {
  if (!zone) return null;

  const ratio = zone.demandCurrent > 0 ? zone.supplyCurrent / zone.demandCurrent : 1;
  const statusColor = ratio >= 0.9 ? '#16a34a' : ratio >= 0.75 ? '#f59e0b' : '#dc2626';

  const zoneIssues = issues?.filter((i) => i.zoneId === zone.id) || [];
  const zoneActions = actions?.filter((a) => a.zoneId === zone.id) || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(15,23,42,0.98)',
        border: '2px solid #334155',
        borderRadius: '12px',
        padding: '24px',
        color: '#f1f5f9',
        zIndex: 2000,
        minWidth: '400px',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
            {zone.name}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>
            {zone.type}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Status section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#cbd5e1' }}>
          Water Supply Status
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Supply</span>
          <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
            {Math.round(zone.supplyCurrent)} L/min
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Demand</span>
          <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
            {Math.round(zone.demandCurrent)} L/min
          </span>
        </div>

        {/* Supply bar */}
        <div style={{ height: '8px', background: 'rgba(100,116,139,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, ratio * 100)}%`,
              height: '100%',
              background: statusColor,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
          {(ratio * 100).toFixed(1)}% supplied
        </div>
      </div>

      {/* Population */}
      {zone.population && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#cbd5e1' }}>
            Population
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            {zone.population.toLocaleString()} residents
          </div>
        </div>
      )}

      {/* Active issues */}
      {zoneIssues.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#f87171' }}>
            ⚠ Active Issues ({zoneIssues.length})
          </div>
          {zoneIssues.map((issue) => (
            <div
              key={issue.id}
              style={{
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#fca5a5' }}>
                {issue.type.replace(/_/g, ' ')}
              </div>
              <div style={{ color: '#cbd5e1' }}>{issue.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Active actions */}
      {zoneActions.length > 0 && (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#6BCF7F' }}>
            🔧 Active Actions ({zoneActions.length})
          </div>
          {zoneActions.map((action, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(57,255,20,0.1)',
                border: '1px solid rgba(57,255,20,0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '8px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#6BCF7F' }}>
                {action.type.replace(/_/g, ' ')}
              </div>
              <div style={{ color: '#cbd5e1' }}>{action.reason}</div>
            </div>
          ))}
        </div>
      )}

      {/* No issues state */}
      {zoneIssues.length === 0 && zoneActions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px' }}>
          ✓ All systems operational
        </div>
      )}
    </div>
  );
}
