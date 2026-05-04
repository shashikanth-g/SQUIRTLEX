# Integration Layer — SimulationContext.jsx

**OWNER: All Team Members (Collective)**

## Purpose

Single point of integration for all 4 modules:
- Simulation → AI → Backend → UI
- No direct cross-module imports allowed
- Only `SimulationContext.jsx` bridges modules

## Data Flow

```
Simulation (Physics)
    ↓
    → AI (Decision)
       ↓
       → Backend (Storage)
          ↓
          → UI (Visualization)
             ↓ (User Action)
             → back to Simulation
```

## Module Imports

```javascript
// ✓ ALLOWED
import { WaterFlowEngine } from '@sim/engine/WaterFlowEngine'
import { autoFixEngine } from '@ai/engine/AutoFixEngine'
import { supabase } from '@backend/supabaseClient'

// ✗ FORBIDDEN
import { autoFixEngine } from '@sim/ai/AutoFixEngine' // Wrong — moved to @ai
import { supabase } from '@ui/components/Foo'
import { WaterFlowEngine } from '@backend/whatever'
```

## Key Responsibilities

### State Management
- `networkState` — simulation output (pressure, flow, zones)
- `issues` — active system alerts
- `predictions` — AI predictive intelligence
- `tankers` — emergency supply vehicles

### Simulation Loop (500ms tick)
1. Engine tick → physics calculations
2. Anomaly detection → issue creation
3. AI prioritization → action selection
4. Action execution → state update
5. Backend sync → Supabase log

### Exported Context Methods
- `setNetworkState(state)` — Update simulation after tick
- `setValveOpening(id, pct)` — UI → Simulation
- `handleAutoFix(issue)` — UI → AI → Simulation
- `setIsPaused(bool)` — Global simulation control

## Development Rules

1. **Never skip the integration layer**
   - All module-to-module communication goes through `SimulationContext`
   - No `import` between `@sim`, `@ai`, `@backend`, `@ui` folders

2. **Add owner comments when modifying**
   ```javascript
   // OWNER: TEAM_MEMBER_1
   const newLogic = detectSomething();
   ```

3. **Test full flow before merging**
   - Simulation tick → AI decision → Backend sync → UI update
   - Check console for errors (no undefined imports)

4. **Update this doc if adding new module or flow**
