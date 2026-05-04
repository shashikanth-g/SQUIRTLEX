// Dashboard.jsx — Real-time synced dashboard
import React, { useMemo } from 'react';
import ZoneHealthCards from '@sim/components/dashboard/ZoneHealthCards.jsx';
import PressureGraph from '@sim/components/dashboard/PressureGraph.jsx';
import AlertFeed from '@sim/components/alerts/AlertFeed.jsx';
import AIDecisionPanel from '@sim/components/intelligence/AIDecisionPanel.jsx';
import SystemHealthBar from '@sim/components/dashboard/SystemHealthBar.jsx';
import TreatmentPlantPanel from '@sim/components/TreatmentPlantPanel.jsx';
import WaterQualityTable from '@sim/components/dashboard/WaterQualityTable.jsx';
import { useSimulation } from '@sim/context/SimulationContext.jsx';
import { formatNumber } from '@sim/utils/formatters.js';
import { Droplets, TrendingUp, Gauge, Activity, Zap, AlertTriangle } from 'lucide-react';
import IssuePanel from '@sim/components/intelligence/IssuePanel.jsx';

export default function Dashboard() {
  const { networkState, globalMetrics, alerts, backendCounts, isDataReady } = useSimulation();

  const zones = networkState?.zones || [];
  const reservoirs = networkState?.reservoirs || [];

  const topCriticalZones = useMemo(() => {
    if (!zones.length) return [];
    return [...zones]
      .map(z => {
        const demandCurrent = z?.demandCurrent || 0;
        const supplyCurrent = z?.supplyCurrent || 0;
        const ratio = demandCurrent > 0 ? supplyCurrent / demandCurrent : 1;
        return { ...z, ratio };
      })
      .filter(z => z.ratio < 0.95)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 3);
  }, [zones]);

  if (!isDataReady) return <div className="page-loading">Initializing real-time data...</div>;

  const reservoir = reservoirs[0];
  const resPct = reservoir ? Math.round(((reservoir?.currentLevel || 0) / (reservoir?.capacity || 1)) * 100) : 0;

  return (
    <div className="page dashboard-page">
      <SystemHealthBar efficiency={globalMetrics.efficiency} />
      
      <div className="page-header mt-4">
        <div className="flex items-center gap-3">
          <Zap className="text-primary neon-glow-cyan" size={24} />
          <h2>Smart-City Command Center</h2>
        </div>
        <span className="page-subtitle">Real-time network overview — Live Sync Active</span>
      </div>

      <div className="quick-stats">
        <StatCard
          icon={Droplets}
          label="Total Supply"
          value={`${formatNumber(globalMetrics?.totalSupply || 0)} L/min`}
          color="#00D4FF"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Demand"
          value={`${formatNumber(globalMetrics?.totalDemand || 0)} L/min`}
          color="#4ECDC4"
        />
        <StatCard
          icon={Gauge} 
          label="Main Reservoir" 
          value={`${resPct}%`} 
          color={resPct > 50 ? '#6BCF7F' : resPct > 25 ? '#FFD93D' : '#FF6B6B'} 
        />
        <StatCard
          icon={Activity}
          label="Network Health"
          value={`${globalMetrics?.efficiency || 0}%`}
          color={(globalMetrics?.efficiency || 0) >= 95 ? '#6BCF7F' : (globalMetrics?.efficiency || 0) >= 85 ? '#FFD93D' : '#FF6B6B'}
        />
      </div>

      <div className="dashboard-grid">
        <div className="grid-main">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <IssuePanel />
            <TopCriticalPanel zones={topCriticalZones} />
            <CloudInfraPanel counts={backendCounts} />
          </div>
          <ZoneHealthCards />
          <PressureGraph />
          <div className="mt-6">
            <WaterQualityTable />
          </div>
        </div>
        <div className="grid-sidebar">
          <TreatmentPlantPanel />
          <AIDecisionPanel />
          <AlertFeed maxItems={8} />
        </div>
      </div>
    </div>
  );
}

function CloudInfraPanel({ counts }) {
  return (
    <div className="glass-card p-5 rounded-xl space-y-4 border-l-4 border-primary">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Zap size={16} className="text-primary" />
        Cloud Infrastructure Assets
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] text-text-muted uppercase block mb-1">Active Pipes</span>
          <span className="text-xl font-bold text-primary font-mono">{counts.pipes}</span>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] text-text-muted uppercase block mb-1">Smart Valves</span>
          <span className="text-xl font-bold text-primary font-mono">{counts.valves}</span>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] text-text-muted uppercase block mb-1">Active Tankers</span>
          <span className="text-xl font-bold text-primary font-mono">{counts.tankers}</span>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <span className="text-[10px] text-text-muted uppercase block mb-1">AI Predictions</span>
          <span className="text-xl font-bold text-primary font-mono">{counts.predictions}</span>
        </div>
      </div>
      <p className="text-[10px] text-text-muted italic">
        Real-time sync active with Supabase Cloud
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const labelFirst = label?.split(' ')[0] || 'SYSTEM';
  return (
    <div className="stat-card glass-card group transition-all" style={{ '--stat-color': color }}>
      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors shrink-0">
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="stat-title uppercase tracking-tighter">{labelFirst} STATUS</span>
        <span className="stat-value" style={{ color }}>{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function LiveStatusPanel({ metrics }) {
  return (
    <div className="glass-card p-5 rounded-xl space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        Live Network Status
      </h3>
      <div className="space-y-3">
        <StatusRow label="Flow Stability" value="Stable" status="success" />
        <StatusRow label="Pump Efficiency" value="94%" status="success" />
        <StatusRow label="Leak Detection" value="None" status="success" />
        <StatusRow label="Avg Pressure" value="72 PSI" status="normal" />
      </div>
    </div>
  );
}

function StatusRow({ label, value, status }) {
  const color = status === 'success' ? '#6BCF7F' : status === 'warning' ? '#FFD93D' : '#FF6B6B';
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold" style={{ color }}>{value}</span>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
      </div>
    </div>
  );
}

function TopCriticalPanel({ zones }) {
  const criticalZones = zones || [];
  return (
    <div className="glass-card p-5 rounded-xl space-y-4">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <AlertTriangle size={16} className="text-accent" />
        Priority Attention Zones
      </h3>
      {criticalZones.length > 0 ? (
        <div className="space-y-3">
          {criticalZones.map(z => (
            <div key={z?.id || Math.random()} className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5">
              <span className="font-bold">{z?.name || 'Unknown'}</span>
              <div className="flex flex-col items-end">
                <span className="text-accent font-mono">{((z?.ratio || 0) * 100).toFixed(1)}% supply</span>
                <span className="text-[10px] text-text-muted uppercase">Critical Gap</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-xs text-text-muted italic">
          All zones performing within parameters.
        </div>
      )}
    </div>
  );
}
