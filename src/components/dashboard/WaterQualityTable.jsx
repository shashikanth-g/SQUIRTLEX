// WaterQualityTable.jsx — Real-time sensor monitor for water quality
import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

export default function WaterQualityTable() {
  const { networkState } = useSimulation();
  
  if (!networkState) return null;

  const nodes = networkState.nodes || [];
  
  // Filter for unsafe OR recent high/low pH
  const qualityData = nodes
    .filter(node => node.quality)
    .sort((a, b) => (b.quality.status === 'unsafe' ? 1 : -1))
    .slice(0, 8); // Top 8 relevant

  return (
    <div className="glass-card p-5 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          Water Quality Monitor (Sensors)
        </h3>
        <span className="text-[10px] text-text-muted uppercase font-mono">Live pH Analytics</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-text-muted border-b border-white/5 uppercase text-[9px]">
              <th className="pb-2 font-semibold">Node ID</th>
              <th className="pb-2 font-semibold text-center">pH Value</th>
              <th className="pb-2 font-semibold text-center">Turbidity</th>
              <th className="pb-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {qualityData.map((node) => {
              const q = node.quality;
              const isUnsafe = q.status === 'unsafe';
              
              return (
                <tr key={node.id} className={`${isUnsafe ? 'bg-red-500/5' : ''}`}>
                  <td className="py-2 font-mono font-bold text-text-muted">{node.id}</td>
                  <td className={`py-2 text-center font-mono font-bold ${isUnsafe ? 'text-accent' : 'text-primary'}`}>
                    {q.pH.toFixed(2)}
                  </td>
                  <td className="py-2 text-center text-text-muted">{q.turbidity.toFixed(2)} NTU</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`font-bold ${isUnsafe ? 'text-accent' : 'text-success'}`}>
                        {q.status.toUpperCase()}
                      </span>
                      {isUnsafe ? (
                        <AlertCircle size={12} className="text-accent" />
                      ) : (
                        <CheckCircle size={12} className="text-success" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-text-muted uppercase">Safe Range</span>
        <span className="text-[9px] font-mono font-bold text-success">6.5 — 8.5 pH</span>
      </div>
    </div>
  );
}
