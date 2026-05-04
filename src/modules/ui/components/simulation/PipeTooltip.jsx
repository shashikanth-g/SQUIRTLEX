// PipeTooltip.jsx — Pipe hover info
import React from 'react';

export default function PipeTooltip({ pipe, mousePos }) {
  if (!pipe) return null;

  const statusColor =
    pipe.status === 'blocked' ? '#dc2626' :
    pipe.status === 'leak' ? '#f59e0b' :
    '#0ea5e9';

  return (
    <div
      className="pipe-tooltip"
      style={{
        position: 'absolute',
        left: mousePos.x + 15,
        top: mousePos.y - 20,
        background: 'rgba(15,23,42,0.98)',
        border: `2px solid ${statusColor}`,
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#f1f5f9',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        zIndex: 1000,
        pointerEvents: 'none',
        minWidth: '200px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: statusColor }}>
        Pipe {pipe.id}
      </div>
      <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
        <span style={{ color: '#94a3b8' }}>Status:</span>{' '}
        <span style={{ fontWeight: 600, color: statusColor }}>
          {pipe.status.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
        <span style={{ color: '#94a3b8' }}>Flow:</span>{' '}
        <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
          {Math.round(pipe.flowRate)} L/min
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
        <span style={{ color: '#94a3b8' }}>Capacity:</span>{' '}
        <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
          {pipe.capacity || 'N/A'} L/min
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
        <span style={{ color: '#94a3b8' }}>Diameter:</span>{' '}
        <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
          {pipe.diameter}mm
        </span>
      </div>

      {/* Pipe aging info */}
      {pipe.condition !== undefined && (
        <>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '6px 0' }} />
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Material:</span>{' '}
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {pipe.material || 'Unknown'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Age:</span>{' '}
            <span style={{ fontWeight: 600 }}>
              {pipe.ageYears || 0} years
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Condition:</span>{' '}
            <span style={{
              fontWeight: 700,
              color: pipe.condition >= 60 ? '#6BCF7F' : pipe.condition >= 40 ? '#FFD93D' : '#FF6B6B'
            }}>
              {Math.round(pipe.condition)}%
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            <span style={{ color: '#94a3b8' }}>Risk:</span>{' '}
            <span style={{
              fontWeight: 700,
              textTransform: 'uppercase',
              color: pipe.riskLevel === 'low' ? '#6BCF7F' : pipe.riskLevel === 'medium' ? '#FFD93D' : '#FF6B6B'
            }}>
              {pipe.riskLevel || 'N/A'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
