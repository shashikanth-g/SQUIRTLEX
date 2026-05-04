// ZoneHealthCards.jsx — Overview cards for all zones
import React from 'react';
import { useSimulation } from '@sim/../context/SimulationContext.jsx';
import { formatNumber } from '@/utils/formatters.js';
import { Users, Droplets, Gauge, TrendingDown, TrendingUp } from 'lucide-react';

export default function ZoneHealthCards() {
  const { networkState } = useSimulation();
  if (!networkState?.zones || !Array.isArray(networkState.zones)) return null;

  const zones = networkState.zones || [];
  const nodes = networkState.nodes || [];

  return (
    <div className="zone-health-grid">
      {zones.filter(Boolean).map((zone) => {
        const demandCurrent = zone?.demandCurrent || 0;
        const supplyCurrent = zone?.supplyCurrent || 0;
        const ratio = demandCurrent > 0 ? supplyCurrent / demandCurrent : 1;
        const status = ratio >= 0.95 ? 'normal' : ratio >= 0.8 ? 'warning' : 'critical';
        const statusLabel = status === 'normal' ? 'NOMINAL' : status === 'warning' ? 'DEGRADED' : 'CRITICAL';
        const statusColor = status === 'normal' ? '#6BCF7F' : status === 'warning' ? '#FFD93D' : '#FF6B6B';

        const node = nodes.find((n) => n?.id === zone?.connectedNode);
        const pressure = node?.sensors?.pressure?.value ?? node?.pressure ?? 0;

        return (
          <div
            key={zone?.id || Math.random()}
            className={`zone-card ${status === 'critical' ? 'critical' : ''}`}
            style={{ '--zone-color': statusColor }}
          >
            <div className="zone-card-header">
              <div>
                <span className="zone-id">{zone?.id || 'N/A'}</span>
                <h4 className="zone-name">{zone?.name || 'Unknown Zone'}</h4>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="zone-status font-mono" style={{ color: statusColor }}>{statusLabel}</span>
                <div className="flex gap-1">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="w-1 h-3 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="w-full bg-primary/40"
                          style={{
                            height: `${40 + Math.random() * 60}%`,
                            backgroundColor: i === 5 ? statusColor : undefined
                          }}
                        />
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="zone-card-metrics">
              <div className="zone-metric">
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets size={12} className="text-primary" />
                  <span className="metric-label">Supply/Demand</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="metric-value">{formatNumber(supplyCurrent, 0)}</span>
                  <span className="text-[10px] text-text-muted">/ {formatNumber(demandCurrent, 0)}</span>
                </div>
              </div>
              
              <div className="zone-metric">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gauge size={12} className="text-secondary" />
                  <span className="metric-label">Pressure</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="metric-value">{formatNumber(pressure, 0)} PSI</span>
                  {pressure < 40 ? <TrendingDown size={10} className="text-accent" /> : <TrendingUp size={10} className="text-success" />}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <span>Network Satisfaction</span>
                <span style={{ color: statusColor }}>{Math.round(ratio * 100)}%</span>
              </div>
              <div className="supply-bar-container bg-white/5 h-1.5">
                <div 
                  className="supply-bar transition-all duration-1000" 
                  style={{ 
                    width: `${Math.min(100, ratio * 100)}%`, 
                    backgroundColor: statusColor,
                    boxShadow: `0 0 10px ${statusColor}40`
                  }} 
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
