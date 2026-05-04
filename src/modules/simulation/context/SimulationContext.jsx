// SimulationContext.jsx — Closed-loop simulation: Detection → Decision → Action → Resolution
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

import { WaterFlowEngine }                                   from '@sim/simulation/engine/WaterFlowEngine.js';
import { TimeController }                                    from '@sim/simulation/engine/TimeController.js';
import { updateNodeSensors, clearSensorHistory }             from '@sim/simulation/engine/SensorSimulator.js';
import { detectAnomalies, resetAlertCounter }                from '@sim/simulation/ai/AnomalyDetector.js';
import { detectBetweenNodeAnomalies }                       from '@sim/simulation/ai/BetweenNodeDetector.js';
import { generateRedistributionPlan, executePlan }           from '@sim/simulation/ai/DecisionEngine.js';
import { applyScenario }                                     from '@sim/simulation/scenarios/Scenarios.js';

import { issueRegistry, processIssues, resetIssueRegistry } from '@sim/simulation/engine/IssueManager.js';
import { generatePredictions, resetPredictions }            from '@sim/simulation/engine/PredictionEngine.js';
import { runAutoFix, resetAutoFix }                         from '@sim/simulation/engine/AutoFixEngine.js';
import { tankerManager }                                    from '@sim/simulation/engine/TankerManager.js';
import { treatmentPlantManager }                            from '@sim/simulation/environment/TreatmentPlantManager.js';
import { pipeAgingManager }                                 from '@sim/simulation/engine/PipeAgingManager.js';
import { supabase }                                         from '@sim/lib/supabaseClient';

