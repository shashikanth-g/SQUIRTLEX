// WaterPipe.jsx — Realistic flow visualization with hard blockage + aging
import React from 'react';
import { pipeAgingManager } from '../../simulation/engine/PipeAgingManager.js';

export default function WaterPipe({ pipe, srcPos, tgtPos }) {
  const isBlocked = pipe.status === 'blocked';
  const isLeak = pipe.status === 'leak';
  const isReroute = pipe.isReroutePath; // Set by reroute overlay

  const isContaminated = pipe.isContaminated;

  const getStrokeColor = () => {
    if (isContaminated) return '#ff4d4d';
    if (isBlocked) return '#dc2626';
    if (isLeak) return '#f59e0b';
    if (isReroute) return '#39FF14';

    // Pipe aging color (if condition exists)
    if (pipe.condition !== undefined && pipe.status === 'normal') {
      return pipeAgingManager.getPipeColor(pipe);
    }

    // Flow-based coloring
    const flow = pipe.flowRate || 0;
    if (flow > 400) return '#0ea5e9'; // High flow: bright blue
    if (flow > 200) return '#06b6d4'; // Medium: cyan
    if (flow > 0) return '#67e8f9'; // Low: light cyan
    return '#94a3b8'; // No flow: gray
  };

  const getStrokeWidth = () => {
    const baseWidth = Math.max(2, Math.min(8, (pipe.diameter || 200) / 80));
    if (isContaminated) return baseWidth * 1.2;
    return isBlocked ? baseWidth * 0.8 : baseWidth;
  };

  const color = getStrokeColor();
  const width = getStrokeWidth();
  const opacity = isBlocked ? 0.3 : 0.7;

  return (
    <g className="water-pipe">
      {/* Main pipe line */}
      <line
        x1={srcPos.x}
        y1={srcPos.y}
        x2={tgtPos.x}
        y2={tgtPos.y}
        stroke={color}
        strokeWidth={width}
        strokeOpacity={opacity}
        strokeDasharray={isContaminated ? '4,4' : (isBlocked ? '8,4' : 'none')}
        strokeLinecap="round"
      />

      {/* Flow particles (ONLY if NOT blocked and has flow) */}
      {!isBlocked && pipe.flowRate > 0 && (
        <FlowParticles
          from={srcPos}
          to={tgtPos}
          speed={Math.max(0.5, pipe.flowRate / 100)}
          color={isReroute ? '#39FF14' : '#00D4FF'}
        />
      )}

      {/* Blockage indicator */}
      {isBlocked && (
        <g transform={`translate(${(srcPos.x + tgtPos.x) / 2}, ${(srcPos.y + tgtPos.y) / 2})`}>
          <circle r="10" fill="#dc2626" opacity="0.9" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize="12"
            fontWeight="700"
          >
            ✕
          </text>
        </g>
      )}

      {/* Leak indicator (droplet animation) */}
      {isLeak && (
        <LeakAnimation srcPos={srcPos} tgtPos={tgtPos} />
      )}
    </g>
  );
}

function LeakAnimation({ srcPos, tgtPos }) {
  // Position leak at 60% along pipe
  const leakX = srcPos.x + (tgtPos.x - srcPos.x) * 0.6;
  const leakY = srcPos.y + (tgtPos.y - srcPos.y) * 0.6;

  return (
    <g transform={`translate(${leakX}, ${leakY})`}>
      {/* Pulsing leak marker */}
      <circle r="8" fill="#f59e0b" opacity="0.6">
        <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Droplet particles falling */}
      {[0, 0.4, 0.8].map((offset, i) => (
        <g key={i}>
          <ellipse rx="2" ry="3" fill="#0ea5e9" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,20; 0,40"
              dur="2s"
              repeatCount="indefinite"
              begin={`${offset * 2}s`}
            />
            <animate
              attributeName="opacity"
              values="0.8;0.6;0"
              dur="2s"
              repeatCount="indefinite"
              begin={`${offset * 2}s`}
            />
          </ellipse>
        </g>
      ))}
    </g>
  );
}

function FlowParticles({ from, to, speed, color }) {
  const particles = [0, 0.33, 0.66]; // 3 particles staggered
  const duration = Math.max(1, 3 / speed);

  return (
    <>
      {particles.map((offset, i) => (
        <circle
          key={i}
          r="3"
          fill={color}
          opacity="0.9"
        >
          <animateMotion
            path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${offset * duration}s`}
          />
        </circle>
      ))}
    </>
  );
}
