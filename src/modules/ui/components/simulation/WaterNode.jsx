// WaterNode.jsx — Pressure-ring nodes with status glow
import React from 'react';

export default function WaterNode({ node, onHover, onLeave }) {
  const status = getNodeStatus(node);
  const { stroke, fill, labelFill, glowColor } = getColors(status);
  const pos = node.position;
  const pressure = node.sensors?.pressure?.value ?? node.pressure ?? 75;
  const pressurePercent = Math.min(100, Math.max(0, pressure / 1.2)); // Scale to 0-100

  return (
    <g
      className="water-node"
      transform={`translate(${pos.x}, ${pos.y})`}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={onLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer pressure ring */}
      <circle
        cx="0"
        cy="0"
        r="14"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2.5"
        opacity="0.4"
      />

      {/* Pressure fill arc (proportional to pressure) */}
      <circle
        cx="0"
        cy="0"
        r="14"
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        opacity="0.8"
        strokeDasharray={`${(pressurePercent / 100) * 88} 88`}
        transform="rotate(-90)"
      />

      {/* Glow effect for critical/warning */}
      {status !== 'normal' && (
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="none"
          stroke={glowColor}
          strokeWidth="2"
          opacity="0.3"
        >
          <animate
            attributeName="r"
            values="18;22;18"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.3;0.6;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Core node shape */}
      {renderShape(node.type, fill, stroke)}

      {/* Pressure value (small) */}
      <text
        y="2"
        textAnchor="middle"
        fill="#1e293b"
        fontSize="7"
        fontWeight="700"
        style={{ userSelect: 'none' }}
      >
        {Math.round(pressure)}
      </text>

      {/* Node ID label */}
      <text
        y="26"
        textAnchor="middle"
        fill={labelFill}
        fontSize="8"
        fontWeight="600"
        fontFamily="JetBrains Mono"
        style={{ userSelect: 'none' }}
      >
        {node.id}
      </text>
    </g>
  );
}

function renderShape(type, fill, stroke) {
  switch (type) {
    case 'pump':
      return (
        <g>
          <polygon points="0,-10 9,5 -9,5"
            fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="0" cy="0" r="3" fill={stroke} />
        </g>
      );
    case 'reservoir':
      return (
        <rect x="-11" y="-8" width="22" height="16" rx="4"
          fill={fill} stroke={stroke} strokeWidth="2" />
      );
    default: // junction
      return (
        <circle cx="0" cy="0" r="8"
          fill={fill} stroke={stroke} strokeWidth="2" />
      );
  }
}

function getNodeStatus(node) {
  if (node.quality?.status === 'unsafe') return 'critical';
  const p = node.sensors?.pressure?.value ?? node.pressure ?? 75;
  if (p < 40 || p > 110) return 'critical';
  if (p < 60 || p > 95)  return 'warning';
  return 'normal';
}

function getColors(status) {
  switch (status) {
    case 'critical':
      return {
        stroke: '#dc2626',
        fill: 'rgba(220,38,38,0.2)',
        labelFill: '#991b1b',
        glowColor: '#dc2626',
      };
    case 'warning':
      return {
        stroke: '#f59e0b',
        fill: 'rgba(245,158,11,0.2)',
        labelFill: '#92400e',
        glowColor: '#f59e0b',
      };
    default:
      return {
        stroke: '#0ea5e9',
        fill: 'rgba(14,165,233,0.2)',
        labelFill: '#0c4a6e',
        glowColor: '#0ea5e9',
      };
  }
}