import cityNetwork from '@sim/data/cityNetwork.json';
import buildings   from '@sim/data/buildings.json';
import { SCENARIOS } from '@sim/utils/constants.js';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const engineRef   = useRef(null);
  const timeCtrlRef = useRef(null);

  if (typeof window !== "undefined") {
    window.__debug = false;
  }

  const [networkState,   setNetworkState]   = useState(null);
  
  // PART 4 — ENSURE DATA IS NOT NULL (State guard)
  const isDataReady = !!(networkState && networkState.nodes && networkState.nodes.length > 0);
  const [simTime,        setSimTime]        = useState({ day: 1, hour: 8, minute: 0, second: 0 });
  const [speed,          setSpeed]          = useState(1);
  const [isPaused,       setIsPaused]       = useState(false);
  const [activeScenario, setActiveScenario] = useState(SCENARIOS.NORMAL);
  const [autoOptCount,   setAutoOptCount]   = useState(0);
  const [issues,         setIssues]         = useState([]);
  const [predictions,    setPredictions]    = useState([]);
  const [tankers,        setTankers]        = useState([]);
  const [aiPlan,         setAiPlan]         = useState(null);
  const [toasts,         setToasts]         = useState([]);
  const [treatmentStatus, setTreatmentStatus] = useState(null);
  const [globalMetrics,  setGlobalMetrics]  = useState({
    totalSupply: 0, totalDemand: 0, efficiency: 100,
    activeAlerts: 0, autoOptimizations: 0,
  });

  // Interval timestamps — avoid stale closures
  const lastSensorUpdate    = useRef(0);
  const lastTankerTick      = useRef(0); // tanker tick runs BEFORE issue check
  const lastIssueCheck      = useRef(0);
  const lastPredictionCheck = useRef(0);
  const lastAutoFix         = useRef(0);
  const lastAIPlanCheck     = useRef(0);
  const autoOptRef          = useRef(0);
  const issueCountRef       = useRef(0);
  const prevIssueKeysRef    = useRef(new Set()); // for logging new-issue events

  // POPUP DE-SPAM ENGINE
  const shownActionsRef = useRef(new Set());
  const lastPopupTimeRef = useRef(0);

  const triggerToast = useCallback((alert) => {
    const now = Date.now();
    // 1. Time-based throttle (3 seconds)
    if (now - lastPopupTimeRef.current < 3000) return;
    
    // 2. Action deduplication
    const key = `${alert.type}_${alert.id || alert.location}`;
    if (shownActionsRef.current.has(key)) return;
    
    lastPopupTimeRef.current = now;
    shownActionsRef.current.add(key);
    
    setToasts(prev => [...prev, alert]);
    
    // 4. Reset after some time (10 seconds)
    setTimeout(() => {
      shownActionsRef.current.delete(key);
    }, 10000);
  }, []);

  const [backendCounts, setBackendCounts] = useState({ pipes: 0, valves: 0, tankers: 0, predictions: 0 });
  const [treatmentState, setTreatmentState] = useState({
    active: false,
    contaminatedZones: [],
    flowToPlant: 0,
    treatedFlow: 0
  });

  // PART 4 — RUN TREATMENT PROCESS (TIME BASED)
  useEffect(() => {
    if (!treatmentState.active) return;
    const timer = setTimeout(() => {
      setTreatmentState(prev => ({
        ...prev,
        treatedFlow: prev.flowToPlant * 0.9
      }));
      console.log("[TREATMENT] Water processed by plant.");
    }, 8000); 
    return () => clearTimeout(timer);
  }, [treatmentState.active]);

  // PART 5 — RESTORE WATER AFTER TREATMENT
  useEffect(() => {
    if (treatmentState.treatedFlow > 0) {
      const timer = setTimeout(() => {
        // Restore zones
        if (engineRef.current) {
          const state = engineRef.current.getState();
          state.zones.forEach(z => {
            if (z.isContaminated) {
              z.isContaminated = false;
              z.quality = "safe";
              z.qualityStatus = "safe";
            }
          });
          // PART 10 — AUTO RECOVERY (Nodes)
          state.nodes.forEach(n => {
            if (n.quality) {
              n.quality.pH = 7.0;
              n.quality.status = "safe";
            }
          });
          state.pipes.forEach(p => p.isContaminated = false);
        }
        
        setTreatmentState({
          active: false,
          contaminatedZones: [],
          flowToPlant: 0,
          treatedFlow: 0
        });
        console.log("[TREATMENT] Restoration complete.");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [treatmentState.treatedFlow]);

  // PART 3 — AUTO DETECTION ENGINE
  useEffect(() => {
    const detectionInterval = setInterval(() => {
      if (!engineRef.current || isPaused) return;
      const state = engineRef.current.getState();
      let contaminationFound = false;

      state.nodes.forEach(node => {
        // Initialize if missing
        if (!node.quality) {
          node.quality = {
            pH: 6.5 + Math.random() * 2,
            turbidity: Math.random() * 5,
            tds: 100 + Math.random() * 400,
            status: "safe"
          };
        }

        // Detect unsafe pH
        if (node.quality.pH < 6.5 || node.quality.pH > 8.5) {
          node.quality.status = "unsafe";
          contaminationFound = true;

          // PART 6 — ALERT SYSTEM INTEGRATION (THROTTLED)
          const alert = {
            id: `WQ_${node.id}`,
            type: "WATER_QUALITY",
            title: "Contamination Detected",
            message: `pH abnormal (${node.quality.pH.toFixed(2)}) at ${node.id}`,
            severity: "critical",
            timestamp: Date.now()
          };
          triggerToast(alert);

          // PART 7 — AI STRATEGY INTEGRATION
          setAiPlan(prev => ({
            ...prev,
            message: `AI detected abnormal pH at Node ${node.id}. Contamination isolated and redirected to treatment plant.`,
            timestamp: Date.now()
          }));

          // PART 4 — SPREAD TO PIPE + ZONE
          state.pipes.forEach(pipe => {
            if (pipe.source === node.id || pipe.target === node.id) {
              pipe.isContaminated = true;
            }
          });

          state.zones.forEach(zone => {
            if (zone.connectedNodes?.includes(node.id)) {
              zone.isContaminated = true;
              zone.qualityStatus = "unsafe";

              // PART 5 — AUTO TRIGGER SEWAGE FLOW
              if (!treatmentState.active) {
                setTreatmentState({
                  active: true,
                  contaminatedZones: [zone.id],
                  flowToPlant: (zone.supplyCurrent || 500) * 0.5,
                  treatedFlow: 0
                });
              }
            }
          });
        }
      });

      if (contaminationFound) {
        setNetworkState({ ...state });
      }
    }, 5000);

    return () => clearInterval(detectionInterval);
  }, [treatmentState.active, isPaused]);

  // PART 11 — OPTIONAL RANDOM DEMO TRIGGER
  useEffect(() => {
    const demoTimer = setInterval(() => {
      if (!engineRef.current || isPaused || treatmentState.active) return;
      const state = engineRef.current.getState();
      const nodes = state.nodes;
      if (nodes.length > 0) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (randomNode.quality) {
          randomNode.quality.pH = Math.random() > 0.5 ? 5.2 : 9.1;
          console.log(`[DEMO] pH Disturbed at ${randomNode.id}: ${randomNode.quality.pH}`);
          setNetworkState({ ...state });
        }
      }
    }, 18000);
    return () => clearInterval(demoTimer);
  }, [isPaused, treatmentState.active]);

  useEffect(() => {
    async function loadBackendData() {
      if (!supabase) return;
      try {
        // Safe parallel fetch for counts - handle missing tables individually
        const getCount = async (table) => {
          try {
            const { count, error } = await supabase.from(table).select("*", { count: 'exact', head: true });
            if (error) return 0;
            return count || 0;
          } catch { return 0; }
        };

        const [pipes, valves, tankers, predictions] = await Promise.all([
          getCount("pipes"),
          getCount("valves"),
          getCount("tankers"),
          getCount("predictions")
        ]);

        setBackendCounts({ pipes, valves, tankers, predictions });
      } catch (err) {
        console.warn("[BACKEND] Count load skipped:", err.message);
      }
    }

    async function fetchIssues() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("issues")
          .select("type,location,severity,confidence,lifecycle")
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.warn("[SUPABASE] fetchIssues 400 check:", error.message, error.details);
          return;
        }

        if (data) setIssues(data);
      } catch (e) {
        console.warn("[FETCH FAIL]", e.message);
      }
    }

    loadBackendData();
    fetchIssues();

    // Real-time DB Sync (CRITICAL)
    const channel = supabase
      .channel('realtime-issues')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'issues'
      }, payload => {
        console.log("Realtime DB Update:", payload);
        if (payload.eventType === "INSERT") {
          fetchIssues(); // PART 5 — RE-FETCH ON INSERT
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // PART 2 — CREATE EVENT-BASED INSERT
  const lastInsertTimeRef = useRef(0);
  const safeInsertTanker = useCallback(async (tanker) => {
    if (!supabase) return; // PART 5 — PREVENT CRASH
    const now = Date.now();
    if (now - lastInsertTimeRef.current < 5000) return; // 5 sec throttle
    lastInsertTimeRef.current = now;

    console.log("[SAFE INSERT CALLED]", tanker.id); // PART 6 — DEBUG

    try {
      const { error } = await supabase.from("tankers").upsert([{
        id: tanker.id,
        status: tanker.status,
        current_location: `${Math.round(tanker.position.x)},${Math.round(tanker.position.y)}`,
        target_zone: tanker.targetZoneId
      }]);

      if (error) {
        console.warn("[SUPABASE ERROR]", error.message);
      } else {
        console.log("[TANKER SAVED]", tanker.id, tanker.status);
      }
    } catch (e) {
      console.warn("[SUPABASE FAIL]", e.message);
    }
  }, []);

  // Removed testInsert to prevent accidental spam

  // ─── Main simulation loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new WaterFlowEngine(cityNetwork, buildings);
    }
    const engine = engineRef.current;

    // Expose engine for testing (browser console access)
    if (typeof window !== 'undefined') {
      window.__engine = engine;
    }

    const tc = new TimeController();
    timeCtrlRef.current = tc;
    tc.addListener((t) => setSimTime({ ...t }));
    tc.start();

    // PART 2 — INITIAL STATE LOAD
    const initialState = engine.getState();
    if (initialState && initialState.nodes && initialState.nodes.length > 0) {
      setNetworkState({ ...initialState });
      console.log("[INIT] Network state captured successfully:", initialState.nodes.length, "nodes");
    } else {
      console.warn("[INIT] Engine state empty or invalid at startup");
    }

    // Give tankerManager network state reference for path planning
    tankerManager.setNetworkState(engine.getState());

    let animId;
    const loop = () => {
      const now = Date.now();
      const eng  = engineRef.current;
      const tCtrl = timeCtrlRef.current;

      if (!eng || !tCtrl || tCtrl.isPaused) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const state = eng.getState();

      // ── 1. TankerTick ───────────────────────────────────────────
      if (now - lastTankerTick.current > 3000) {
        const prevTankerStates = tankerManager.getActive().map(t => ({ id: t.id, status: t.status }));
        tankerManager.tick(state.zones);
        const activeTankers = tankerManager.getActive();
        setTankers([...activeTankers]);
        lastTankerTick.current = now;

        // PART 3 — CALL ONLY ON REAL EVENTS
        activeTankers.forEach(tanker => {
          const prev = prevTankerStates.find(p => p.id === tanker.id);
          // Only sync if status changed or it's a critical state
          if (!prev || prev.status !== tanker.status) {
            safeInsertTanker(tanker);
          }
        });
      }

      // ── 2. PhysicsTick ──────────────────────────────────────────
      eng.tick(tCtrl.getTime());

      // ── 3. SensorUpdate ─────────────────────────────────────────
      if (now - lastSensorUpdate.current > 500) {
        eng.nodes.forEach((n) => updateNodeSensors(n));
        lastSensorUpdate.current = now;
      }

      // ── 4. IssueDetection ───────────────────────────────────────
      if (now - lastIssueCheck.current > 2000) {
        const rawDetections = detectAnomalies(state);

        // Add predictive maintenance issues (all assets)
        const agingIssues = pipeAgingManager.getPredictiveIssues(state.pipes, state.valves, state.nodes, now);

        // Add between-node anomalies (blockages & leaks)
        const betweenNodeAnomalies = detectBetweenNodeAnomalies(state);

        const activeIssues  = processIssues([...rawDetections, ...agingIssues, ...betweenNodeAnomalies]);
        
        // PART 2 — DETECT CONTAMINATION EVENT
        activeIssues.forEach(issue => {
          if (issue.type === "CONTAMINATION" && !treatmentState.active) {
            setTreatmentState({
              active: true,
              contaminatedZones: [issue.zoneId || 'IND1'],
              flowToPlant: 500,
              treatedFlow: 0
            });
            
            const zone = state.zones.find(z => z.id === (issue.zoneId || 'IND1'));
            if (zone) {
              zone.isContaminated = true;
              zone.quality = "unsafe";
            }
          }
        });

        // PART 3 — ISOLATE + REDUCE SUPPLY (Before state capture)
        state.zones.forEach(z => {
          if (z.isContaminated) {
            // Visual supply reduction
            z.displaySupply = (z.supplyCurrent || 0) * 0.3;
          }
        });

        setIssues([...activeIssues]);
        lastIssueCheck.current = now;
      }

      // ── 5. PredictionEngine ─────────────────────────────────────
      if (now - lastPredictionCheck.current > 5000) {
        const preds = generatePredictions(state, tCtrl.getTime());
        setPredictions(preds);
        
        preds.forEach(async (pred) => {
          if (pred.risk > 0.75 && !pred.actionTriggered) {
            autoFixEngine.handlePrediction(pred, eng, state);
            pred.actionTriggered = true;

            // PART 4 — REMOVED SUPABASE CALL FROM ANIMATION LOOP
            console.log("[PREDICTION DETECTED]", pred.asset_id);
          }
        });
        lastPredictionCheck.current = now;
      }

      // ── 6. AutoFixEngine (PRIORITY + FALLBACK) ──────────────────
      if (now - lastAutoFix.current > 3000) {
        const activeIssues = issueRegistry.getActiveIssues();
        const actions = runAutoFix(activeIssues, state, eng);
        if (actions.length > 0) {
          autoOptRef.current += actions.length;
          setAutoOptCount(autoOptRef.current);
          setIssues([...issueRegistry.getActiveIssues()]);

          // Notify user of successful AI actions
          actions.forEach(action => {
            triggerToast({
              id: `AI_FIX_${action.type}_${action.valveId || action.zoneId || 'global'}`,
              type: "success",
              title: "AI Optimization",
              message: `AI successfully executed: ${action.type.replace(/_/g, ' ')}`,
              severity: "info",
              timestamp: Date.now()
            });
          });
        }
        lastAutoFix.current = now;
      }

      // ── 6b. Treatment Plant Lifecycle & Contamination Processing ───
      // Check for contaminated zones and start treatment
      let treatmentStarted = false;
      state.zones.forEach((zone) => {
        if (zone.isContaminated && !zone.treatmentStarted) {
          zone.treatmentStarted = true;
          const flowToTreat = zone.supplyCurrent || 0;
          treatmentPlantManager.process(flowToTreat, zone.contaminationLevel || 1);
          console.log(`[TREATMENT START] Zone ${zone.id} - Flow: ${flowToTreat} L/min`);
          treatmentStarted = true;
        }
      });

      // FORCE STATE UPDATE when treatment starts
      if (treatmentStarted) {
        setNetworkState({ ...eng.getState() });
        console.log(`[STATE SYNC] Treatment started - zones marked for processing`);
      }

      // Monitor treatment plant status
      if (treatmentPlantManager.plant.status === 'processing') {
        const elapsed = Date.now() - (treatmentPlantManager.plant.startTime || Date.now());
        const processingTime = treatmentPlantManager.plant.processingTime * 1000;

        if (elapsed >= processingTime) {
          treatmentPlantManager.complete();

          // Restore treated water to zones
          state.zones.forEach((z) => {
            if (z.isContaminated && z.treatmentStarted) {
              z.isContaminated = false;
              z.treatmentStarted = false;
              z.redirectToTreatment = false;
              z.waterQuality = 'good';
              if (!z.supply) z.supply = z.supplyCurrent || 100;
              console.log(`[TREATMENT COMPLETE] Zone ${z.id} - Water restored to safe`);
            }
          });

          // Auto-resolve contamination issues after treatment
          const activeContaminationIssues = issueRegistry.getActiveIssues()
            .filter((i) => i.type === 'CONTAMINATION' || i.type === 'SEWAGE_INFLOW');
          activeContaminationIssues.forEach((issue) => {
            issue.lifecycle = 'resolved';
            issue.resolvedAt = Date.now();
          });

          // FORCE IMMEDIATE STATE UPDATE — Notify React of treatment completion
          setNetworkState({ ...eng.getState() });
          console.log(`[STATE SYNC] Treatment completed - zones restored to safe`);
        }
      }

      setTreatmentStatus(treatmentPlantManager.getStatus());

      // ── 7. LifecycleUpdate ──────────────────────────────────────
      // (Handled internally by IssueManager and AutoFixEngine stability checks)

      // ── Global metrics ──────────────────────────────────────────
      const totalSupply = state.zones.reduce((s, z) => s + (z.supplyCurrent || 0), 0);
      const totalDemand = state.zones.reduce((s, z) => s + (z.demandCurrent || 0), 0);
      setGlobalMetrics({
        totalSupply:       Math.round(totalSupply),
        totalDemand:       Math.round(totalDemand),
        efficiency:        totalDemand > 0 ? Math.round((totalSupply / totalDemand) * 1000) / 10 : 100,
        activeAlerts:      issueRegistry.getActiveIssues().length,
        autoOptimizations: autoOptRef.current,
      });
      if (state) {
        setNetworkState({ ...state });
      }

      animId = requestAnimationFrame(loop);
    };

    console.log("[LOOP] Starting simulation loop...");
    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); tc.stop(); };
  }, []);


  // ─── Actions ────────────────────────────────────────────────────────────

  const pauseSim = useCallback(() => { timeCtrlRef.current?.pause(); setIsPaused(true); }, []);
  const playSim  = useCallback(() => { timeCtrlRef.current?.play();  setIsPaused(false); }, []);

  const setSimSpeed = useCallback((s) => {
    timeCtrlRef.current?.setSpeed(s);
    setSpeed(s);
  }, []);

  const loadScenario = useCallback((name) => {
    if (!engineRef.current) return;
    clearSensorHistory();
    resetAlertCounter();
    resetIssueRegistry();
    resetPredictions();
    resetAutoFix();
    tankerManager.reset();
    treatmentPlantManager.reset();
    setIssues([]);
    setPredictions([]);
    setTankers([]);
    setTreatmentStatus(null);
    setAiPlan(null);
    autoOptRef.current     = 0;
    issueCountRef.current  = 0;
    prevIssueKeysRef.current = new Set();
    setAutoOptCount(0);
    applyScenario(name, engineRef.current);
    setActiveScenario(name);
    timeCtrlRef.current?.reset();
    setSimTime({ day: 1, hour: 8, minute: 0, second: 0 });
    setIsPaused(false);
    setSpeed(1);
    console.log(`[SIM] Scenario loaded: ${name}`);
  }, []);

  const executeAIPlan = useCallback(() => {
    if (!aiPlan || !engineRef.current) return;
    executePlan(aiPlan, engineRef.current);
    autoOptRef.current += 1;
    setAutoOptCount(autoOptRef.current);
    setAiPlan(null);
    console.log(`[SIM] Manual AI plan executed (${aiPlan.actions.length} actions)`);
  }, [aiPlan]);

  const dismissAlert = useCallback((issueId) => {
    issueRegistry.dismiss(issueId);
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const setValveOpening = useCallback((id, pct) => {
    engineRef.current?.setValveOpening(id, pct);
    console.log(`[VALVE UPDATE] ${id} → ${pct}%`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] Valve opening changed');
  }, []);

  const setValveMode = useCallback((id, mode) => {
    engineRef.current?.setValveMode(id, mode);
    console.log(`[VALVE MODE] ${id} → ${mode.toUpperCase()}`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] Valve mode changed');
  }, []);

  const blockPipe = useCallback((id) => {
    engineRef.current?.blockPipe(id);
    console.log(`[TRIGGER] Block pipe ${id}`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] Pipe blocked');
  }, []);

  const unblockPipe = useCallback((id) => {
    engineRef.current?.unblockPipe(id);
    console.log(`[TRIGGER] Unblock pipe ${id}`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] Pipe unblocked');
  }, []);

  const unblockAllPipes = useCallback(() => {
    const state = engineRef.current?.getState();
    state?.pipes.forEach((p) => {
      if (p.status === 'blocked') {
        engineRef.current?.unblockPipe(p.id);
      }
    });
    console.log(`[TRIGGER] Unblock ALL pipes`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] All pipes unblocked');
  }, []);

  const createLeak = useCallback((id) => {
    engineRef.current?.createLeak(id);
    console.log(`[TRIGGER] Create leak at ${id}`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] Leak created');
  }, []);

  const surgeDemand = useCallback((id, mult) => {
    engineRef.current?.surgeDemand(id, mult);
    console.log(`[TRIGGER] Surge demand ${id} x${mult}`);
    setNetworkState({ ...engineRef.current?.getState() });
    console.log('[UI SYNC TRIGGERED] Demand surged');
  }, []);

  const triggerContamination = useCallback(() => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    const zone = state.zones.find(z => z.id === 'IND1') || state.zones[0];
    
    // Create manual issue that will be picked up by loop
    const rawIssue = {
      id: `CONTAM_${Date.now()}`,
      type: "CONTAMINATION",
      zoneId: zone.id,
      severity: "critical",
      message: "Severe sewage line breach detected in Industrial Zone",
      autoFixAvailable: true
    };
    
    // Push directly to registry for immediate detection
    issueRegistry.issues.set(`CONTAM_${zone.id}`, {
      ...rawIssue,
      lifecycle: 'validated',
      firstDetected: Date.now(),
      tickCount: 10
    });
    
    console.log("[MANUAL TRIGGER] Contamination started at", zone.id);
    setNetworkState({ ...engineRef.current.getState() });
  }, []);

  // ─── Context value ───────────────────────────────────────────────────────
  const value = {
    networkState,
    isDataReady,
    simTime,
    speed,
    isPaused,
    activeScenario,
    globalMetrics,
    autoOptCount,
    backendCounts,
    treatmentState,
    triggerContamination,
    issues,
    predictions,
    tankers,
    treatmentStatus,
    toasts,
    alerts: issues, // backward compat alias
    aiPlan,
    pauseSim,
    playSim,
    setSimSpeed,
    loadScenario,
    executeAIPlan,
    dismissAlert,
    dismissToast,
    setValveOpening,
    setValveMode,
    blockPipe,
    unblockPipe,
    unblockAllPipes,
    createLeak,
    surgeDemand,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}

export { SimulationContext };
