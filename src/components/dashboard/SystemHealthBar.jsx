// SystemHealthBar.jsx — Top health indicator
import React from 'react';

export default function SystemHealthBar({ efficiency }) {
  const status = efficiency >= 95 ? 'normal' : efficiency >= 80 ? 'warning' : 'critical';
  const color = status === 'normal' ? '#6BCF7F' : status === 'warning' ? '#FFD93D' : '#FF6B6B';
  const label = status === 'normal' ? 'SYSTEM NOMINAL' : status === 'warning' ? 'SYSTEM WARNING' : 'SYSTEM CRITICAL';

  return (
    <div className="w-full flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
          <span style={{ color }}>{label}</span>
        </div>
        <span className="text-text-muted">OPERATIONAL EFFICIENCY: {efficiency}%</span>
      </div>
      
      <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden border border-white/5 relative">
        <div 
          className="h-full transition-all duration-1000 ease-out relative"
          style={{ 
            width: `${efficiency}%`, 
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}40`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
