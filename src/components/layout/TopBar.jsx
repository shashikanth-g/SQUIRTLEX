// TopBar.jsx — Top bar with live metrics ticker and simulation controls
import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { formatSimTime, formatNumber } from '../../utils/formatters.js';
import { Pause, Play, FastForward, Droplets, BarChart3, Zap, AlertTriangle, Settings } from 'lucide-react';

export default function TopBar() {
  const { simTime, speed, isPaused, globalMetrics, autoOptCount, pauseSim, playSim, setSimSpeed } = useSimulation();

  return (
    <header className="topbar">
      <div className="topbar-metrics">
        <div className="metric-item">
          <Droplets size={14} />
          <span>Supply: <strong>{formatNumber(globalMetrics.totalSupply)} L/min</strong></span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <BarChart3 size={14} />
          <span>Demand: <strong>{formatNumber(globalMetrics.totalDemand)} L/min</strong></span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <Zap size={14} />
          <span>Efficiency: <strong className={globalMetrics.efficiency < 90 ? 'text-warning' : 'text-success'}>{globalMetrics.efficiency}%</strong></span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <AlertTriangle size={14} />
          <span>Alerts: <strong className={globalMetrics.activeAlerts > 0 ? 'text-accent' : ''}>{globalMetrics.activeAlerts}</strong></span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <Settings size={14} />
          <span>Auto-Fixes: <strong>{autoOptCount}</strong></span>
        </div>
      </div>

      <div className="topbar-controls">
        <span className="sim-time">{formatSimTime(simTime)}</span>
        <div className="playback-controls">
          <button
            className={`ctrl-btn ${isPaused ? '' : 'dimmed'}`}
            onClick={pauseSim}
            title="Pause"
            id="btn-pause"
          >
            <Pause size={16} />
          </button>
          <button
            className={`ctrl-btn ${!isPaused ? '' : 'dimmed'}`}
            onClick={playSim}
            title="Play"
            id="btn-play"
          >
            <Play size={16} />
          </button>
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              className={`ctrl-btn speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => setSimSpeed(s)}
              title={`${s}x speed`}
              id={`btn-speed-${s}`}
            >
              {s === 1 ? '1×' : <><FastForward size={12} /> {s}×</>}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
