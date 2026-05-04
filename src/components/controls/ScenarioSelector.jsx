// ScenarioSelector.jsx — Pre-built test scenario loader
import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { SCENARIOS } from '../../utils/constants.js';
import { SCENARIO_DESCRIPTIONS } from '../../simulation/scenarios/Scenarios.js';
import { Beaker, Play } from 'lucide-react';

const scenarioList = Object.values(SCENARIOS);

export default function ScenarioSelector() {
  const { loadScenario, activeScenario } = useSimulation();

  return (
    <div className="scenario-selector">
      <div className="scenario-header">
        <Beaker size={16} />
        <h3>Test Scenarios</h3>
      </div>
      <div className="scenario-list">
        {scenarioList.map((name) => (
          <button
            key={name}
            className={`scenario-item ${activeScenario === name ? 'active' : ''}`}
            onClick={() => loadScenario(name)}
          >
            <div className="scenario-info">
              <span className="scenario-name">{name}</span>
              <span className="scenario-desc">{SCENARIO_DESCRIPTIONS[name]}</span>
            </div>
            <Play size={14} className="scenario-play" />
          </button>
        ))}
      </div>
    </div>
  );
}
