# SQUIRTLEX

### AI-Powered Digital Twin for Smart Water Infrastructure

SQUIRTLEX is an intelligent water infrastructure management platform that combines **real-time simulation, AI-driven anomaly detection, predictive analytics, and autonomous response** to model and manage complex water distribution networks.

The system maintains a digital representation of a water network and continuously evaluates its operational state — including **flow, pressure, water quality, network topology, infrastructure health, and active incidents**.

When an abnormal condition is detected, SQUIRTLEX can evaluate its severity, prioritize the issue, recommend a response, and execute automated corrective actions through its AI decision layer.

**Sense → Detect → Decide → Act → Learn**

---

## 🚀 Live Demo

**Web Application:**
https://squirtlex.vercel.app

---

## ✨ What SQUIRTLEX Does

SQUIRTLEX is designed around a closed-loop approach to water infrastructure management.

### 🌊 Real-Time Water Simulation

Models the behavior of a water distribution network including:

* Water flow
* Pressure propagation
* Pipe characteristics
* Valve states
* Network topology
* Blockages
* Demand changes
* Infrastructure degradation

The simulation engine continuously updates the state of the network and provides the foundation for the rest of the platform.

### 🤖 AI Decision Engine

The AI layer evaluates incidents and determines what should happen next.

It provides:

* Issue detection
* Severity assessment
* Issue prioritization
* Autonomous decision-making
* Predictive failure detection
* Action tracking
* Fallback strategies
* Issue lifecycle management

### 🛠️ Autonomous AutoFix

Instead of simply displaying an alert, SQUIRTLEX can attempt corrective actions automatically.

Examples include:

* Isolating affected network zones
* Rerouting water
* Adjusting valves
* Activating treatment systems
* Dispatching emergency tankers
* Escalating unresolved incidents
* Falling back to alternative strategies when an action fails

Every action can be tracked through the system's action lifecycle.

### 💧 Water Quality Intelligence

The platform also incorporates water-quality monitoring and treatment infrastructure into the digital twin.

Potential conditions include:

* Contamination
* pH abnormalities
* Sewage inflow
* Treatment-system events
* Water-quality degradation

These conditions can become part of the same detection → decision → response workflow.

### 🗺️ Interactive Network Visualization

The dashboard provides a visual representation of the water infrastructure, allowing operators to inspect:

* Pipes
* Nodes
* Valves
* Zones
* Network state
* Active incidents
* Water-flow conditions
* Emergency operations

### 📊 Analytics & Monitoring

The application provides operational visibility through:

* Real-time metrics
* Historical analytics
* Alerts
* System health
* Issue tracking
* Performance indicators
* Infrastructure state

### 🚛 Emergency Tanker Operations

When normal network operation cannot satisfy demand, the system can incorporate emergency water delivery into the operational workflow.

---

## 🧠 System Architecture

```text
                         ┌─────────────────────────────┐
                         │        React Frontend       │
                         │                             │
                         │  Dashboard                  │
                         │  Network Map                │
                         │  Alerts                     │
                         │  Analytics                  │
                         │  AI Intelligence            │
                         │  Complaints                 │
                         │  Tanker Operations           │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │    Simulation Context       │
                         │                             │
                         │  Shared Network State       │
                         │  State Synchronization      │
                         └──────────────┬──────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
                 ▼                      ▼                      ▼
        ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
        │   Simulation   │    │       AI       │    │    Backend     │
        │     Engine     │    │    Decision    │    │    Services    │
        │                │    │     Engine     │    │                │
        │ Water Flow     │    │ Priority       │    │ Supabase       │
        │ Network Graph  │    │ AutoFix        │    │ Data Access    │
        │ Anomalies      │    │ Prediction     │    │ Persistence    │
        │ Aging          │    │ Fallbacks      │    │ Integration    │
        └────────────────┘    └────────────────┘    └────────────────┘
                 │                      │
                 └──────────────┬───────┘
                                ▼
                     ┌──────────────────────┐
                     │  Water Infrastructure│
                     │       Digital Twin   │
                     └──────────────────────┘
```

---

## 🔄 Core Control Loop

SQUIRTLEX follows a continuous operational loop:

```text
┌──────────┐
│  Sense   │
└────┬─────┘
     ↓
┌──────────┐
│  Detect  │
└────┬─────┘
     ↓
┌──────────┐
│  Decide  │
└────┬─────┘
     ↓
┌──────────┐
│   Act    │
└────┬─────┘
     ↓
┌──────────┐
│ Evaluate │
└────┬─────┘
     │
     └──────────────→ Repeat
```

This allows the platform to move beyond traditional monitoring systems toward an **autonomous infrastructure management model**.

---

## 🧩 Project Architecture

The codebase is organized into independent modules:

