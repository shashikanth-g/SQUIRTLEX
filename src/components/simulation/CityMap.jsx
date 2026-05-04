// CityMap.jsx — Main animated SVG city map with water infrastructure
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import WaterNode from './WaterNode.jsx';
import WaterPipe from './WaterPipe.jsx';
import ValveMarker from './ValveMarker.jsx';
import BuildingMarker from './BuildingMarker.jsx';
import RiverLayer from './RiverLayer.jsx';
import ReservoirMarker from './ReservoirMarker.jsx';
import TreatmentPlantMarker from './TreatmentPlantMarker.jsx';
import ContaminationFlowLayer from './ContaminationFlowLayer.jsx';
import TankerLayer from './TankerLayer.jsx';
import NodeTooltip from './NodeTooltip.jsx';
import PipeTooltip from './PipeTooltip.jsx';
import ValveControl from './ValveControl.jsx';
import WastewaterFlow from './WastewaterFlow.jsx';
import ReroutePathOverlay from './ReroutePathOverlay.jsx';
import ZonePopup from './ZonePopup.jsx';
import FeederLines from './FeederLines.jsx';
import WastePipes from './WastePipes.jsx';
import HeatmapOverlay from './HeatmapOverlay.jsx';

const MAP_W = 1200;
const MAP_H = 700;

function IndustrialDischarge() {
  const droplets = [0, 0.35, 0.7];
  return (
    <g className="industrial-discharge">
      {/* Discharge pipe */}
      <line x1="600" y1="178" x2="600" y2="320"
        stroke="#8B5E3C" strokeWidth="3" strokeDasharray="6,3" strokeOpacity="0.6" />
      {/* Animated droplets flowing down */}
      {droplets.map((offset, i) => (
        <circle key={i} r="3" fill="#8B7355" opacity="0.7">
          <animateMotion path="M 600 178 L 600 320" dur="2s"
            repeatCount="indefinite" begin={`${offset * 2}s`} />
        </circle>
      ))}
      {/* Pollution splash at river entry */}
      <ellipse cx="600" cy="322" rx="14" ry="5" fill="#6B5844" opacity="0.35">
        <animate attributeName="rx" values="12;18;12" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.15;0.35" dur="2s" repeatCount="indefinite" />
      </ellipse>
      {/* Label */}
      <text x="608" y="250" fill="#8B5E3C" fontSize="9" fontWeight="600" fontFamily="Inter">
        ⚠ Wastewater
      </text>
    </g>
  );
}

