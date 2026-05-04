// Analytics.jsx — Historical data & reports page
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSimulation } from '@sim/context/SimulationContext.jsx';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

Chart.register(...registerables);

export default function Analytics() {
  const { networkState, globalMetrics } = useSimulation();
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barChart = useRef(null);
  const doughnutChart = useRef(null);

  useEffect(() => {
    if (!networkState || !barRef.current || !doughnutRef.current) return;

    const zones = networkState.zones || [];
    if (!zones.length) return;

    // Bar chart: Zone supply vs demand
    if (barChart.current) barChart.current.destroy();
    barChart.current = new Chart(barRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: zones.map((z) => z?.name?.substring(0, 12) || 'Zone'),
        datasets: [
          {
            label: 'Supply',
            data: zones.map((z) => Math.round(z?.supplyCurrent || 0)),
            backgroundColor: '#00D4FF40',
            borderColor: '#00D4FF',
            borderWidth: 1,
          },
          {
            label: 'Demand',
            data: zones.map((z) => Math.round(z?.demandCurrent || 0)),
            backgroundColor: '#4ECDC440',
            borderColor: '#4ECDC4',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#8FA3B0', font: { size: 9 } }, grid: { color: 'rgba(0,212,255,0.06)' } },
          y: { ticks: { color: '#8FA3B0', font: { size: 9 } }, grid: { color: 'rgba(0,212,255,0.06)' } },
        },
        plugins: {
          legend: { labels: { color: '#8FA3B0', font: { size: 10 } } },
        },
      },
    });

    // Doughnut chart: Water allocation
    if (doughnutChart.current) doughnutChart.current.destroy();
    const totalSupply = zones.reduce((s, z) => s + (z?.supplyCurrent || 0), 0);
    doughnutChart.current = new Chart(doughnutRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: zones.map((z) => z?.name?.substring(0, 15) || 'Zone'),
        datasets: [{
          data: zones.map((z) => Math.round(z?.supplyCurrent || 0)),
          backgroundColor: ['#00D4FF', '#4ECDC4', '#FFD93D', '#FF6B6B', '#6BCF7F'],
          borderColor: '#132039',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#8FA3B0', font: { size: 10 }, padding: 12 } },
        },
      },
    });

    return () => {
      barChart.current?.destroy();
      doughnutChart.current?.destroy();
    };
  }, [networkState]);

  return (
    <div className="page analytics-page">
      <div className="page-header">
        <h2>Analytics & Reports</h2>
        <span className="page-subtitle">Historical data visualization and trends</span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card wide">
          <h3><BarChart3 size={16} /> Supply vs Demand by Zone</h3>
          <div className="chart-container" style={{ height: '300px' }}>
            <canvas ref={barRef} />
          </div>
        </div>

        <div className="analytics-card">
          <h3><PieChart size={16} /> Water Allocation</h3>
          <div className="chart-container" style={{ height: '280px' }}>
            <canvas ref={doughnutRef} />
          </div>
        </div>

        <div className="analytics-card">
          <h3><TrendingUp size={16} /> Key Metrics</h3>
          <div className="key-metrics-list">
            <MetricRow label="Total Throughput" value={`${globalMetrics.totalSupply} L/min`} />
            <MetricRow label="Network Efficiency" value={`${globalMetrics.efficiency}%`} />
            <MetricRow label="Active Alerts" value={globalMetrics.activeAlerts} />
            <MetricRow label="Zones Online" value={networkState ? networkState.zones.length : 0} />
            <MetricRow label="Active Valves" value={networkState ? networkState.valves.filter(v => v.openPercentage > 0).length : 0} />
            <MetricRow label="Blocked Pipes" value={networkState ? networkState.pipes.filter(p => p.status === 'blocked').length : 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="metric-row">
      <span className="metric-row-label">{label}</span>
      <span className="metric-row-value">{value}</span>
    </div>
  );
}
