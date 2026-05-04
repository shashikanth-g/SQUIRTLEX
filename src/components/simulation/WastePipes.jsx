// WastePipes.jsx — Brown dashed lines from industrial zones to river
import React from 'react';

export default function WastePipes({ industrialZones }) {
  if (!industrialZones || industrialZones.length === 0) return null;

  return (
    <g className="waste-pipes">
      {industrialZones.map((zone) => {
        if (!zone.wastewater || !zone.wastewater.riverConnection) return null;

        const startPos = zone.position;
        const endPos = zone.wastewater.riverConnection;
        const pollutionLevel = zone.wastewater.pollutionLevel || 0;

        // Color intensity based on pollution
        const color = pollutionLevel > 70 ? '#6B3E2E' : pollutionLevel > 40 ? '#8B5E3C' : '#A67C52';

        return (
          <g key={zone.id}>
            {/* Waste pipe */}
            <line
              x1={startPos.x}
              y1={startPos.y}
              x2={endPos.x}
              y2={endPos.y}
              stroke={color}
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.7"
              strokeLinecap="round"
            />

            {/* Animated waste flow particles */}
            {Array.from({ length: 3 }).map((_, i) => (
              <circle key={i} r="2.5" fill={color} opacity="0.8">
                <animateMotion
                  path={`M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`}
                  dur="4s"
                  repeatCount="indefinite"
                  begin={`${i * 1.33}s`}
                />
              </circle>
            ))}

            {/* Discharge point indicator */}
            <g transform={`translate(${endPos.x}, ${endPos.y})`}>
              <circle r="6" fill={color} opacity="0.6">
                <animate
                  attributeName="r"
                  values="6;10;6"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.3;0.6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <text
                y="20"
                textAnchor="middle"
                fill={color}
                fontSize="8"
                fontWeight="600"
              >
                ⚠ DISCHARGE
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