export default function CityMap() {
  const { networkState, tankers, issues, treatmentState } = useSimulation();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredPipe, setHoveredPipe] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedValve, setSelectedValve] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState(null); // null | 'pressure' | 'supply'
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: MAP_W, h: MAP_H });
  const svgRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'svg' || e.target.classList.contains('map-bg')) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      // Calculate mouse position relative to SVG container
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    
    if (!isPanning.current) return;
    const dx = (e.clientX - panStart.current.x) * (viewBox.w / MAP_W);
    const dy = (e.clientY - panStart.current.y) * (viewBox.h / MAP_H);
    setViewBox((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    panStart.current = { x: e.clientX, y: e.clientY };
  }, [viewBox]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((prev) => {
      const nw = prev.w * scale;
      const nh = prev.h * scale;
      const dx = (prev.w - nw) / 2;
      const dy = (prev.h - nh) / 2;
      return {
        x: prev.x + dx,
        y: prev.y + dy,
        w: Math.max(400, Math.min(2400, nw)),
        h: Math.max(250, Math.min(1400, nh)),
      };
    });
  }, []);

  // Use useMemo to create a fast lookup for positions of all infrastructure types
  const positionsMap = useMemo(() => {
    if (!networkState) return {};
    const map = {};
    networkState.nodes.forEach(n => map[n.id] = n.position);
    networkState.reservoirs.forEach(r => map[r.id] = r.position);
    networkState.valves.forEach(v => map[v.id] = v.position);
    networkState.zones.forEach(z => map[z.id] = z.position);
    if (networkState.treatmentPlants) {
      networkState.treatmentPlants.forEach(tp => map[tp.id] = tp.position);
    }
    return map;
  }, [networkState]);

  const isDataReady = networkState && networkState.nodes && networkState.nodes.length > 0;

  if (!isDataReady) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#00d4ff',
        background: 'rgba(10,10,12,0.9)',
        fontSize: '14px',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>
        INITIALIZING CITY INFRASTRUCTURE...
      </div>
    );
  }

  const nodes = networkState.nodes || [];
  const pipes = networkState.pipes || [];
  const valves = networkState.valves || [];
  const reservoirs = networkState.reservoirs || [];
  const zones = networkState.zones || [];
  const rivers = networkState.rivers || [];
  const treatmentPlants = networkState.treatmentPlants || [];

  return (
    <div className="city-map-container">
      <svg
        ref={svgRef}
        className="city-map-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <filter id="glow-cyan">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 15 }).map((_, i) => (
          <React.Fragment key={`grid-${i}`}>
            <line x1={i * 100} y1={0} x2={i * 100} y2={MAP_H} stroke="rgba(0,212,255,0.08)" strokeWidth="0.5" />
            <line x1={0} y1={i * 100} x2={MAP_W + 200} y2={i * 100} stroke="rgba(0,212,255,0.08)" strokeWidth="0.5" />
          </React.Fragment>
        ))}

        {/* LAYER 1: Water Network Infrastructure */}

        {/* River with dynamic pollution (industrial + contamination) */}
        <RiverLayer rivers={rivers} industrialZones={zones.filter(z => z.type === 'industrial')} zones={zones} />

        {/* Waste pipes from industrial to river */}
        <WastePipes industrialZones={zones.filter(z => z.type === 'industrial')} />

        {/* Contamination flows to treatment plant */}
        <ContaminationFlowLayer
          zones={zones}
          treatmentPlant={treatmentPlants[0]}
          treatmentState={treatmentState}
        />

        {/* Pipes — Rendering all infrastructure connections with hover */}
        {pipes.map((pipe) => {
          const srcPos = positionsMap[pipe?.source];
          const tgtPos = positionsMap[pipe?.target];

          if (!srcPos || !tgtPos || !pipe) {
            return null;
          }

          return (
            <g
              key={pipe.id}
              onMouseEnter={() => setHoveredPipe(pipe)}
              onMouseLeave={() => setHoveredPipe(null)}
            >
              <WaterPipe pipe={pipe} srcPos={srcPos} tgtPos={tgtPos} />
            </g>
          );
        })}

        {/* Reservoirs */}
        {reservoirs.map((r) => r && (
          <ReservoirMarker key={r.id} reservoir={r} />
        ))}

        {/* Treatment Plants */}
        {treatmentPlants.map((tp) => tp && (
          <TreatmentPlantMarker key={tp.id} plant={tp} />
        ))}

        {/* LAYER 2: City Buildings (Outside Grid) */}

        {/* Feeder lines (dotted connections from nodes to zones) */}
        <FeederLines zones={zones} positionsMap={positionsMap} />

        {/* Buildings/Zones */}
        {zones.map((zone) => zone && (
          <BuildingMarker key={zone.id} zone={zone} onClick={() => setSelectedZone(zone)} />
        ))}

        {/* Nodes */}
        {nodes.map((node) => node && (
          <WaterNode
            key={node.id}
            node={node}
            onHover={setHoveredNode}
            onLeave={() => setHoveredNode(null)}
          />
        ))}

        {/* Valves */}
        {valves.map((valve) => valve && (
          <ValveMarker key={valve.id} valve={valve} onClick={() => setSelectedValve(valve)} />
        ))}

        {/* Tankers */}
        <TankerLayer tankers={tankers} positionsMap={positionsMap} />

        {/* Reroute path visualization */}
        <ReroutePathOverlay rerouteInfo={networkState.rerouteInfo} nodes={nodes} positionsMap={positionsMap} />

        {/* Heatmap overlay */}
        {heatmapMode && (
          <HeatmapOverlay zones={zones} nodes={nodes} mode={heatmapMode} />
        )}
      </svg>

      {/* Heatmap controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px',
        zIndex: 100,
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
          HEATMAP
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => setHeatmapMode(heatmapMode === 'pressure' ? null : 'pressure')}
            style={{
              padding: '6px 12px',
              background: heatmapMode === 'pressure' ? '#0ea5e9' : 'rgba(100,116,139,0.2)',
              color: heatmapMode === 'pressure' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            PRESSURE
          </button>
          <button
            onClick={() => setHeatmapMode(heatmapMode === 'supply' ? null : 'supply')}
            style={{
              padding: '6px 12px',
              background: heatmapMode === 'supply' ? '#0ea5e9' : 'rgba(100,116,139,0.2)',
              color: heatmapMode === 'supply' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            SUPPLY
          </button>
        </div>
      </div>

      {/* Tooltip overlays — Synced with mouse movement */}
      {hoveredNode && (
        <NodeTooltip node={hoveredNode} mousePos={mousePos} />
      )}

      {hoveredPipe && (
        <PipeTooltip pipe={hoveredPipe} mousePos={mousePos} />
      )}

      {/* Valve control modal */}
      {selectedValve && (
        <ValveControl valve={selectedValve} onClose={() => setSelectedValve(null)} />
      )}

      {/* Zone detail popup */}
      {selectedZone && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1999,
            }}
            onClick={() => setSelectedZone(null)}
          />
          <ZonePopup
            zone={selectedZone}
            onClose={() => setSelectedZone(null)}
            issues={issues}
            actions={[]}
          />
        </>
      )}
    </div>
  );
}
