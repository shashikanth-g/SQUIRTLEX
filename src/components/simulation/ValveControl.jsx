// ValveControl.jsx — Modal for valve control with AUTO/MANUAL mode
import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { X, Lock, Unlock } from 'lucide-react';

export default function ValveControl({ valve, onClose }) {
  const { setValveOpening, setValveMode } = useSimulation();
  const [opening, setOpening] = useState(valve.openPercentage);
  const [mode, setMode] = useState(valve.mode || 'auto');

  // Real-time update when mode changes
  useEffect(() => {
    if (mode !== valve.mode) {
      setValveMode(valve.id, mode);
      console.log(`[VALVE MODE] ${valve.id} → ${mode.toUpperCase()}`);
    }
  }, [mode, valve.id, valve.mode, setValveMode]);

  const handleSliderChange = (e) => {
    const newOpening = parseInt(e.target.value);
    setOpening(newOpening);

    // Instant update in MANUAL mode
    if (mode === 'manual') {
      setValveOpening(valve.id, newOpening);
      console.log(`[VALVE UPDATE] ${valve.id} → ${newOpening}% (MANUAL)`);
    }
  };

  const handleApply = () => {
    if (mode === 'manual') {
      setValveOpening(valve.id, opening);
      console.log(`[VALVE APPLIED] ${valve.id} → ${opening}% (MANUAL)`);
    }
    onClose();
  };

  const isAutoMode = mode === 'auto';
  const color = opening >= 80 ? '#6BCF7F' : opening >= 50 ? '#FFD93D' : '#FF8C42';
  const estimatedFlow = Math.round(valve.flowCapacity * opening / 100);

  return (
    <div className="valve-control-overlay" onClick={onClose}>
      <div className="valve-control-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3>{valve.id} CONTROL</h3>
            {isAutoMode && <Lock size={16} color="#f59e0b" />}
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Mode Toggle */}
          <div className="control-row" style={{ marginBottom: '20px' }}>
            <span className="control-label">Control Mode</span>
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
                onClick={() => setMode('auto')}
                style={{
                  background: mode === 'auto' ? '#f59e0b' : 'rgba(100,116,139,0.2)',
                  color: mode === 'auto' ? '#fff' : '#94a3b8',
                }}
              >
                <Lock size={14} style={{ marginRight: '4px' }} />
                AUTO
              </button>
              <button
                className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
                onClick={() => setMode('manual')}
                style={{
                  background: mode === 'manual' ? '#0ea5e9' : 'rgba(100,116,139,0.2)',
                  color: mode === 'manual' ? '#fff' : '#94a3b8',
                }}
              >
                <Unlock size={14} style={{ marginRight: '4px' }} />
                MANUAL
              </button>
            </div>
          </div>

          {/* Mode explanation */}
          {isAutoMode && (
            <div style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#fbbf24',
            }}>
              🔒 <strong>AUTO MODE:</strong> Valve controlled by AI system. Switch to MANUAL to adjust manually.
            </div>
          )}

          {/* Current Opening */}
          <div className="control-row">
            <span className="control-label">Current Opening</span>
            <span className="control-value" style={{ color, fontWeight: 700, fontSize: '18px' }}>
              {opening}%
            </span>
          </div>

          {/* Flow Capacity */}
          <div className="control-row">
            <span className="control-label">Estimated Flow</span>
            <span className="control-value" style={{ fontFamily: 'JetBrains Mono' }}>
              {estimatedFlow} / {valve.flowCapacity} L/min
            </span>
          </div>

          {/* Slider */}
          <div className="slider-section">
            <label className="control-label">
              Adjust Opening {isAutoMode && <span style={{ color: '#f59e0b', fontSize: '11px' }}>(Disabled in AUTO)</span>}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={opening}
              onChange={handleSliderChange}
              disabled={isAutoMode}
              className="valve-slider"
              style={{
                '--slider-color': color,
                opacity: isAutoMode ? 0.4 : 1,
                cursor: isAutoMode ? 'not-allowed' : 'pointer',
              }}
            />
            <div className="slider-labels">
              <span>0%</span>
              <span style={{ color, fontWeight: 600 }}>{opening}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Warning for zero opening */}
          {opening === 0 && (
            <div style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '6px',
              padding: '10px',
              marginTop: '12px',
              fontSize: '12px',
              color: '#f87171',
            }}>
              ⚠ <strong>WARNING:</strong> Opening = 0% will completely stop flow through this valve.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleApply}
            disabled={isAutoMode}
            style={{
              opacity: isAutoMode ? 0.5 : 1,
              cursor: isAutoMode ? 'not-allowed' : 'pointer',
            }}
          >
            {isAutoMode ? 'AUTO Mode (Read-Only)' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
