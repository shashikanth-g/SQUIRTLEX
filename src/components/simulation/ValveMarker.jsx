// ValveMarker.jsx — Diamond-shaped valve on the map
import React from 'react';

export default function ValveMarker({ valve, onClick }) {
  const pct = valve.openPercentage;
  const color = pct >= 80 ? '#6BCF7F' : pct >= 50 ? '#FFD93D' : '#FF8C42';
  const rotation = (pct / 100) * 90; // 0°=closed, 90°=full open
  const pos = valve.position;

  return (
    <g
      className="valve-marker"
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Diamond shape */}
      <rect
        x="-8"
        y="-8"
        width="16"
        height="16"
        fill={`${color}20`}
        stroke={color}
        strokeWidth="1.5"
        transform={`rotate(${45 + rotation})`}
        rx="2"
      />

      {/* Center dot */}
      <circle r="3" fill={color} opacity="0.8" />

      {/* Label */}
      <text y="22" textAnchor="middle" fill="#5A6C7D" fontSize="8" fontFamily="JetBrains Mono">
        {valve.id}
      </text>
      <text y="30" textAnchor="middle" fill={color} fontSize="7" fontFamily="JetBrains Mono">
        {pct}%
      </text>
    </g>
  );
}
