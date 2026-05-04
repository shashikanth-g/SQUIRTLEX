// WastewaterFlow.jsx — Industrial wastewater discharge visualization

import React from 'react';

const IND1_POSITION = { x: 600, y: 150 };
const RIVER_DISCHARGE_POINT = { x: 600, y: 320 };

export default function WastewaterFlow({ industrialZone }) {
  if (!industrialZone?.wastewater) return null;

  const pollutionLevel = industrialZone.wastewater.pollutionLevel || 0;
  const isDischarging = pollutionLevel > 0;

  if (!isDischarging) return null;

  return (
    <g className="wastewater-flow">
      {/* Discharge pipe */}
      <line
        x1={IND1_POSITION.x}
        y1={IND1_POSITION.y}
        x2={RIVER_DISCHARGE_POINT.x}
        y2={RIVER_DISCHARGE_POINT.y}
        stroke="#8B7355"
        strokeWidth="4"
        opacity="0.7"
        strokeDasharray="5,3"
      />

      {/* Animated pollution particles */}
      {[0, 0.5, 1, 1.5, 2].map((delay) => (
        <circle key={delay} r="4" fill="#6B5844" opacity="0.8">
          <animateMotion
            path={`M ${IND1_POSITION.x} ${IND1_POSITION.y} L ${RIVER_DISCHARGE_POINT.x} ${RIVER_DISCHARGE_POINT.y}`}
            dur="4s"
            repeatCount="indefinite"
            begin={`${delay}s`}
          />
        </circle>
      ))}

      {/* Pollution cloud spreading in river */}
      <ellipse
        cx={RIVER_DISCHARGE_POINT.x + 80}
        cy={RIVER_DISCHARGE_POINT.y}
        rx="60"
        ry="25"
        fill="#6B5844"
        opacity="0.3"
        className="pollution-cloud"
      >
        <animate
          attributeName="rx"
          values="60;65;60"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.3;0.4;0.3"
          dur="3s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Warning label */}
      <g transform={`translate(${RIVER_DISCHARGE_POINT.x + 80}, ${RIVER_DISCHARGE_POINT.y + 40})`}>
        <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#6B5844" opacity="0.9" />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="600"
        >
          ⚠ DISCHARGE ACTIVE
        </text>
      </g>
    </g>
  );
}
