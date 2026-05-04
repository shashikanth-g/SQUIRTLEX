// FeederLines.jsx — Thin dotted connections from nodes to zones
import React from 'react';

export default function FeederLines({ zones, positionsMap }) {
  if (!zones || !positionsMap) return null;

  return (
    <g className="feeder-lines">
      {zones.map((zone) => {
        const zonePos = zone.position;
        const nodePos = positionsMap[zone.connectedNode];

        if (!zonePos || !nodePos) return null;

        const isIndustrial = zone.type === 'industrial';
        const color = isIndustrial ? '#f97316' : '#0ea5e9';

        return (
          <line
            key={zone.id}
            x1={nodePos.x}
            y1={nodePos.y}
            x2={zonePos.x}
            y2={zonePos.y}
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="4,3"
            opacity="0.4"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}