```text
src/
│
├── components/
│   ├── alerts/
│   ├── controls/
│   ├── dashboard/
│   ├── intelligence/
│   ├── layout/
│   ├── simulation/
│   └── ui/
│
├── context/
│
├── data/
│
├── lib/
│
├── modules/
│   ├── ai/
│   ├── backend/
│   ├── simulation/
│   └── ui/
│
├── pages/
│
├── simulation/
│   ├── ai/
│   ├── engine/
│   ├── environment/
│   ├── pathfinding/
│   └── scenarios/
│
├── utils/
│
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

---

## ⚙️ Core Modules

### Simulation Module

Responsible for modelling the physical water network.

Key responsibilities:

* Water-flow calculations
* Network topology
* Pressure propagation
* Flow routing
* Pipe and valve behaviour
* Asset aging
* Leak detection
* Blockage detection
* Real-time simulation state

Core components include:

```text
WaterFlowEngine
NetworkGraph
PipeAgingManager
AnomalyDetector
BetweenNodeDetector
TreatmentPlantManager
```

### AI Module

Responsible for intelligence and autonomous decision-making.

Key responsibilities:

* Issue prioritization
* Autonomous action execution
* Predictive detection
* Action tracking
* Fallback strategies
* Issue lifecycle management

Core components include:

```text
AutoFixEngine
PriorityEngine
ActionTracker
FallbackStrategies
IssueManager
PredictionEngine
```

### Backend Module

Provides the application's data and service integration layer, including the project's Supabase integration.

### UI Module

Contains the reusable interface and presentation layer used across the dashboard and operational views.

---

## 🛠️ Tech Stack

| Layer                       | Technologies     |
| --------------------------- | ---------------- |
| Frontend                    | React 19         |
| Build Tool                  | Vite             |
| Styling                     | Tailwind CSS     |
| Routing                     | React Router     |
| Database / Backend Services | Supabase         |
| Visualization               | D3.js            |
| Charts                      | Chart.js         |
| Animation                   | Framer Motion    |
| Icons                       | Lucide React     |
| Language                    | JavaScript / JSX |
| Deployment                  | Vercel           |

The current package configuration uses React, Vite, Supabase, D3, Chart.js, Framer Motion, React Router and Tailwind CSS.

---

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shashikanth-g/SQUIRTLEX.git
cd SQUIRTLEX
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file based on `.env.example`.

```bash
cp .env.example .env
```

Add the required Supabase configuration.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available through the local Vite development server.

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

### 7. Run linting

```bash
npm run lint
```

---

## 📁 Important Project Areas

| Directory                | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `src/components`         | Reusable UI components                    |
| `src/pages`              | Application pages                         |
| `src/modules/ai`         | AI decision and autonomous response logic |
| `src/modules/simulation` | Water-network simulation                  |
| `src/modules/backend`    | Backend/data integration                  |
| `src/simulation`         | Simulation engine and scenarios           |
| `src/context`            | Shared application state                  |
| `src/data`               | Application and simulation data           |
| `src/utils`              | Utility functions                         |

---

## 🎯 Key Engineering Concepts

SQUIRTLEX combines several engineering disciplines in one system:

* Digital Twins
* Simulation Engineering
* Graph Algorithms
* Physics-Based Modelling
* Anomaly Detection
* Predictive Analytics
* Autonomous Decision Systems
* Real-Time State Management
* Data Visualization
* Infrastructure Monitoring
* Fault Detection & Recovery
* Human-in-the-Loop Systems

---

## 🔍 Example Operational Scenario

Consider a sudden pressure drop in a section of the network.

```text
Pressure Drop
      ↓
Anomaly Detection
      ↓
Issue Created
      ↓
Severity Evaluation
      ↓
Priority Engine
      ↓
Determine Response
      ↓
AutoFix
      ↓
Isolate / Reroute / Adjust
      ↓
Evaluate Result
      ↓
Success ──────────────→ Resolve
      │
      └── Failure ────→ Fallback Strategy
```

This allows SQUIRTLEX to treat an infrastructure problem as an **operational workflow**, rather than simply producing an alert.

---

## 📚 Documentation

Additional technical documentation is available inside the repository:

* [`SQUIRTLE_X_COMPLETE_DOCUMENT_AND_PPT.md`](./SQUIRTLE_X_COMPLETE_DOCUMENT_AND_PPT.md)
* [`SQUIRTLE_X_PROJECT_DOCUMENTATION.txt`](./SQUIRTLE_X_PROJECT_DOCUMENTATION.txt)
* [`WATER_QUALITY_SYSTEM_README.md`](./WATER_QUALITY_SYSTEM_README.md)
* [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md)
* [`PROJECT_MODULARIZATION.md`](./PROJECT_MODULARIZATION.md)
* [`TEAM_COLLABORATION.md`](./TEAM_COLLABORATION.md)

---

## 🌐 Project

**Live Application:**
https://squirtlex.vercel.app

**Source Code:**
https://github.com/shashikanth-g/SQUIRTLEX

---

## 🚧 Project Status

SQUIRTLEX is an actively developed project focused on building an intelligent digital-twin platform for water infrastructure.

The architecture is modular so that simulation, AI intelligence, backend services, and the user interface can evolve independently.

---

## 👨‍💻 Author

**Shashikanth Gidaganti**

Computer Science Engineering
RNS Institute of Technology

GitHub: https://github.com/shashikanth-g

---

## 📄 License

This project is currently maintained as a personal engineering project.

---

<p align="center">
  Built with React, simulation engineering, AI, and a focus on smarter water infrastructure.
</p>
