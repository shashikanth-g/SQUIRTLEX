// BuildingMarker.jsx — Large city-style zone blocks with realistic visuals
import React from 'react';

export default function BuildingMarker({ zone, onClick }) {
  const pos = zone.position;
  const ratio = zone.demandCurrent > 0 ? zone.supplyCurrent / zone.demandCurrent : 1;
  const color = ratio >= 0.9 ? '#16a34a' : ratio >= 0.75 ? '#f59e0b' : '#dc2626';
  const statusLabel = ratio >= 0.9 ? 'OPTIMAL' : ratio >= 0.75 ? 'LOW SUPPLY' : 'CRITICAL';

  const getZoneVisual = () => {
    switch (zone.type) {
      case 'residential':
        return {
          emoji: '🏠',
          bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,197,253,0.1))',
          borderColor: '#3b82f6',
          glowColor: '#60a5fa',
        };
      case 'industrial':
        return {
          emoji: '🏭',
          bgGradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,146,60,0.1))',
          borderColor: '#f97316',
          glowColor: '#fb923c',
        };
      case 'school':
        return {
          emoji: '🏫',
          bgGradient: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(250,204,21,0.1))',
          borderColor: '#eab308',
          glowColor: '#facc15',
        };
      case 'hospital':
        return {
          emoji: '🏥',
          bgGradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.1))',
          borderColor: '#ef4444',
          glowColor: '#f87171',
        };
      default:
        return {
          emoji: '🏘️',
          bgGradient: 'linear-gradient(135deg, rgba(100,116,139,0.15), rgba(148,163,184,0.1))',
          borderColor: '#64748b',
          glowColor: '#94a3b8',
        };
    }
  };

  const visual = getZoneVisual();
  const isContaminated = zone.waterQuality === 'poor' || zone.waterQuality === 'contaminated';
  const isCriticalInfra = zone.type === 'school' || zone.type === 'hospital';
  const showCriticalWarning = isContaminated && isCriticalInfra;
  const hasIssue = ratio < 0.75 || showCriticalWarning;

  return (
    <g
      className="building-marker"
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Critical pulsing glow */}
      {hasIssue && (
        <rect
          x="-72"
          y="-52"
          width="144"
          height="104"
          rx="12"
          fill="none"
          stroke={showCriticalWarning ? '#dc2626' : color}
          strokeWidth="3"
          opacity="0.6"
        >
          <animate
            attributeName="opacity"
            values="0.3;0.8;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values="3;5;3"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Main zone container (2x larger) */}
      <rect
        x="-70"
        y="-50"
        width="140"
        height="100"
        rx="10"
        fill="url(#zone-gradient)"
        stroke={showCriticalWarning ? '#dc2626' : visual.borderColor}
        strokeWidth="2"
        opacity="0.95"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="zone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(30,41,59,0.95)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.98)" />
        </linearGradient>
      </defs>

      {/* Colored accent bar (top) */}
      <rect
        x="-70"
        y="-50"
        width="140"
        height="6"
        rx="10"
        fill={visual.borderColor}
        opacity="0.8"
      />

      {/* Zone type emoji (large) */}
      <text x="-50" y="-15" fontSize="28" textAnchor="middle">
        {visual.emoji}
      </text>

      {/* Zone name */}
      <text
        x="10"
        y="-30"
        fill="#f1f5f9"
        fontSize="11"
        fontWeight="700"
        fontFamily="Inter"
      >
        {zone.name}
      </text>

      {/* Zone type label */}
      <text
        x="10"
        y="-16"
        fill="#94a3b8"
        fontSize="8"
        fontWeight="500"
        fontFamily="Inter"
      >
        {zone.type.toUpperCase()}
      </text>

      {/* Status badge */}
      <rect
        x="-68"
        y="-8"
        width={statusLabel.length * 5.5 + 8}
        height="14"
        rx="3"
        fill={color}
        opacity="0.2"
      />
      <text
        x="-64"
        y="2"
        fill={color}
        fontSize="7"
        fontWeight="700"
        fontFamily="Inter"
      >
        {statusLabel}
      </text>

      {/* Supply bar (animated) */}
      <rect x="-68" y="10" width="136" height="6" rx="3" fill="rgba(100,116,139,0.3)" />
      <rect
        x="-68"
        y="10"
        width={Math.min(136, 136 * ratio)}
        height="6"
        rx="3"
        fill={color}
      >
        <animate
          attributeName="width"
          from="0"
          to={Math.min(136, 136 * ratio)}
          dur="1s"
          fill="freeze"
        />
      </rect>

      {/* Supply / Demand values */}
      <text x="-68" y="28" fill="#cbd5e1" fontSize="9" fontFamily="JetBrains Mono">
        Supply: {Math.round(zone.supplyCurrent)} L/min
      </text>
      <text x="-68" y="40" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
        Demand: {Math.round(zone.demandCurrent)} L/min
      </text>

      {/* Population indicator */}
      {zone.population && (
        <g transform="translate(-68, 48)">
          <text fill="#64748b" fontSize="8" fontFamily="Inter">
            👥 {(zone.population / 1000).toFixed(1)}k residents
          </text>
        </g>
      )}

      {/* Critical contamination warning */}
      {showCriticalWarning && (
        <g transform="translate(50, -35)">
          <circle r="16" fill="#dc2626" opacity="0.95">
            <animate
              attributeName="r"
              values="14;18;14"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="18"
            fill="#fff"
            fontWeight="700"
          >
            !
          </text>
        </g>
      )}

      {/* Contamination banner */}
      {showCriticalWarning && (
        <g transform="translate(0, 58)">
          <rect x="-68" y="0" width="136" height="18" rx="4" fill="#dc2626" opacity="0.95" />
          <text
            x="0"
            y="11"
            textAnchor="middle"
            fontSize="9"
            fill="#fff"
            fontWeight="700"
          >
            ⚠ CONTAMINATED WATER
          </text>
        </g>
      )}

      {/* Industrial smoke animation */}
      {zone.type === 'industrial' && (
        <g transform="translate(-50, -60)">
          <circle r="3" fill="#94a3b8" opacity="0.3">
            <animate attributeName="cy" from="0" to="-20" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#94a3b8" opacity="0.3">
            <animate attributeName="cy" from="0" to="-20" dur="3s" repeatCount="indefinite" begin="1s" />
            <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" begin="1s" />
          </circle>
        </g>
      )}

      {/* Hospital priority indicator */}
      {zone.type === 'hospital' && (
        <g transform="translate(50, -30)">
          <rect x="-8" y="-8" width="16" height="16" rx="2" fill="#dc2626" opacity="0.9" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
            fill="#fff"
            fontWeight="700"
          >
            +
          </text>
        </g>
      )}
    </g>
  );
}
