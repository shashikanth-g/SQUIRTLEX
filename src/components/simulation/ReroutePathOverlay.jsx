// ReroutePathOverlay.jsx — Visual highlight for active rerouting paths

import React from 'react';

export default function ReroutePathOverlay({ rerouteInfo, nodes, positionsMap }) {
  if (!rerouteInfo?.alternatePath || !nodes) return null;

  const { alternatePath, blockedPipe, targetZone } = rerouteInfo;

  return (
    <g className="reroute-path">
      {/* Draw alternative path in neon green */}
      {alternatePath.map((nodeId, i) => {
        if (i === alternatePath.length - 1) return null;

        const srcPos = positionsMap[nodeId];
        const tgtPos = positionsMap[alternatePath[i + 1]];

        if (!srcPos || !tgtPos) return null;

        return (
          <g key={`reroute-${i}`}>
            <line
              x1={srcPos.x}
              y1={srcPos.y}
              x2={tgtPos.x}
              y2={tgtPos.y}
              stroke="#39FF14"
              strokeWidth="5"
              opacity="0.7"
              strokeDasharray="10,5"
              className="reroute-line"
            />

            {/* Animated flow direction arrow */}
            <polygon points="0,-4 8,0 0,4" fill="#39FF14" opacity="0.8">
              <animateMotion
                path={`M ${srcPos.x} ${srcPos.y} L ${tgtPos.x} ${tgtPos.y}`}
                dur="2s"
                repeatCount="indefinite"
              />
            </polygon>
          </g>
        );
      })}

      {/* Reroute status panel (top center) */}
      <g transform="translate(520, 30)">
        {/* Panel background */}
        <rect
          x="0"
          y="0"
          width="280"
          height="75"
          rx="8"
          fill="rgba(19,32,57,0.95)"
          stroke="#39FF14"
          strokeWidth="2.5"
        />

        {/* Pulsing glow effect */}
        <rect
          x="-2"
          y="-2"
          width="284"
          height="79"
          rx="10"
          fill="none"
          stroke="#39FF14"
          strokeWidth="1"
          opacity="0.4"
        >
          <animate
            attributeName="opacity"
            values="0.2;0.6;0.2"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>

        {/* Title */}
        <text
          x="140"
          y="22"
          textAnchor="middle"
          fontSize="13"
          fill="#39FF14"
          fontWeight="700"
          fontFamily="Inter"
        >
          🔄 AUTO-REROUTING ACTIVE
        </text>

        {/* Blocked pipe info */}
        <text
          x="20"
          y="42"
          fontSize="10"
          fill="#cbd5e1"
          fontFamily="Inter"
        >
          Blocked Pipe:
        </text>
        <text
          x="115"
          y="42"
          fontSize="10"
          fill="#f87171"
          fontWeight="700"
          fontFamily="JetBrains Mono"
        >
          {blockedPipe}
        </text>

        {/* Alternate path info */}
        <text
          x="20"
          y="60"
          fontSize="9"
          fill="#cbd5e1"
          fontFamily="Inter"
        >
          Alternate Path:
        </text>
        <text
          x="115"
          y="60"
          fontSize="9"
          fill="#6BCF7F"
          fontWeight="600"
          fontFamily="JetBrains Mono"
        >
          {alternatePath.slice(0, 3).join(' → ')}
          {alternatePath.length > 3 ? ` → ...${alternatePath.length} nodes` : ''}
          {' → ' + targetZone}
        </text>
      </g>
    </g>
  );
}
