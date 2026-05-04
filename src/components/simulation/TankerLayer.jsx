// TankerLayer.jsx — Animated tanker vehicles on SVG map
import React from 'react';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
  in_transit: '#00D4FF', // Bright cyan
  delivering:  '#6BCF7F', // Bright green
  returning:   '#FFD93D', // Bright yellow
  idle:        '#94A3B8', // Gray
};

export default function TankerLayer({ tankers }) {
  if (!tankers || tankers.length === 0) return null;

  return (
    <g className="tanker-layer">
      {tankers.map((tanker) => {
        const color = STATUS_COLORS[tanker.status] || '#00D4FF';
        const loadPct = tanker.currentLoad / tanker.capacity;

        return (
          <motion.g
            key={tanker.id}
            animate={{ x: tanker.position.x, y: tanker.position.y }}
            transition={{ type: 'tween', ease: 'linear', duration: 2.5 }}
          >
            {/* Outer glow ring (pulsing) */}
            <circle r="28" fill="none" stroke={color} strokeWidth="2" opacity="0.25">
              <animate attributeName="r" values="28;34;28" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.1;0.25" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Inner glow */}
            <circle r="22" fill={`${color}15`} stroke="none" />

            {/* Truck cab (larger) */}
            <rect x="-18" y="-14" width="36" height="28" rx="4"
              fill="rgba(255,255,255,0.95)"
              stroke={color}
              strokeWidth="2.5"
            />

            {/* Tank body (larger ellipse) */}
            <ellipse cx="0" cy="-5" rx="13" ry="8"
              fill={`${color}40`}
              stroke={color}
              strokeWidth="1.5"
            />

            {/* Load fill indicator (shrinks as tanker empties) */}
            <ellipse cx="0" cy="-5" rx={13 * loadPct} ry={8 * loadPct}
              fill={`${color}80`}
            >
              {tanker.status === 'delivering' && (
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite" />
              )}
            </ellipse>

            {/* Wheels (larger) */}
            <circle cx="-10" cy="14" r="4" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <circle cx="10"  cy="14" r="4" fill="#1E293B" stroke="#475569" strokeWidth="1" />

            {/* ID label (larger font) */}
            <text
              y="-30"
              textAnchor="middle"
              fill={color}
              fontSize="11"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              style={{ pointerEvents: 'none', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
            >
              {tanker.id}
            </text>

            {/* Status indicator badge */}
            <g transform="translate(14, -14)">
              <circle r="5" fill={color}>
                {tanker.status === 'in_transit' && (
                  <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                )}
                {tanker.status === 'delivering' && (
                  <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                )}
              </circle>
            </g>

            {/* Status text */}
            <text
              y="28"
              textAnchor="middle"
              fill={color}
              fontSize="8"
              fontWeight="600"
              fontFamily="Inter"
              style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
            >
              {tanker.status.replace('_', ' ')}
            </text>
          </motion.g>
        );
      })}
    </g>
  );
}
