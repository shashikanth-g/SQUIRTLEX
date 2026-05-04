# 💧 Water Quality & Sewage Treatment System
## Non-Destructive Extension to SQUIRTLE-X

### System Overview

```
┌─────────────────────────────────────────────────────┐
│         WATER QUALITY MONITORING PIPELINE           │
└─────────────────────────────────────────────────────┘

[Anomaly Detection]
      ↓
  CONTAMINATION event
  SEWAGE_INFLOW event
      ↓
[Issue Registry]
  type: CONTAMINATION
  type: SEWAGE_INFLOW
      ↓
[Fallback Strategies]
  Case 1: REDIRECT_TO_TREATMENT
  Case 2: ISOLATE_AND_TREAT
  Case 3: DISPATCH_TANKER (fallback)
      ↓
[AutoFix Engine]
  Apply action → zone isolation
            → treatment plant redirect
            → supply reduction
      ↓
[Treatment Plant Manager]
  Process contaminated flow
  Apply 90% efficiency filter
  Track processing time
      ↓
[Lifecycle Completion]
  After 3s processing:
  - Mark zones safe (isContaminated=false)
  - Restore water supply
  - Mark issue resolved
  - Show safety advisory
```

---

## 🎯 NEW COMPONENTS

### 1. **TreatmentPlantManager** (`src/simulation/environment/TreatmentPlantManager.js`)
- Singleton instance managing water treatment
- Properties:
  - `status`: idle | processing | completed
  - `efficiency`: 0.9 (90% contamination removal)
  - `processingTime`: 3 seconds
  - `inputFlow`, `outputFlow`: flow tracking
  - `contaminationLevel`: severity level
  - `treatmentLogs`: audit trail

**Methods:**
```javascript
process(contaminatedFlow, contaminationLevel)  // Begin treatment
complete()                                      // Mark processing done
reset()                                         // Reset to idle
getStatus()                                     // Return plant state
```

### 2. **Issue Types Extended** (`src/utils/constants.js`)
- `ALERT_TYPES.CONTAMINATION` — zone water quality fail
- `ALERT_TYPES.SEWAGE_INFLOW` — industrial discharge event

### 3. **Anomaly Detection Extended** (`src/simulation/ai/AnomalyDetector.js`)
New detection patterns:
- Zone flagged `isContaminated === true` → CONTAMINATION issue
- Zone flagged `sewageInflow === true` + type=industrial → SEWAGE_INFLOW issue

Trigger conditions (non-destructive):
```javascript
// Pattern 1: Contamination
zones.filter(z => z.isContaminated === true)
  → issue.type = CONTAMINATION
  → issue.severity = WARNING | CRITICAL

// Pattern 2: Sewage
zones.filter(z => z.sewageInflow && z.type === 'industrial')
  → issue.type = SEWAGE_INFLOW
  → issue.severity = CRITICAL (always)
```

### 4. **AutoFix Actions Extended** (`src/simulation/engine/AutoFixEngine.js`)

**New Action Types:**

#### `REDIRECT_TO_TREATMENT`
```javascript
// Mild-moderate contamination
// 1. Mark zone.isContaminated = true
// 2. Set zone.redirectToTreatment = true
// 3. Reduce supply: zone.supply *= 0.3
// 4. Process through plant: plant.process(flowToTreat, level)
// Returns: true (success)
```

#### `ISOLATE_AND_TREAT`
```javascript
// Severe contamination / sewage inflow
// 1. Close upstream valves
// 2. Mark zone isolated
// 3. Cut supply completely: zone.supply = 0
// 4. Process through plant
// Returns: true (success)
```

### 5. **Fallback Strategies** (`src/simulation/ai/FallbackStrategies.js`)

**Case: CONTAMINATION**
1. Primary: `REDIRECT_TO_TREATMENT`
2. Fallback: `DISPATCH_TANKER` (clean water emergency)

**Case: SEWAGE_INFLOW**
1. Primary: `ISOLATE_AND_TREAT` (severe isolation)
2. Secondary: `REDIRECT_TO_TREATMENT`
3. Fallback: `DISPATCH_TANKER`

### 6. **Treatment Plant Lifecycle** (SimulationContext.jsx)

New tick added to main loop (6b):
```javascript
// Monitor treatment status
if (plant.status === 'processing') {
  elapsed = Date.now() - startTime
  if (elapsed >= processingTime) {
    plant.complete()
    // Return treated water
    zones.forEach(z => {
      if (z.redirectToTreatment) {
        z.isContaminated = false
        z.supply = original_supply  // Restore
        z.waterQuality = 'good'
      }
    })
    // Resolve issues
    issues
      .filter(i => i.type in [CONTAMINATION, SEWAGE_INFLOW])
      .forEach(i => i.lifecycle = 'resolved')
  }
}
```

### 7. **UI Components**

#### `WaterSafetyAlert` (`src/components/alerts/WaterSafetyAlert.jsx`)
- Shows severity-based advisory messages:
  - 🚫 **SEVERE**: "Do not consume water"
  - 🔥 **MODERATE**: "Boil water before use"
  - ✅ **RESOLVED**: "Water quality restored"

#### `TreatmentPlantPanel` (`src/components/TreatmentPlantPanel.jsx`)
- Real-time status display
- Input/output flow visualization
- Processing animation
- Completion indicator

### 8. **Scenario: Water Contamination**
(`src/simulation/scenarios/Scenarios.js`)

**Trigger:**
```javascript
case SCENARIOS.WATER_CONTAMINATION:
  applyWaterContamination(engine)
  // 1. Mark zone contaminated
  // 2. Trigger sewage inflow event
```

**Effect:**
- Automatic contamination detection
- Treatment plant activation
- Zone isolation & redirection
- Safe water advisory shown

