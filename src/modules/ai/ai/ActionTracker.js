// ActionTracker.js — Memory system for autonomous actions with cooldowns
class ActionTracker {
  constructor() {
    this.history = [];           // Full action log
    this.memory = new Map();     // key: issueId_actionType -> lastAttemptedAt
    this.activeTracking = new Map(); 
    this.COOLDOWN_MS = 10000;    // 10 second cooldown per action/issue
  }

  /**
   * Memory system check: was this specific action tried recently for this issue?
   */
  wasRecentlyTried(issueId, actionType) {
    const key = `${issueId}_${actionType}`;
    if (!this.memory.has(key)) return false;
    
    const elapsed = Date.now() - this.memory.get(key);
    return elapsed < this.COOLDOWN_MS;
  }

  /**
   * Record an action attempt in memory.
   */
  record(issueId, actionType, success) {
    const key = `${issueId}_${actionType}`;
    this.memory.set(key, Date.now());

    this.history.push({
      issueId,
      actionType,
      success,
      timestamp: Date.now()
    });
    
    if (this.history.length > 200) this.history.shift();
  }

  startTracking(issueKey, action, issue) {
    const record = {
      issueKey,
      issueId: issue.id,
      issueType: issue.type,
      actionType: action.type,
      actionDetails: action,
      startedAt: Date.now(),
      checkCycles: 0,
      initialState: this._captureState(issue),
      currentState: null,
      status: 'in_progress',
    };
    this.activeTracking.set(issueKey, record);
    return record;
  }

  updateTracking(issueKey, currentIssue, state) {
    const record = this.activeTracking.get(issueKey);
    if (!record) return null;
    record.checkCycles++;
    record.currentState = this._captureState(currentIssue);
    return record;
  }

  markSuccess(issueKey, finalState) {
    const record = this.activeTracking.get(issueKey);
    if (!record) return;
    record.status = 'success';
    record.completedAt = Date.now();
    this.activeTracking.delete(issueKey);
    console.log(`[ACTION SUCCESS] ${record.actionType} for ${issueKey}`);
  }

  markFailure(issueKey, reason) {
    const record = this.activeTracking.get(issueKey);
    if (!record) return;
    record.status = 'failed';
    record.completedAt = Date.now();
    this.activeTracking.delete(issueKey);
    console.log(`[ACTION FAILED → RETRY] ${record.actionType} for ${issueKey}: ${reason}`);
  }

  isImproving(issueKey) {
    const record = this.activeTracking.get(issueKey);
    if (!record || !record.currentState) return null;
    const initial = record.initialState;
    const current = record.currentState;

    switch (record.issueType) {
      case 'PRESSURE_IMBALANCE':
        return Math.abs(current.pressureDelta || 0) < Math.abs(initial.pressureDelta || 0) - 1;
      case 'UNDER_SUPPLY':
        return (current.supplyRatio || 0) > (initial.supplyRatio || 0) + 0.05;
      case 'WATER_QUALITY':
        return Math.abs(current.phDeviation || 0) < Math.abs(initial.phDeviation || 0) - 0.05;
      case 'BLOCKAGE':
        return (current.flowRate || 0) > (initial.flowRate || 0) + 5;
      case 'LOW_RESERVOIR':
        return (current.reservoirLevel || 0) > (initial.reservoirLevel || 0);
      default:
        return null;
    }
  }

  _captureState(issue) {
    if (!issue) return null;
    return {
      pressureDelta: issue.difference,
      supplyRatio: issue.gap != null ? (1 - issue.gap / 100) : null,
      phValue: issue.phValue,
      phDeviation: issue.phValue ? Math.abs(7.5 - issue.phValue) : null,
      flowRate: issue.flowRate,
      reservoirLevel: issue.level,
    };
  }

  reset() {
    this.history = [];
    this.memory.clear();
    this.activeTracking.clear();
  }
}

export const actionTracker = new ActionTracker();
