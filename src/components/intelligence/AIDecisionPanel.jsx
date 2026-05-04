// AIDecisionPanel.jsx — AI decision engine + live issue feed
import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import {
  Brain, Cpu, Zap, CheckCircle, AlertCircle, RefreshCw,
  ShieldAlert, Loader2, Clock, Activity,
} from 'lucide-react';
import NeuralBackground from './NeuralBackground.jsx';
import { filterByCategory } from '../../utils/issueCategories.js';

const ANALYSIS_STEPS = [
  'Mapping Network Topology…',
  'Calculating Pressure Differentials…',
  'Simulating Redistribution Models…',
  'Finalizing Optimal Strategy…',
];

const SEVERITY_COLORS = {
  critical: { ring: 'border-accent/30 bg-accent/5', badge: 'bg-accent/15 text-accent' },
  warning:  { ring: 'border-warning/30 bg-warning/5', badge: 'bg-warning/15 text-warning' },
  info:     { ring: 'border-primary/20 bg-primary/5', badge: 'bg-primary/10 text-primary' },
};

const LIFECYCLE_COLORS = {
  detecting:   'text-text-muted border-text-muted/30 bg-text-muted/5',
  validated:   'text-warning border-warning/30 bg-warning/5',
  in_progress: 'text-primary border-primary/30 bg-primary/5',
  resolved:    'text-success border-success/30 bg-success/5',
};

