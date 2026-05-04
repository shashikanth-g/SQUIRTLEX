// IssuePanel.jsx — System alerts panel with AutoFix actions
import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { AlertCircle, Clock, CheckCircle2, Activity, Droplets, Zap, ShieldAlert, XCircle, Play } from 'lucide-react';
import { issueRegistry } from '../../simulation/engine/IssueManager.js';
import { autoFixEngine } from '../../simulation/engine/AutoFixEngine.js';
import { filterByCategory } from '../../utils/issueCategories.js';

export default function IssuePanel() {
  const { issues, networkState } = useSimulation();

  // Show ONLY system alerts (not AI predictions)
  const systemAlerts = filterByCategory(issues, 'system');

  return (
    <div className="glass-card flex flex-col overflow-hidden" style={{ maxHeight: '500px' }}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <ShieldAlert size={16} className="text-accent" />
          System Alerts
        </h3>
        <span className="text-[10px] font-mono text-text-muted">{systemAlerts.length} ACTIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {systemAlerts.length > 0 ? (
          systemAlerts.map((issue) => (
            <IssueItem key={issue.id} issue={issue} networkState={networkState} />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="p-4 rounded-full bg-success/10 border border-success/20">
              <CheckCircle2 className="text-success/50" size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">System Nominal</p>
              <p className="text-[10px] text-text-muted">No operational issues detected by SQUIRTLE-X AI.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IssueItem({ issue, networkState }) {
  if (!issue) return null;

  const type = issue?.type || 'UNKNOWN';
  const lifecycle = issue?.lifecycle || 'detecting';
  const severity = issue?.severity || 'warning';
  const message = issue?.message || 'No description available';
  const confidence = issue?.confidence || 0;
  const firstDetected = issue?.firstDetected || Date.now();
  const autoFixAvailable = issue?.autoFixAvailable || false;

  // Extract location from issue fields
  const location = issue?.zoneId
    ? `Zone ${issue.zoneId}`
    : issue?.nodeId
    ? `Node ${issue.nodeId}`
    : issue?.pipeId
    ? `Pipe ${issue.pipeId}`
    : 'Network';

  const typeIcons = {
    PRESSURE_IMBALANCE: Droplets,
    UNDER_SUPPLY: Droplets,
    BLOCKAGE: Zap,
    WATER_QUALITY: ShieldAlert,
    POLLUTION: ShieldAlert,
    LOW_RESERVOIR: Activity,
  };
  const Icon = typeIcons[type] || AlertCircle;

  const lifecycleColors = {
    detecting: 'text-text-muted border-text-muted/20 bg-text-muted/5',
    validated: 'text-accent border-accent/20 bg-accent/5',
    in_progress: 'text-warning border-warning/20 bg-warning/5',
    resolved: 'text-success border-success/20 bg-success/5',
  };

  const handleAutoFix = () => {
    if (!autoFixAvailable || !networkState) return;

    console.log(`[ACTION CLICKED] AutoFix for ${issue.id}`);

    // Trigger AutoFix manually with direct engine reference
    const engine = window.__engine;
    if (!engine) {
      console.error('[AUTOFIX ERROR] Engine not available');
      return;
    }

    // Execute action (new method with full lifecycle tracking)
    const actionResult = autoFixEngine.execute(issue, networkState, engine);

    if (actionResult) {
      console.log(`[AUTOFIX EXECUTED]`, issue.id, actionResult.type);
      // Force UI update
      console.log('[UI SYNC TRIGGERED]');
    } else {
      console.log(`[AUTOFIX] No viable action for ${issue.id}`);
    }
  };

  const handleDismiss = () => {
    console.log(`[ACTION CLICKED] Dismiss ${issue.id}`);
    issueRegistry.dismiss(issue.id);
    console.log(`[ISSUE DISMISSED] ${issue.id}`);
  };

  return (
    <div className={`p-3 rounded-lg border border-white/5 bg-white/3 transition-all hover:bg-white/5 ${lifecycle === 'resolved' ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${severity === 'critical' ? 'text-accent bg-accent/10' : 'text-warning bg-warning/10'}`}>
            <Icon size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">{type?.replace(/_/g, ' ')}</span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${lifecycleColors[lifecycle] || lifecycleColors.detecting}`}>
          {lifecycle?.replace('_', ' ')}
        </div>
      </div>

      <p className="text-xs font-semibold text-text-primary mb-1">{location}</p>
      <p className="text-[10px] text-text-muted leading-tight mb-2">{message}</p>

      {/* Action status display */}
      {issue.activeAction && (
        <div className="mt-2 p-2 rounded bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
              {issue.activeAction.type?.replace(/_/g, ' ')}
            </span>
            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
              issue.activeAction.status === 'executing' ? 'bg-primary/20 text-primary' :
              issue.activeAction.status === 'completing' ? 'bg-warning/20 text-warning' :
              issue.activeAction.status === 'completed' ? 'bg-success/20 text-success' :
              'bg-accent/20 text-accent'
            }`}>
              {issue.activeAction.status}
            </span>
          </div>
          <div className="text-[9px] text-text-muted mt-1">
            {Math.round((Date.now() - issue.activeAction.startedAt) / 1000)}s elapsed
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1 text-[9px] text-text-muted">
          <Clock size={10} />
          <span>{Math.round((Date.now() - firstDetected) / 1000)}s ago</span>
        </div>
        <span className="text-[9px] font-mono font-bold text-primary">{confidence}% CONF</span>
      </div>

      {/* Action buttons */}
      {lifecycle === 'validated' && (
        <div className="flex gap-2 mt-3">
          {autoFixAvailable && (
            <button
              onClick={handleAutoFix}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold transition-colors"
            >
              <Play size={12} />
              AUTO-FIX
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-accent/20 hover:bg-accent/30 text-accent text-[10px] font-bold transition-colors"
          >
            <XCircle size={12} />
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
}
