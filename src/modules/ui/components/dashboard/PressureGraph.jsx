// PressureGraph.jsx — Time-series pressure chart using Chart.js
import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSimulation } from '@sim/../context/SimulationContext.jsx';

Chart.register(...registerables);

const TRACKED_NODES = ['N3', 'N7', 'N12', 'N8', 'N14'];
const COLORS = ['#00D4FF', '#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCF7F'];
const MAX_POINTS = 60;

export default function PressureGraph() {
  const { networkState } = useSimulation();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const historyRef = useRef(TRACKED_NODES.map(() => []));

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: TRACKED_NODES.map((nodeId, i) => ({
          label: nodeId,
          data: [],
          borderColor: COLORS[i],
          backgroundColor: `${COLORS[i]}10`,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: {
            display: true,
            ticks: { color: '#5A6C7D', maxTicksLimit: 8, font: { size: 9 } },
            grid: { color: 'rgba(0,212,255,0.06)' },
          },
          y: {
            display: true,
            min: 0,
            max: 150,
            ticks: { color: '#5A6C7D', font: { size: 9 }, stepSize: 30 },
            grid: { color: 'rgba(0,212,255,0.06)' },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#8FA3B0', font: { size: 10, family: 'Inter' }, boxWidth: 12, padding: 10 },
          },
          tooltip: {
            backgroundColor: '#132039',
            titleColor: '#E8F1F5',
            bodyColor: '#8FA3B0',
            borderColor: 'rgba(0,212,255,0.2)',
            borderWidth: 1,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, []);

  // Update chart data on state change
  useEffect(() => {
    if (!networkState || !networkState.nodes || !Array.isArray(networkState.nodes) || !chartRef.current) return;

    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    TRACKED_NODES.forEach((nodeId, i) => {
      const node = networkState.nodes.find((n) => n?.id === nodeId);
      const pressure = node?.sensors?.pressure?.value ?? node?.pressure ?? 0;
      if (!historyRef.current[i]) historyRef.current[i] = [];
      historyRef.current[i].push(pressure);
      if (historyRef.current[i].length > MAX_POINTS) historyRef.current[i].shift();
    });

    const chart = chartRef.current;
    if (!chart.data.labels) chart.data.labels = [];
    chart.data.labels.push(now);
    if (chart.data.labels.length > MAX_POINTS) chart.data.labels.shift();

    TRACKED_NODES.forEach((_, i) => {
      if (chart.data.datasets[i]) {
        chart.data.datasets[i].data = [...(historyRef.current[i] || [])];
      }
    });

    chart.update();
  }, [networkState]);

  return (
    <div className="pressure-graph-card">
      <h3 className="card-title">Pressure Timeline</h3>
      <div className="chart-container" style={{ height: '240px' }}>
        <canvas ref={canvasRef} />
      </div>
      {/* Threshold bands legend */}
      <div className="threshold-legend">
        <span className="tl-item"><span className="tl-dot" style={{ background: '#6BCF7F' }} /> 60-90 PSI (Optimal)</span>
        <span className="tl-item"><span className="tl-dot" style={{ background: '#FFD93D' }} /> 40-60 / 90-110 (Warning)</span>
        <span className="tl-item"><span className="tl-dot" style={{ background: '#FF6B6B' }} /> &lt;40 / &gt;110 (Critical)</span>
      </div>
    </div>
  );
}
