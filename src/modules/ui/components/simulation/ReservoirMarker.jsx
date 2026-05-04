// ReservoirMarker.jsx — Reservoir tank visualization
import React from 'react';
import { formatVolume } from '@/utils/formatters.js';

export default function ReservoirMarker({ reservoir }) {
  const pos = reservoir.position;
  const pct = Math.round((reservoir.currentLevel / reservoir.capacity) * 100);
  const fillHeight = (pct / 100) * 70;
  const color = pct > 50 ? '#00D4FF' : pct > 25 ? '#FFD93D' : '#FF6B6B';
  const isLow = pct < 30;
  const isCritical = pct < 15;

  return (
    <g className="reservoir-marker" transform={`translate(${pos.x}, ${pos.y})`}>
      {/* Tank outline */}
      <rect
        x="-40" y="-40"
        width="80" height="85"
        rx="8"
        fill="rgba(0,212,255,0.05)"
        stroke={color}
        strokeWidth="2"
        opacity={isCritical ? 0.9 : 0.6}
      />

      {/* Water level gradient fill */}
      <defs>
        <linearGradient id={`water-gradient-${reservoir.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <clipPath id={`tank-clip-${reservoir.id}`}>
        <rect x="-37" y="-37" width="74" height="79" rx="6" />
      </clipPath>

      {/* Animated water level */}
      <rect
        x="-37"
        y={-37 + (79 - fillHeight)}
        width="74"
        height={fillHeight}
        fill={`url(#water-gradient-${reservoir.id})`}
        clipPath={`url(#tank-clip-${reservoir.id})`}
      >
        <animate
          attributeName="y"
          values={`${-37 + (79 - fillHeight) - 1};${-37 + (79 - fillHeight) + 1};${-37 + (79 - fillHeight) - 1}`}
          dur="3s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Wave effect on surface */}
      <path
        d={`M -37 ${-37 + (79 - fillHeight)} Q -20 ${-37 + (79 - fillHeight) - 2} 0 ${-37 + (79 - fillHeight)} Q 20 ${-37 + (79 - fillHeight) + 2} 37 ${-37 + (79 - fillHeight)}`}
        fill={color}
        opacity="0.3"
        clipPath={`url(#tank-clip-${reservoir.id})`}
      >
        <animate
          attributeName="d"
          values={`M -37 ${-37 + (79 - fillHeight)} Q -20 ${-37 + (79 - fillHeight) - 2} 0 ${-37 + (79 - fillHeight)} Q 20 ${-37 + (79 - fillHeight) + 2} 37 ${-37 + (79 - fillHeight)};M -37 ${-37 + (79 - fillHeight)} Q -20 ${-37 + (79 - fillHeight) + 2} 0 ${-37 + (79 - fillHeight)} Q 20 ${-37 + (79 - fillHeight) - 2} 37 ${-37 + (79 - fillHeight)};M -37 ${-37 + (79 - fillHeight)} Q -20 ${-37 + (79 - fillHeight) - 2} 0 ${-37 + (79 - fillHeight)} Q 20 ${-37 + (79 - fillHeight) + 2} 37 ${-37 + (79 - fillHeight)}`}
          dur="4s"
          repeatCount="indefinite"
        />
      </path>

      {/* Level percentage */}
      <text y="-5" textAnchor="middle" fill={color} fontSize="18" fontFamily="JetBrains Mono" fontWeight="700">
        {pct}%
      </text>

      {/* Volume display */}
      <text y="12" textAnchor="middle" fill="#8FA3B0" fontSize="8" fontFamily="JetBrains Mono">
        {formatVolume(reservoir.currentLevel)}
      </text>

      {/* Capacity */}
      <text y="23" textAnchor="middle" fill="#5A6C7D" fontSize="7" fontFamily="Inter">
        / {formatVolume(reservoir.capacity)}
      </text>

      {/* Pressure output */}
      <text y="35" textAnchor="middle" fill="#5A6C7D" fontSize="7" fontFamily="Inter">
        {Math.round(reservoir.outputPressure)} PSI
      </text>

      {/* Warning indicator when low */}
      {isLow && (
        <g transform="translate(32, -32)">
          <circle r="10" fill={isCritical ? '#FF6B6B' : '#FFD93D'} opacity="0.95">
            {isCritical && (
              <animate
                attributeName="r"
                values="10;12;10"
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
            fill="#FFFFFF"
            fontWeight="700"
          >
            !
          </text>
        </g>
      )}

      {/* Depletion warning label */}
      {isCritical && (
        <g transform="translate(0, 52)">
          <rect x="-35" y="0" width="70" height="16" rx="4" fill="#FF6B6B" opacity="0.9" />
          <text
            x="0"
            y="10"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fill="#FFFFFF"
            fontWeight="600"
          >
            CRITICAL LOW
          </text>
        </g>
      )}
    </g>
  );
}
