// HeatmapOverlay.jsx — Pressure/supply heatmap visualization
import React from 'react';

export default function HeatmapOverlay({ zones, nodes, mode }) {
  if (!mode || (!zones && !nodes)) return null;

  const getHeatColor = (value, type) => {
    if (type === 'pressure') {
      // Pressure: 0-150 PSI, optimal 70-100
      if (value >= 70 && value <= 100) return 'rgba(34,197,94,0.3)'; // Green
      if (value >= 50 && value < 70) return 'rgba(234,179,8,0.4)'; // Yellow
      if (value >= 40 && value < 50) return 'rgba(249,115,22,0.5)'; // Orange
      return 'rgba(220,38,38,0.6)'; // Red
    } else {
      // Supply ratio: 0-1
      if (value >= 0.9) return 'rgba(34,197,94,0.3)'; // Green
      if (value >= 0.75) return 'rgba(234,179,8,0.4)'; // Yellow
      if (value >= 0.5) return 'rgba(249,115,22,0.5)'; // Orange
      return 'rgba(220,38,38,0.6)'; // Red
    }
  };

  return (
    <g className="heatmap-overlay">
      {/* Zone heatmap (supply ratio) */}
      {mode === 'supply' && zones && zones.map((zone) => {
        const ratio = zone.demandCurrent > 0 ? zone.supplyCurrent / zone.demandCurrent : 1;
        const color = getHeatColor(ratio, 'supply');
        const pos = zone.position;

        return (
          <g key={zone.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle r="80" fill={color}>
              <animate
                attributeName="opacity"
                values="0.3;0.6;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              y="-50"
              textAnchor="middle"
              fill="#fff"
              fontSize="10"
              fontWeight="700"
              style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
            >
              {(ratio * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}

      {/* Node heatmap (pressure) */}
      {mode === 'pressure' && nodes && nodes.map((node) => {
        const pressure = node.sensors?.pressure?.value || node.pressure || 0;
        const color = getHeatColor(pressure, 'pressure');
        const pos = node.position;

        return (
          <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle r="40" fill={color}>
              <animate
                attributeName="opacity"
                values="0.3;0.6;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              y="-25"
              textAnchor="middle"
              fill="#fff"
              fontSize="9"
              fontWeight="700"
              style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
            >
              {Math.round(pressure)} PSI
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(20, 20)">
        <rect
          x="0"
          y="0"
          width="180"
          height="100"
          rx="6"
          fill="rgba(15,23,42,0.95)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <text x="90" y="20" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="700">
          HEATMAP: {mode.toUpperCase()}
        </text>

        <g transform="translate(10, 35)">
          <circle r="6" fill="rgba(34,197,94,0.5)" />
          <text x="15" y="4" fill="#cbd5e1" fontSize="9">Optimal</text>
        </g>

        <g transform="translate(10, 55)">
          <circle r="6" fill="rgba(234,179,8,0.5)" />
          <text x="15" y="4" fill="#cbd5e1" fontSize="9">Warning</text>
        </g>

        <g transform="translate(10, 75)">
          <circle r="6" fill="rgba(220,38,38,0.6)" />
          <text x="15" y="4" fill="#cbd5e1" fontSize="9">Critical</text>
        </g>
      </g>
    </g>
  );
}
