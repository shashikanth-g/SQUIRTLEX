// ContaminationFlowLayer.jsx — Visualizes contaminated water flows to treatment plant
import React from 'react';

export default function ContaminationFlowLayer({ zones, treatmentPlant, treatmentState }) {
  if (!treatmentPlant || !zones || !treatmentState) return null;

  const contaminatedZones = zones.filter((z) => z.isContaminated);
  const tpX = treatmentPlant.position?.x || 950;
  const tpY = treatmentPlant.position?.y || 500;
  const resX = 100; // Reservoir R1
  const resY = 100;

  return (
    <g className="contamination-flow-layer">
      <defs>
        <filter id="glow-brown">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. SEWAGE FLOW: Industrial → TP1 */}
      {contaminatedZones.map((zone) => {
        if (!zone.position) return null;
        const zX = zone.position.x;
        const zY = zone.position.y;
        const pathD = `M ${zX} ${zY} L 600 380 L ${tpX} ${tpY}`; // Via River

        return (
          <g key={`flow-${zone.id}`}>
            {/* Red Dashed Pipe */}
            <path
              d={pathD}
              stroke="#ff4d4d"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,4"
              opacity="0.8"
              filter="url(#glow-red)"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
            </path>

            {/* Animation particles moving toward plant */}
            {[0, 0.25, 0.5, 0.75].map((offset, i) => (
              <circle key={i} r="3" fill="#8B4513">
                <animateMotion path={pathD} dur="4s" repeatCount="indefinite" begin={`${offset * 4}s`} />
              </circle>
            ))}
          </g>
        );
      })}

      {/* 2. RETURN FLOW: TP1 → Reservoir (BLUE) */}
      {treatmentState.active && (
        <g>
          <path
            id="returnPath"
            d={`M ${tpX} ${tpY} Q ${(tpX + resX) / 2} ${(tpY + resY) / 2 - 100} ${resX} ${resY}`}
            stroke="#00D4FF"
            strokeWidth="3"
            fill="none"
            strokeDasharray="10,5"
            opacity="0.6"
          >
             <animate attributeName="stroke-dashoffset" from="0" to="-15" dur="1s" repeatCount="indefinite" />
          </path>
          
          {/* Blue particles returning if processing is nearing completion or active */}
          {treatmentState.treatedFlow > 0 && [0, 0.5].map((offset, i) => (
            <circle key={`clean-${i}`} r="3" fill="#00D4FF">
              <animateMotion dur="3s" repeatCount="indefinite" begin={`${offset * 3}s`}>
                <mpath href="#returnPath" />
              </animateMotion>
            </circle>
          ))}
        </g>
      )}

      {/* 3. Plant Status Visuals */}
      <g transform={`translate(${tpX}, ${tpY})`}>
        {treatmentState.active && (
          <>
            <circle r="40" fill="none" stroke={treatmentState.treatedFlow > 0 ? "#6BCF7F" : "#ff9900"} strokeWidth="2" opacity="0.3">
               <animate attributeName="r" values="35;45;35" dur="2s" repeatCount="indefinite" />
            </circle>
            <text y="-50" textAnchor="middle" fontSize="11" fontWeight="bold" fill={treatmentState.treatedFlow > 0 ? "#6BCF7F" : "#ff9900"}>
              {treatmentState.treatedFlow > 0 ? "PURIFICATION COMPLETE" : "TREATING WASTEWATER..."}
            </text>
          </>
        )}
      </g>
    </g>
  );
}
