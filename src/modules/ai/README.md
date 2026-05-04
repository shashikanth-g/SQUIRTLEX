# AI Module

**OWNER: TEAM_MEMBER_2 (AI/Intelligence Lead)**

## Responsibilities

- Issue prioritization & ranking
- Autonomous decision-making (AutoFix engine)
- Action fallback strategies
- Action tracking & success/failure memory
- Predictive failure detection
- Issue lifecycle management (detecting → validated → in_progress → resolved)

## Key Files

- `engine/AutoFixEngine.js` — Autonomous action execution
- `ai/PriorityEngine.js` — Issue ranking by severity × confidence
- `ai/ActionTracker.js` — Action attempt memory
- `ai/FallbackStrategies.js` — Multi-tier action strategies
- `engine/IssueManager.js` — Issue lifecycle tracking
- `engine/PredictionEngine.js` — Predictive intelligence

## Module Boundary

**Imports from:** `@sim/engine/` (state only, read-only)
**Exports to:** `SimulationContext` (integration layer)
**Do NOT import from:** `@backend`, `@ui` directly

## Integration Point

AI acts on simulation state via `SimulationContext`:
- `autoFixEngine.processTick()`
- `runAutoFix()`
- Issue detection → action execution

## Development Workflow

1. Create branch: `git checkout -b ai-work`
2. Edit files inside `src/modules/ai/`
3. Import using `@ai/engine/AutoFixEngine`
4. Test: `npm run dev` → verify AutoFix executes
5. Merge: PR must include action logs + stability checks
