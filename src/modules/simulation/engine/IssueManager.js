import { supabase } from '@backend/supabaseClient';

const savedKeys = new Set();

let lastInsertTime = 0;

async function safeInsertIssue(issue) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("issues").insert([{
      type: issue.type,
      location: issue.location || issue.pipeId || issue.zoneId || "unknown",
      severity: issue.severity,
      confidence: issue.confidence,
      lifecycle: issue.lifecycle
    }]);

    if (error) {
      console.warn("[INSERT ERROR]", error.message);
      return;
    }

    console.log("[ISSUE SAVED]");
  } catch (e) {
    console.warn("[DB FAIL - SAFE]", e.message);
  }
}

function saveIssueToDB(issue) {
  if (savedKeys.has(issue.key)) return;
  savedKeys.add(issue.key);
  // PART 4 — MAKE DB CALL NON-BLOCKING (NO AWAIT)
  safeInsertIssue(issue);
}

const VALIDATION_TICKS = 3;  // anomaly must persist N cycles to become a real issue
const CLEARANCE_TICKS  = 4;  // anomaly must be absent N cycles to mark resolved

let issueIdCounter = 1;

// Sliding window of detection booleans per issue key (Phase 2 confidence)
const detectionWindows = new Map();
const WINDOW_SIZE = 8;

class IssueRegistry {
  constructor() {
    this.issues          = new Map(); // key → IssueObject
    this.pendingCounts   = new Map(); // key → { count, data }
    this.clearanceCounts = new Map(); // key → number
  }

  getKey(raw) {
    if (raw.pipeId)      return `${raw.type}_pipe_${raw.pipeId}`;
    if (raw.zoneId)      return `${raw.type}_zone_${raw.zoneId}`;
    if (raw.nodeId)      return `${raw.type}_node_${raw.nodeId}`;
    if (raw.reservoirId) return `${raw.type}_res_${raw.reservoirId}`;
    if (raw.nodes)       return `${raw.type}_nodes_${[...raw.nodes].sort().join('_')}`;
    return `${raw.type}_${raw.message?.slice(0, 20).replace(/\s/g, '_')}`;
  }

  processTick(rawDetections) {
    const detectedKeys = new Set(rawDetections.map((r) => this.getKey(r)));

    // --- Fresh detections ---
    for (const raw of rawDetections) {
      const key = this.getKey(raw);

      // PART 3 — FIX ISSUE DUPLICATION ONLY
      const exists = [...this.issues.values()].find(i => 
        i.type === raw.type && 
        (i.location === raw.location || i.pipeId === raw.pipeId || i.zoneId === raw.zoneId) &&
        i.lifecycle !== "resolved"
      );
      if (exists) continue;

      this._recordDetection(key, true);

      if (this.issues.has(key)) {
        const issue = this.issues.get(key);
        if (issue.lifecycle === 'resolved') continue;
        issue.lastSeen   = Date.now();
        issue.tickCount += 1;
        issue.confidence = this._computeConfidence(key, raw);
        issue.severity   = raw.severity;
        issue.message    = raw.message;
        if (raw.gap        !== undefined) issue.gap        = raw.gap;
        if (raw.difference !== undefined) issue.difference = raw.difference;
        this.clearanceCounts.delete(key);

        if (issue.lifecycle === 'detecting' && issue.tickCount >= VALIDATION_TICKS) {
          issue.lifecycle = 'validated';
          console.log(`[ISSUE VALIDATED] ${issue.id} (${issue.type})`);
          saveIssueToDB(issue);
        }
      } else {
        const pending = this.pendingCounts.get(key) || { count: 0, data: raw };
        pending.count += 1;
        pending.data   = raw;
        this.pendingCounts.set(key, pending);

        if (pending.count === 1) {
          console.log(`[ISSUE DETECTED] ${raw.type} at ${raw.pipeId || raw.zoneId || 'unknown'}`);
        }

        if (pending.count >= VALIDATION_TICKS) {
          const conf  = this._computeConfidence(key, raw);
          const issue = this._createIssue(key, raw, conf);
          this.issues.set(key, issue);
          this.pendingCounts.delete(key);
          console.log(`[ISSUE VALIDATED] ${issue.id} (${issue.type})`);
          saveIssueToDB(issue);
        }
      }
    }

    // --- Issues no longer detected → clearance countdown ---
    for (const [key, issue] of this.issues) {
      if (issue.lifecycle === 'resolved') continue;
      if (detectedKeys.has(key)) continue;

      this._recordDetection(key, false);
      
      // If NOT in_progress, we can clear it normally
      // If in_progress, we wait for AutoFixEngine to resolve it via stability check
      if (issue.lifecycle !== 'in_progress') {
        const count = (this.clearanceCounts.get(key) || 0) + 1;
        this.clearanceCounts.set(key, count);

        if (count >= CLEARANCE_TICKS) {
          issue.lifecycle  = 'resolved';
          issue.resolvedAt = Date.now();
          console.log(`[ISSUE STABILIZED → RESOLVED] ${issue.id}`);
        }
      }
    }
  }

