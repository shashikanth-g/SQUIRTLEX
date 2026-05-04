// RiverLayer.jsx — Large animated river with dynamic pollution
import React from 'react';

export default function RiverLayer({ rivers, industrialZones, zones = [] }) {
  if (!rivers || rivers.length === 0) return null;

  // Calculate total pollution from industrial zones + contaminated zones
  const industrialPollution = (industrialZones || [])
    .filter(z => z.wastewater)
    .reduce((sum, z) => sum + (z.wastewater.pollutionLevel || 0), 0);

  // Add contamination from any contaminated zones
  const contaminationBonus = zones
    .filter(z => z.isContaminated)
    .length * 30; // Each contaminated zone adds pollution

  const totalPollution = industrialPollution + contaminationBonus;
  const avgPollution = Math.min(100, totalPollution / Math.max(1, industrialZones?.length || 1));

  // Pollution threshold determines gradient position
  const pollutionThreshold = avgPollution > 60 ? 0.4 : avgPollution > 40 ? 0.55 : 0.7;

  return (
    <g className="river-layer">
      <defs>
        {/* Dynamic pollution gradient based on industrial output */}
        <linearGradient id="riverQuality" x1="0%" x2="100%">
          <stop offset="0%" stopColor={contaminationBonus > 0 ? "#8B4513" : "#4ECDC4"} stopOpacity="0.8" />
          <stop offset={`${pollutionThreshold * 100 - 5}%`} stopColor={contaminationBonus > 0 ? "#A52A2A" : "#4ECDC4"} stopOpacity="0.8" />
          {/* Transition zone */}
          <stop offset={`${pollutionThreshold * 100}%`} stopColor="#9B8B73" stopOpacity="0.85" />
          <stop offset={`${pollutionThreshold * 100 + 5}%`} stopColor="#8B7355" stopOpacity="0.9" />
          {/* Heavily polluted */}
          <stop offset="100%" stopColor={contaminationBonus > 0 ? "#6B3E2E" : (avgPollution > 70 ? "#6B3E2E" : "#6B5844")} stopOpacity="0.95" />
        </linearGradient>

        {/* Flow ripple pattern */}
        <pattern id="riverFlow" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.15)">
            <animate attributeName="cx" from="0" to="40" dur="4s" repeatCount="indefinite" />
          </circle>
        </pattern>
      </defs>

      {rivers.map((river) => {
        const startX = 0;
        const endX = 1200;
        const midX = endX * pollutionThreshold;
        const y = 380;
        const height = 140; // Larger river (30%+ of height)

        return (
          <g key={river.id}>
            {/* Main river body with gradient */}
            <rect
              x={startX}
              y={y - height / 2}
              width={endX}
              height={height}
              fill="url(#riverQuality)"
              rx="10"
            />

            {/* Flow ripples overlay */}
            <rect
              x={startX}
              y={y - height / 2}
              width={endX}
              height={height}
              fill="url(#riverFlow)"
              opacity="0.3"
            />

            {/* Pollution boundary marker (animated) */}
            {avgPollution > 30 && (
              <line
                x1={midX}
                y1={y - height / 2}
                x2={midX}
                y2={y + height / 2}
                stroke="#dc2626"
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.8"
              >
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </line>
            )}

            {/* Section labels */}
            <g transform={`translate(${midX * 0.5}, ${y - height / 2 - 15})`}>
              <rect
                x="-80"
                y="-10"
                width="160"
                height="22"
                rx="4"
                fill="rgba(78,205,196,0.9)"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0A1628"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.5"
              >
                {contaminationBonus > 0 ? "POLLUTED WATER FLOW" : "CITY RIVER — CLEAN"}
              </text>
            </g>

            {avgPollution > 30 && (
              <g transform={`translate(${midX + (endX - midX) * 0.5}, ${y - height / 2 - 15})`}>
                <rect
                  x="-90"
                  y="-10"
                  width="180"
                  height="22"
                  rx="4"
                  fill="rgba(220,38,38,0.9)"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="0.5"
                >
                  ⚠ POLLUTED ZONE
                </text>
              </g>
            )}

            {/* Pollution level indicator */}
            {avgPollution > 30 && (
              <g transform={`translate(${midX + (endX - midX) * 0.5}, ${y + height / 2 + 25})`}>
                <text
                  textAnchor="middle"
                  fill="#f87171"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                >
                  Pollution: {Math.round(avgPollution)}%
                </text>
              </g>
            )}

            {/* Animated flow arrows */}
            {Array.from({ length: 12 }).map((_, i) => {
              const xPos = (i + 0.5) * (endX / 12);
              const isPolluted = xPos > midX;
              const arrowColor = isPolluted ? "#E8F1F5" : "#0A1628";
              return (
                <g key={i} transform={`translate(${xPos}, ${y})`}>
                  <polygon points="0,6 8,0 0,-6" fill={arrowColor} opacity="0.5">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="-40 0"
                      to="40 0"
                      dur="4s"
                      repeatCount="indefinite"
                      begin={`${i * 0.33}s`}
                    />
                  </polygon>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
