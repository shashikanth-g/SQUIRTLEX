# SQUIRTLE-X — Team Collaboration Guide

## Project Structure

```
src/
├── modules/               ← 4 independent modules
│   ├── simulation/        ← TEAM_MEMBER_1 (Simulation Lead)
│   ├── ai/                ← TEAM_MEMBER_2 (AI/Intelligence Lead)
│   ├── backend/           ← TEAM_MEMBER_3 (Backend/DB Lead)
│   └── ui/                ← TEAM_MEMBER_4 (Frontend/UI Lead)
├── context/
│   ├── SimulationContext.jsx   ← Integration layer (all modules)
│   └── INTEGRATION_LAYER.md
├── data/                  ← Shared (cityNetwork.json, buildings.json)
├── utils/                 ← Shared (physics.js, constants.js)
└── ...
```

## Module Ownership

| Module | Owner | Responsibilities |
|--------|-------|------------------|
| **simulation/** | TEAM_MEMBER_1 | Physics, flow, graph, pipes, valves |
| **ai/** | TEAM_MEMBER_2 | AutoFix, priority engine, decisions |
| **backend/** | TEAM_MEMBER_3 | Auth, Supabase, database |
| **ui/** | TEAM_MEMBER_4 | React components, pages, visualization |

## Branch Workflow

Each developer works on their own branch:

```bash
# TEAM_MEMBER_1 — Simulation
git checkout -b simulation-work
# Edit files in src/modules/simulation/

# TEAM_MEMBER_2 — AI
git checkout -b ai-work
# Edit files in src/modules/ai/

# TEAM_MEMBER_3 — Backend
git checkout -b backend-work
# Edit files in src/modules/backend/

# TEAM_MEMBER_4 — UI
git checkout -b ui-work
# Edit files in src/modules/ui/
```

## Import Aliases

Use these in your module:

```javascript
// ✓ Inside simulation/
import { WaterFlowEngine } from '@sim/engine/WaterFlowEngine'

// ✓ Inside ai/
import { autoFixEngine } from '@ai/engine/AutoFixEngine'

// ✓ Inside backend/
import { supabase } from '@backend/supabaseClient'

// ✓ Inside ui/
import { CityMap } from '@ui/components/simulation/CityMap'

// ✗ NEVER do cross-module imports
import { autoFixEngine } from '@sim/ai/AutoFixEngine'  // WRONG
import { supabase } from '@ui/lib/supabaseClient'      // WRONG
```

## Development Workflow

### 1. Start Dev Server
```bash
npm run dev
```
Server runs at `http://localhost:5174/` (or next available port)

### 2. Edit Your Module
- Only edit files in YOUR assigned folder
- Use `@sim`, `@ai`, `@backend`, `@ui` aliases
- Add comment at top of modified files:
  ```javascript
  // OWNER: TEAM_MEMBER_1 (Simulation)
  ```

### 3. Test Changes
```bash
# Dev server auto-reloads on save
# Check browser console for errors
# Look for "undefined imports" or module errors
```

### 4. Commit & Create PR
```bash
git add src/modules/<your-module>/
git commit -m "Feature: describe change here"
git push origin <your-branch-name>
```

## Merge Requirements

Before merging to `main`:

✔ `npm run build` succeeds (no errors)
✔ `npm run dev` runs without console errors
✔ Module paths use correct aliases (@sim, @ai, etc)
✔ No imports between different modules
✔ Related tests pass (if applicable)

## Integration Layer

**SimulationContext.jsx** is the ONLY bridge between modules:

```javascript
// ✓ This is OK (integration layer)
import { autoFixEngine } from '@ai/engine/AutoFixEngine'
import { WaterFlowEngine } from '@sim/engine/WaterFlowEngine'
import { supabase } from '@backend/supabaseClient'

// Inside SimulationContext, you coordinate all 4 modules
const processTickIntegration = () => {
  const simState = engineRef.current?.getState()
  const issues = issueRegistry.getActive()
  const actions = runAutoFix(issues, simState, engineRef.current)
  // ...
}
```

## Troubleshooting

### "Cannot find module '@sim/...'"
→ Check path is correct (case-sensitive on Linux/Mac)
→ File must exist at that location
→ Restart dev server: `npm run dev`

### "Cross-module import detected"
→ Imports between `@sim`, `@ai`, `@backend`, `@ui` not allowed
→ Move import to SimulationContext or add to integration layer
→ Read INTEGRATION_LAYER.md for rules

### Build passes but dev server errors
→ Likely stale cache
→ Stop dev server, delete `.vite/` cache, restart
→ Or: `npm run dev -- --force`

### Module not found in dist/
→ Check .gitignore includes .env
→ Verify all imports use absolute paths (@/)
→ Run `npm run build` to test

## Communication

Each module has a `README.md` explaining its responsibility. Read those before making changes.

Questions? Check the relevant module README first.
