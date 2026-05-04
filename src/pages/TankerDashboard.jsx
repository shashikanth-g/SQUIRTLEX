// TankerDashboard.jsx — Tanker management interface
import React from 'react';
import { useSimulation } from '../context/SimulationContext.jsx';
import { Truck, MapPin, Navigation, Clock, CheckCircle, AlertCircle, Droplets } from 'lucide-react';
import { formatNumber } from '../utils/formatters.js';

export default function TankerDashboard() {
  const { tankers, networkState } = useSimulation();

  const allTankers = tankers || [];
  const zones = networkState?.zones || [];

  const getZoneName = (zoneId) => {
    return zones.find(z => z?.id === zoneId)?.name || zoneId;
  };

  return (
    <div className="page tanker-dashboard-page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Truck className="text-primary" size={24} />
          </div>
          <div>
            <h2>Tanker Operations Control</h2>
            <span className="page-subtitle">Managed water distribution for critical infrastructure</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
        {/* Tanker Status Overview */}
        <div className="xl:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-xl space-y-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              Fleet Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FleetStat label="Active" value={allTankers.length} color="#00D4FF" />
              <FleetStat label="Delivering" value={allTankers.filter(t => t?.status === 'delivering').length} color="#6BCF7F" />
              <FleetStat label="Transit" value={allTankers.filter(t => t?.status === 'in_transit').length} color="#FFD93D" />
              <FleetStat label="Returning" value={allTankers.filter(t => t?.status === 'returning').length} color="#5A6C7D" />
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-primary">Total Capacity Dispatched</span>
                <span className="text-text-primary">{formatNumber(allTankers.length * 4000)} L</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '45%' }} />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-4">
             <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertCircle size={16} className="text-accent" />
              Auto-Dispatch Rules
            </h3>
            <div className="space-y-3">
               <RuleItem label="Critical Pressure (<30 PSI)" active={true} />
               <RuleItem label="Zero Flow Detected" active={true} />
               <RuleItem label="AI Recommendation" active={true} />
               <RuleItem label="Manual Request" active={false} />
            </div>
          </div>
        </div>

        {/* Active Tanker List */}
        <div className="xl:col-span-8">
          <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-bold">Active Deployment Feed</h3>
              <span className="text-[10px] font-mono text-text-muted uppercase">Updates every 1s</span>
            </div>

            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {allTankers.length > 0 ? (
                allTankers.map(tanker => (
                  <TankerCard key={tanker?.id || Math.random()} tanker={tanker} zoneName={getZoneName(tanker?.targetZoneId)} />
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 rounded-full bg-white/5 border border-white/5">
                    <CheckCircle className="text-success/20" size={40} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-text-primary">All Zones Supplied</p>
                    <p className="text-xs text-text-muted">No tankers are currently dispatched. Fleet on standby.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FleetStat({ label, value, color }) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
      <span className="text-[10px] font-bold uppercase text-text-muted">{label}</span>
      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
    </div>
  );
}

function RuleItem({ label, active }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-secondary">{label}</span>
      <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${active ? 'bg-success/10 text-success border border-success/20' : 'bg-white/5 text-text-muted border border-white/10'}`}>
        {active ? 'ENABLED' : 'DISABLED'}
      </div>
    </div>
  );
}

function TankerCard({ tanker, zoneName }) {
  const isDelivering = tanker.status === 'delivering';
  const color = isDelivering ? '#6BCF7F' : '#FFD93D';

  return (
    <div className="p-5 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-primary/10">
            <Truck size={18} className="text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">{tanker.id}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <Clock size={10} />
              <span>Dispatched {Math.round((Date.now() - tanker.dispatchTime) / 1000)}s ago</span>
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase border`} style={{ borderColor: `${color}40`, color }}>
          {tanker.status}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[10px] text-text-muted mb-1">
            <span className="flex items-center gap-1"><MapPin size={8} /> {tanker.source}</span>
            <span className="flex items-center gap-1"><Navigation size={8} /> {zoneName}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-1000 ${isDelivering ? 'progress-fill-animate' : ''}`} 
              style={{ width: `${Math.min(100, tanker.progress)}%`, backgroundColor: color, '--tw-gradient-from': color }} 
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono mt-1">
            <span className="text-text-muted">{isDelivering ? 'Unloading...' : 'In Transit'}</span>
            <span style={{ color }}>{Math.min(100, tanker.progress)}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-text-muted uppercase font-bold">Payload</span>
          <span className="text-xs font-mono font-bold text-primary">15,000 L</span>
        </div>
      </div>
    </div>
  );
}