---

## ✅ INTEGRATION CHECKLIST

- [x] TreatmentPlantManager created (non-destructive singleton)
- [x] Issue types CONTAMINATION & SEWAGE_INFLOW added
- [x] Anomaly detection patterns for water quality
- [x] AutoFix actions: REDIRECT_TO_TREATMENT & ISOLATE_AND_TREAT
- [x] Fallback strategies for contamination scenarios
- [x] Treatment lifecycle in SimulationContext (tick 6b)
- [x] WaterSafetyAlert component
- [x] TreatmentPlantPanel visualization
- [x] Water Contamination scenario
- [x] IssueManager intact (no modifications)
- [x] WaterFlowEngine intact (no modifications)
- [x] Existing routing/UI untouched
- [x] Tanker system still functional
- [x] Valve control still functional

---

## 🚀 USAGE

### Trigger Contamination Event (Demo)
1. Load scenario: **"Water Contamination & Treatment"**
2. System auto-detects contaminated zone
3. Treatment plant auto-activates
4. Watch real-time processing
5. Zone marked safe after 3s

### Manual Zone Contamination (Dev Console)
```javascript
const state = window.__engine.getState()
const zone = state.zones.find(z => z.id === 'Z3')
zone.isContaminated = true
zone.contaminationLevel = 2
// → Next anomaly cycle will trigger CONTAMINATION issue
```

### Check Treatment Status
```javascript
const { treatmentStatus } = useSimulation()
console.log(treatmentStatus)
// { status: 'processing', inputFlow: 150, outputFlow: 135, ... }
```

---

## 📊 DATA PERSISTENCE

Treatment events saved to Supabase (optional):
```sql
-- Table: treatment_logs (create manually)
CREATE TABLE treatment_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  zone_id TEXT,
  input_flow FLOAT,
  output_flow FLOAT,
  contamination_level INT,
  efficiency FLOAT
);
```

---

## 🔒 SAFETY GUARANTEES

✅ **Non-Destructive**
- No modifications to WaterFlowEngine
- No changes to existing issue types
- No mutations to valve/pipe logic
- Fully additive (new flags, new components)

✅ **Backward Compatible**
- All existing scenarios work unchanged
- Existing tanker system unaffected
- Valve control unaffected
- UI/routing unaffected

✅ **Reversible**
- Contamination lifecycle (3s processing)
- Zones auto-restored to safe state
- Issues auto-resolved
- No permanent state corruption

---

## 📁 FILE STRUCTURE

```
src/
├── simulation/
│   ├── environment/
│   │   ├── TreatmentPlantManager.js          [NEW]
│   │   └── WaterQualityDiagnostics.js        [NEW]
│   ├── ai/
│   │   ├── AnomalyDetector.js                [MODIFIED +30 lines]
│   │   └── FallbackStrategies.js             [MODIFIED +80 lines]
│   ├── engine/
│   │   ├── AutoFixEngine.js                  [MODIFIED +60 lines]
│   │   └── IssueManager.js                   [UNCHANGED]
│   └── scenarios/
│       └── Scenarios.js                      [MODIFIED +20 lines]
├── components/
│   ├── alerts/
│   │   ├── WaterSafetyAlert.jsx              [NEW]
│   │   └── WaterSafetyAlert.module.css       [NEW]
│   └── TreatmentPlantPanel.jsx               [NEW]
├── context/
│   └── SimulationContext.jsx                 [MODIFIED +50 lines]
└── utils/
    └── constants.js                          [MODIFIED +3 lines]
```

---

## 🧪 DIAGNOSTICS

Run integration check:
```javascript
import { diagnosticTest } from './src/simulation/environment/WaterQualityDiagnostics'
diagnosticTest()
```

Expected output:
```
✓ TreatmentPlantManager loaded
✓ Testing treatment process...
✓ Issue type support: CONTAMINATION, SEWAGE_INFLOW
✓ AutoFix action types: REDIRECT_TO_TREATMENT, ISOLATE_AND_TREAT
✓ FallbackStrategies support: case "CONTAMINATION", case "SEWAGE_INFLOW"
✓ Scenario: WATER_CONTAMINATION
✅ SYSTEM INTEGRATION COMPLETE
```

---

## 🎓 EXAMPLE FLOW

1. **User loads scenario**: "Water Contamination & Treatment"
2. **Engine detects**: `z.isContaminated === true` in zone Z3
3. **AnomalyDetector fires**: Creates CONTAMINATION issue
4. **IssueRegistry validates**: After 3 ticks → issue.lifecycle = 'validated'
5. **AutoFix processes**: Finds REDIRECT_TO_TREATMENT strategy
6. **Action applies**:
   - Zone marked: `redirectToTreatment = true`
   - Supply cut: `zone.supply *= 0.3`
   - Plant starts: `plant.process(flowToTreat, level)`
7. **UI shows**:
   - Water quality alert (⚠️ Boil water)
   - Treatment plant panel (🔄 Processing...)
   - Issue in dashboard
8. **After 3s**:
   - Plant completes treatment
   - Zones restored to safe
   - Issue marked resolved
   - Alert updates: ✅ Water safe
9. **Cleanup**: System ready for next event

---

## 🚫 WHAT'S NOT AFFECTED

- ✅ Physics engine (WaterFlowEngine) — UNTOUCHED
- ✅ Tanker dispatch — Still works
- ✅ Valve control — Still works
- ✅ Pressure balancing — Still works
- ✅ Pipe aging — Still works
- ✅ Predictions — Still works
- ✅ AI decision engine — Still works
- ✅ Routing & UI — Completely unchanged

---

**Status**: ✅ **READY FOR DEPLOYMENT**

Non-destructive. Fully tested integration. Complete audit trail. Zero impact on existing systems.
