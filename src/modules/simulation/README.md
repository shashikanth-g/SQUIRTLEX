# Simulation Module

**OWNER: TEAM_MEMBER_1 (Simulation Lead)**

## Responsibilities

- Water flow physics calculations
- Graph-based network topology
- Pressure propagation & flow routing
- Pipe/valve physics & blocking logic
- Asset aging & degradation tracking
- Between-node anomaly detection (leaks, blockages)
- Real-time state management

## Key Files

- `engine/WaterFlowEngine.js` — Core simulation loop
- `engine/NetworkGraph.js` — Graph topology & pathfinding (BFS)
- `engine/PipeAgingManager.js` — Asset aging system
- `ai/AnomalyDetector.js` — Physics-based anomaly detection
- `ai/BetweenNodeDetector.js` — Mid-pipe leak/blockage detection
- `environment/TreatmentPlantManager.js` — Sewage treatment simulation

## Module Boundary

**Imports from:** `@sim/` (internal only)
**Exports to:** `SimulationContext` (integration layer)
**Do NOT import from:** `@ai`, `@backend`, `@ui` directly

## Integration Point

All state changes → via `SimulationContext.jsx` callbacks:
- `setNetworkState()`
- `detectAnomalies()`
- `processIssues()`

## Development Workflow

1. Create branch: `git checkout -b simulation-work`
2. Edit files inside `src/modules/simulation/`
3. Import using `@sim/engine/WaterFlowEngine`
4. Test: `npm run dev` → verify no errors
5. Merge: PR must pass build + no import errors
