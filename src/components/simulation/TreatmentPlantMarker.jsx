// TreatmentPlantMarker.jsx — Water treatment facility on light-background map
import React from 'react';

export default function TreatmentPlantMarker({ plant }) {
  const { position, id, efficiency = 85 } = plant;
  const effColor = efficiency > 80 ? '#16a34a' : efficiency > 60 ? '#d97706' : '#dc2626';

  return (
    <g transform={`translate(${position.x}, ${position.y})`} className="treatment-plant">
      {/* Card */}
      <rect x="-22" y="-22" width="44" height="44" rx="6"
        fill="rgba(255,255,255,0.9)"
        stroke="#4ECDC4"
        strokeWidth="1.5"
      />
      {/* Top accent */}
      <rect x="-22" y="-22" width="44" height="4" rx="3" fill="#4ECDC4" opacity="0.7" />

      {/* Chimney stacks */}
      <rect x="-10" y="-22" width="5" height="8" rx="1" fill="#94a3b8" />
      <rect x="5" y="-22" width="5" height="8" rx="1" fill="#94a3b8" />

      {/* Factory symbol */}
      <text x="0" y="6" textAnchor="middle" fontSize="18">🏭</text>

      {/* Efficiency bar */}
      <rect x="-15" y="16" width="30" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="-15" y="16" width={30 * (efficiency / 100)} height="3" rx="1.5" fill={effColor} />

      {/* Label */}
      <text y="32" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="600" fontFamily="JetBrains Mono">
        {id}
      </text>
    </g>
  );
}
