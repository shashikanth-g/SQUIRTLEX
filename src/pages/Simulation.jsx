// Simulation.jsx — Full city map simulation page
import React from 'react';
import CityMap from '../components/simulation/CityMap.jsx';
import ScenarioSelector from '../components/controls/ScenarioSelector.jsx';
import ManualOverride from '../components/controls/ManualOverride.jsx';
import AlertFeed from '../components/alerts/AlertFeed.jsx';

export default function Simulation() {
  return (
    <div className="page simulation-page">
      <div className="page-header">
        <h2>Network Simulation</h2>
        <span className="page-subtitle">Interactive city water infrastructure map</span>
      </div>

      <div className="simulation-layout">
        <div className="sim-main">
          <CityMap />
        </div>
        <div className="sim-sidebar">
          <ScenarioSelector />
          <ManualOverride />
          <AlertFeed maxItems={5} />
        </div>
      </div>
    </div>
  );
}