export default function AIDecisionPanel() {
  const { aiPlan, executeAIPlan, issues } = useSimulation();
  const [analysisState, setAnalysisState] = useState('idle');
  const [analysisStep, setAnalysisStep]   = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);

  const allIssues = issues || [];

  // Show ONLY system alerts in live feed (not AI predictions)
  const systemIssues = filterByCategory(allIssues, 'system');
  const activeIssues = systemIssues.filter(i => i?.lifecycle !== 'resolved' && !i?.dismissed);

  useEffect(() => {
    if (aiPlan && analysisState === 'idle') {
      setAnalysisState('analyzing');
      setAnalysisStep(0);
      let step = 0;
      const iv = setInterval(() => {
        step++;
        if (step < ANALYSIS_STEPS.length) {
          setAnalysisStep(step);
        } else {
          clearInterval(iv);
          setAnalysisState('result');
          setAnalysisResult({
            rootCause:      aiPlan?.rootCause || 'Anomaly detected',
            impact:         `${aiPlan?.affectedZones?.length || 1} zones affected`,
            recommendation: aiPlan?.actions?.[0]?.description || 'Standard optimization required',
            confidence:     aiPlan?.confidence || 94,
          });
        }
      }, 700);
      return () => clearInterval(iv);
    }
    if (!aiPlan && analysisState !== 'idle') {
      setAnalysisState('idle');
      setAnalysisResult(null);
      setAnalysisStep(0);
    }
  }, [aiPlan, analysisState]);

  const handleApply = () => { executeAIPlan(); setAnalysisState('idle'); };

  return (
    <div className="ai-panel glass-card relative overflow-hidden h-full">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <NeuralBackground />
      </div>

      {/* Header */}
      <div className="ai-panel-header z-10 relative">
        <Brain className="text-primary" size={18} />
        <div className="flex flex-col">
          <h3 className="text-xs font-bold text-primary tracking-tighter">SQUIRTLE-X COGNITIVE ENGINE</h3>
          <span className="text-[8px] text-text-muted font-mono">NEURAL SYNC ACTIVE</span>
        </div>
        <div className={`ai-status ml-auto ${analysisState}`}>
          {analysisState?.toUpperCase() || 'IDLE'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar z-10 relative">

        {/* ── AI Plan section ─────────────────────────── */}
        {analysisState === 'idle' && (
          <div className="p-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 rounded-full bg-primary/5 border border-primary/10 animate-pulse">
              <Cpu className="text-primary/30" size={32} />
            </div>
            <p className="text-sm font-bold text-text-primary">Monitoring Network</p>
            <span className="text-[10px] text-text-muted leading-relaxed max-w-[200px]">
              Auto-fix engine running. Manual plan will appear when issues are detected.
            </span>
          </div>
        )}

        {analysisState === 'analyzing' && (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 border-2 border-primary/15 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain size={18} className="text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-primary">{ANALYSIS_STEPS[analysisStep]}</p>
              <div className="flex gap-1 justify-center">
                {ANALYSIS_STEPS.map((_, i) => (
                  <div key={i} className={`w-7 h-1 rounded-full transition-colors ${i <= analysisStep ? 'bg-primary' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {analysisState === 'result' && analysisResult && (
          <div className="p-4 space-y-4">
            <ResultRow label="Root Cause"   value={analysisResult.rootCause}       icon={AlertCircle} color="#FF6B6B" />
            <ResultRow label="System Impact" value={analysisResult.impact}          icon={Zap}         color="#FFD93D" />
            <ResultRow label="Recommended"  value={analysisResult.recommendation}  icon={CheckCircle} color="#6BCF7F" />
            <div className="ai-buttons pt-1">
              <button className="btn-primary" onClick={handleApply}>
                <RefreshCw size={13} className="animate-spin-slow" />
                APPLY OPTIMAL PLAN
              </button>
            </div>
          </div>
        )}

        {/* ── Live issues list ──────────────────────── */}
        <div className="border-t border-white/5 mt-2">
          <div className="px-4 py-2 flex items-center justify-between bg-white/3">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert size={11} className="text-accent" />
              Live Issues
            </span>
            <span className="text-[9px] font-mono text-text-muted">{activeIssues.length} active</span>
          </div>

          <div className="p-2 space-y-2">
            {activeIssues.length === 0 ? (
              <div className="py-4 flex flex-col items-center gap-2 text-center">
                <CheckCircle size={20} className="text-success/40" />
                <p className="text-[10px] text-text-muted">All systems nominal</p>
              </div>
            ) : (
              activeIssues.slice(0, 6).map(issue => (
                <IssueRow key={issue?.id || Math.random()} issue={issue} />
              ))
            )}
            {activeIssues.length > 6 && (
              <p className="text-center text-[9px] text-text-muted py-1">
                +{activeIssues.length - 6} more on Alerts page
              </p>
            )}
          </div>
        </div>
      </div>

      {analysisState === 'result' && analysisResult && (
        <div className="ai-confidence border-t border-white/5 bg-white/5 p-3 flex items-center justify-between">
          <span className="text-[9px] font-bold text-text-muted">CONFIDENCE SCORE</span>
          <span className="text-xs font-mono font-bold text-primary">{analysisResult?.confidence || 0}%</span>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, icon: Icon, color }) {
  return (
    <div className="p-3 bg-white/3 border border-white/5 rounded-lg space-y-1">
      <div className="flex items-center gap-2">
        <Icon size={12} style={{ color }} />
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-semibold text-text-primary leading-tight pl-4">{value}</p>
    </div>
  );
}

function IssueRow({ issue }) {
  if (!issue) return null;

  const sev = SEVERITY_COLORS[issue?.severity] || SEVERITY_COLORS.info;
  const lc  = LIFECYCLE_COLORS[issue?.lifecycle] || '';
  const ago = Math.round((Date.now() - (issue?.firstDetected ?? issue?.lastSeen ?? Date.now())) / 1000);

  return (
    <div className={`rounded-lg p-2.5 border ${sev.ring} space-y-1.5`}>
      <div className="flex items-center gap-2">
        <Activity size={11} className="shrink-0 text-text-muted" />
        <span className="text-[10px] font-bold text-text-primary flex-1 truncate">{issue?.message || 'Issue detected'}</span>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${lc}`}>
          {issue?.lifecycle?.replace('_', ' ') || 'detecting'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[9px] text-text-muted">
          <Clock size={9} />
          {ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`}
        </div>
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${sev.badge}`}>
          {issue.confidence ?? 0}% CONF
        </span>
      </div>
    </div>
  );
}
