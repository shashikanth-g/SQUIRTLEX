// Simulation.jsx — Full city map simulation page
import React from 'react';
import CityMap from '@sim/components/simulation/CityMap.jsx';
import ScenarioSelector from '@sim/components/controls/ScenarioSelector.jsx';
import ManualOverride from '@sim/components/controls/ManualOverride.jsx';
import AlertFeed from '@sim/components/alerts/AlertFeed.jsx';

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
