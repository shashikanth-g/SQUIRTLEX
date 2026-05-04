// Intelligence.jsx — AI insights & live predictions page
import React from 'react';
import AIDecisionPanel from '../components/intelligence/AIDecisionPanel.jsx';
import { useSimulation } from '../context/SimulationContext.jsx';
import { Brain, Activity, Shield, TrendingUp, Clock, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import NeuralBackground from '../components/intelligence/NeuralBackground.jsx';
import { filterByCategory } from '../utils/issueCategories.js';

export default function Intelligence() {
  const { issues, predictions, autoOptCount, networkState, unblockAllPipes, blockPipe, createLeak, surgeDemand, isDataReady } = useSimulation();

  if (!isDataReady) return <div className="page-loading">Initializing AI engine...</div>;

  const allIssues = issues || [];
  const allPredictions = predictions || [];

  // Filter to AI-only issues (predictive/aging)
  const aiIssues = filterByCategory(allIssues, 'ai').filter(i => !i?.dismissed);

  // Total active issues (for summary cards)
  const activeIssues = allIssues.filter(i => !i?.dismissed);
  const criticalCount = activeIssues.filter(i => i?.severity === 'critical').length;
  const zones = networkState?.zones || [];
  const efficiency = zones.length > 0
    ? Math.round(
        (zones.reduce((s, z) => s + (z?.supplyCurrent || 0), 0) /
          Math.max(1, zones.reduce((s, z) => s + (z?.demandCurrent || 0), 0))) * 100
      )
    : 0;

  return (
    <div className="page intelligence-page relative overflow-hidden">
      <NeuralBackground />

      <div className="page-header relative z-10">
        <h2>SQUIRTLE-X AI Intelligence</h2>
        <span className="page-subtitle">Strategic water optimization &amp; predictive engine</span>
      </div>

      {/* Summary cards */}
      <div className="ai-summary-cards relative z-10">
        <SummaryCard icon={<Brain size={22} className="text-primary" />}
          value={autoOptCount} label="Auto-Optimizations" />
        <SummaryCard icon={<Activity size={22} className="text-secondary" />}
          value={activeIssues.length} label="Active Anomalies" />
        <SummaryCard
          icon={<Shield size={22} style={{ color: criticalCount > 0 ? '#FF6B6B' : '#6BCF7F' }} />}
          value={criticalCount} label="Critical Issues"
          valueColor={criticalCount > 0 ? '#FF6B6B' : '#6BCF7F'}
        />
        <SummaryCard icon={<TrendingUp size={22} className="text-success" />}
          value={`${efficiency}%`} label="Network Efficiency" />
      </div>

      {/* Manual triggers */}
      <div className="relative z-10 mb-6">
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold mb-3">Manual Triggers</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => blockPipe('P24')}
              className="px-4 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded text-xs font-bold transition-colors"
            >
              BLOCK P24
            </button>
            <button
              onClick={unblockAllPipes}
              className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success rounded text-xs font-bold transition-colors"
            >
              UNBLOCK ALL PIPES
            </button>
            <button
              onClick={() => createLeak('N8')}
              className="px-4 py-2 bg-warning/20 hover:bg-warning/30 text-warning rounded text-xs font-bold transition-colors"
            >
              CREATE LEAK N8
            </button>
            <button
              onClick={() => surgeDemand('Z1_residential', 2.5)}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded text-xs font-bold transition-colors"
            >
              SURGE DEMAND Z1 x2.5
            </button>
          </div>
        </div>
      </div>

      {/* AI Strategy — Intelligence Only */}
      <div className="relative z-10 space-y-4">
        {/* Predictive Intelligence Section */}
        <PredictiveIntelligenceSection issues={aiIssues} predictions={allPredictions} />

        {/* AI Insights Section */}
        <AIInsightsSection networkState={networkState} issues={aiIssues} />

        {/* AI Decision Panel (Cognitive Engine) */}
        <div className="intelligence-grid">
          <div className="intel-main">
            <AIDecisionPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, value, label, valueColor }) {
  return (
    <div className="ai-summary-card">
      {icon}
      <div>
        <span className="ai-metric-value" style={valueColor ? { color: valueColor } : {}}>
          {value}
        </span>
        <span className="ai-metric-label">{label}</span>
      </div>
    </div>
  );
}

// Predictive Intelligence Section — Asset aging & future failures
function PredictiveIntelligenceSection({ issues, predictions }) {
  const agingIssues = issues.filter(i => i.type === 'ASSET_AGING');
  const predictiveIssues = issues.filter(i => i.type === 'PREDICTIVE_FAILURE');

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-warning" />
        Predictive Intelligence
        <span className="ml-auto text-[10px] font-mono text-text-muted">
          {agingIssues.length + predictiveIssues.length + predictions.length} RISKS
        </span>
      </h3>

      <div className="space-y-3">
        {/* Asset Aging */}
        {agingIssues.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={12} className="text-warning" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Asset Aging</span>
            </div>
            <div className="space-y-2">
              {agingIssues.map(issue => (
                <IntelligenceRiskCard key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {/* Future Predictions */}
        {predictions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Upcoming Risks</span>
            </div>
            <div className="space-y-2">
              {predictions.map(pred => (
                <PredictionCard key={pred.id} prediction={pred} />
              ))}
            </div>
          </div>
        )}

        {agingIssues.length === 0 && predictions.length === 0 && (
          <div className="text-center py-8 text-text-muted text-xs">
            <p className="font-bold">No predictive risks detected</p>
            <p>All assets in good condition</p>
          </div>
        )}
      </div>
    </div>
  );
}

// AI Insights Section — Strategic intelligence
function AIInsightsSection({ networkState, issues }) {
  const zones = networkState?.zones || [];

  // Calculate insights
  const highStressZones = zones.filter(z =>
    (z.supplyCurrent / z.demandCurrent) < 0.85
  );

  const riskTrend = issues.filter(i => i.severity === 'critical').length > 2 ? 'increasing' : 'stable';

  const avgCondition = issues.length > 0
    ? Math.round(issues.reduce((sum, i) => sum + (i.condition || 100), 0) / issues.length)
    : 100;

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        <Brain size={16} className="text-primary" />
        AI Insights
      </h3>

      <div className="space-y-3">
        {/* Network Health */}
        <InsightCard
          title="Network Health"
          value={avgCondition >= 80 ? 'Good' : avgCondition >= 60 ? 'Fair' : 'Declining'}
          detail={`Average asset condition: ${avgCondition}%`}
          color={avgCondition >= 80 ? '#6BCF7F' : avgCondition >= 60 ? '#FFD93D' : '#FF6B6B'}
        />

        {/* High Stress Zones */}
        {highStressZones.length > 0 && (
          <InsightCard
            title="High Stress Zones"
            value={highStressZones.length}
            detail={highStressZones.map(z => z.name).join(', ')}
            color="#FFD93D"
          />
        )}

        {/* Risk Trend */}
        <InsightCard
          title="Risk Trend"
          value={riskTrend === 'increasing' ? 'Increasing' : 'Stable'}
          detail={`${issues.length} active predictive risks`}
          color={riskTrend === 'increasing' ? '#FF6B6B' : '#6BCF7F'}
        />
      </div>
    </div>
  );
}

// Insight Card
function InsightCard({ title, value, detail, color }) {
  return (
    <div className="p-3 rounded border border-white/10 bg-white/3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{title}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-[9px] text-text-muted leading-tight">{detail}</p>
    </div>
  );
}

// Intelligence Risk Card — NO AutoFix button (intelligence only)
function IntelligenceRiskCard({ issue }) {
  const riskColor = issue.condition < 30 ? '#FF6B6B' : issue.condition < 40 ? '#FFD93D' : '#FF8C42';

  // Determine recommended action
  const recommendedAction = issue.condition < 30
    ? 'Schedule immediate maintenance'
    : issue.condition < 40
    ? 'Reduce operational stress'
    : 'Monitor closely';

  return (
    <div className="p-2 rounded border border-white/10 bg-white/3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-text-primary">
          {issue.assetType?.toUpperCase()} {issue.pipeId || issue.valveId || issue.nodeId}
        </span>
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
          {Math.round(issue.condition)}%
        </span>
      </div>

      <div className="text-[9px] text-text-muted mb-2 space-y-1">
        <div className="flex items-center justify-between">
          <span>{issue.material} • {issue.age}y old</span>
          <span>~{issue.daysToFailure}d to failure</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-text-primary">Risk Level:</span>
          <span style={{ color: riskColor }}>{issue.riskLevel?.toUpperCase() || 'MEDIUM'}</span>
        </div>
      </div>

      {/* Recommended Action (no button) */}
      <div className="pt-2 border-t border-white/10">
        <span className="text-[8px] font-bold uppercase text-text-muted">Recommended:</span>
        <p className="text-[9px] text-text-primary mt-0.5">{recommendedAction}</p>
      </div>
    </div>
  );
}

// Prediction Card
function PredictionCard({ prediction }) {
  const conf = prediction?.confidence || 0;
  const color = conf > 80 ? '#6BCF7F' : conf > 60 ? '#FFD93D' : '#FF6B6B';

  return (
    <div className="p-2 rounded border border-white/10 bg-white/3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-text-primary truncate flex-1">
          {prediction?.title || 'Prediction'}
        </span>
        <span className="text-[8px] flex items-center gap-1 text-text-muted">
          <Clock size={9} />
          {prediction?.timeLabel || 'Soon'}
        </span>
      </div>

      <p className="text-[9px] text-text-muted mb-2 leading-tight">
        {prediction?.description || 'No details'}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${conf}%`, backgroundColor: color }} />
        </div>
        <span className="text-[9px] font-mono font-bold" style={{ color }}>{conf}%</span>
      </div>
    </div>
  );
}
