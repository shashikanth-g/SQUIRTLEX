# UI Module

**OWNER: TEAM_MEMBER_4 (Frontend/UI Lead)**

## Responsibilities

- React components (pages, alerts, dashboard, simulation visuals)
- UI state management via hooks
- User interaction handling
- Real-time visualization (CityMap, HeatmapOverlay, TankerLayer, etc.)
- Authentication UI (Login, Dashboard)

## Key Files

- `components/simulation/CityMap.jsx` — Network visualization
- `components/simulation/HeatmapOverlay.jsx` — Pressure/supply heatmap
- `components/intelligence/IssuePanel.jsx` — Issue alerts
- `pages/Dashboard.jsx` — Main UI
- `pages/Login.jsx` — Auth UI

## Module Boundary

**Imports from:** `@sim/` (state), `@ai/` (issue data), `@backend/` (auth)
**Exports to:** None (leaf module)
**Do NOT create new imports between @sim, @ai, @backend**

## Integration Point

UI reads state via `SimulationContext`:
- `networkState` (pressure, flow, zones)
- `issues` (active alerts)
- Callbacks: `setValveOpening()`, `handleAutoFix()`, `login()`

## Development Workflow

1. Create branch: `git checkout -b ui-work`
2. Edit files inside `src/modules/ui/`
3. Import using `@ui/components/CityMap`
4. Test: `npm run dev` → verify visuals render
5. Merge: PR must include screenshots of UI changes
