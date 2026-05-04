// ManualOverride.jsx — Manual event triggers
import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { Ban, Droplets, TrendingUp, Biohazard } from 'lucide-react';

export default function ManualOverride() {
  const { blockPipe, unblockPipe, createLeak, surgeDemand, triggerContamination, networkState } = useSimulation();

  const triggers = [
    { label: 'Trigger Contamination', icon: Biohazard, action: triggerContamination, color: '#ff4d4d' },
    { label: 'Block Pipe P12', icon: Ban, action: () => blockPipe('P12'), color: '#FF6B6B' },
    { label: 'Block Pipe P16', icon: Ban, action: () => blockPipe('P16'), color: '#FF6B6B' },
    { label: 'Unblock All Pipes', icon: Ban, action: () => { networkState?.pipes.forEach(p => { if (p.status === 'blocked') { /* handled via scenario reset */ } }); }, color: '#6BCF7F' },
    { label: 'Create Leak at N7', icon: Droplets, action: () => createLeak('N7'), color: '#FFD93D' },
    { label: 'Surge +40% Zone Z3', icon: TrendingUp, action: () => surgeDemand('Z3_industrial', 1.4), color: '#FF8C42' },
    { label: 'Surge +50% Downtown', icon: TrendingUp, action: () => surgeDemand('Z1_residential', 1.5), color: '#FF8C42' },
  ];

  return (
    <div className="manual-override">
      <h3>Manual Triggers</h3>
      <div className="trigger-grid">
        {triggers.map((t, i) => {
          const Icon = t.icon;
          return (
            <button key={i} className="trigger-btn" onClick={t.action} style={{ '--trigger-color': t.color }}>
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