  _recordDetection(key, detected) {
    const win = detectionWindows.get(key) || [];
    win.push(detected);
    if (win.length > WINDOW_SIZE) win.shift();
    detectionWindows.set(key, win);
  }

  _computeConfidence(key, raw) {
    const base        = raw.severity === 'critical' ? 70 : raw.severity === 'warning' ? 50 : 35;
    const win         = detectionWindows.get(key) || [];
    const detectedPct = win.length ? win.filter(Boolean).length / win.length : 0;
    const consistency = Math.round(detectedPct * 20);
    const existingTicks = this.issues.get(key)?.tickCount || this.pendingCounts.get(key)?.count || 0;
    const persistence   = Math.min(15, existingTicks * 3);
    let magnitude = 0;
    if (raw.difference > 0) magnitude = Math.min(10, raw.difference / 5);
    if (raw.gap > 0)        magnitude = Math.min(10, raw.gap / 20);
    return Math.min(98, Math.round(base + consistency + persistence + magnitude));
  }

  _createIssue(key, raw, confidence) {
    return {
      id:               `ISSUE_${String(issueIdCounter++).padStart(4, '0')}`,
      key,
      type:             raw.type,
      lifecycle:        'validated',
      severity:         raw.severity,
      confidence,
      message:          raw.message,
      firstDetected:    Date.now(),
      lastSeen:         Date.now(),
      tickCount:        VALIDATION_TICKS,
      resolvedAt:       null,
      dismissed:        false,
      effectApplied:    false,
      autoFixAvailable: raw.autoFixAvailable || false,
      ...raw, // preserve all location / action fields from raw detection
    };
  }

  getActiveIssues() {
    return [...this.issues.values()].filter((i) => i.lifecycle !== 'resolved' && !i.dismissed);
  }

  getAllIssues() {
    return [...this.issues.values()];
  }

  markInProgress(issueId) {
    for (const issue of this.issues.values()) {
      if (issue.id === issueId && issue.lifecycle === 'validated') {
        issue.lifecycle = 'in_progress';
      }
    }
  }

  dismiss(issueId) {
    for (const issue of this.issues.values()) {
      if (issue.id === issueId) {
        issue.dismissed  = true;
        issue.lifecycle  = 'resolved';
        issue.resolvedAt = Date.now();
        console.log(`[ISSUE] 🗑 DISMISSED ${issue.id} (${issue.type})`);
        return;
      }
    }
  }

  reset() {
    this.issues.clear();
    this.pendingCounts.clear();
    this.clearanceCounts.clear();
    detectionWindows.clear();
    issueIdCounter = 1;
  }
}

export const issueRegistry = new IssueRegistry();

export function processIssues(rawDetections) {
  issueRegistry.processTick(rawDetections);
  return issueRegistry.getActiveIssues();
}

export function resetIssueRegistry() {
  issueRegistry.reset();
}
