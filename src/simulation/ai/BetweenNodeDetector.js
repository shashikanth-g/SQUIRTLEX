// BetweenNodeDetector.js — Detect blockages & leaks between nodes using physics

/**
 * Detect mid-pipe blockages using flow drop analysis.
 * Returns array of anomaly objects.
 */
export function detectMidPipeBlockages(state) {
  const { pipes, nodes } = state;
  const anomalies = [];

  pipes.forEach((pipe) => {
    if (pipe.status === 'blocked') return; // Already known

    const srcNode = nodes.find(n => n.id === pipe.source);
    const tgtNode = nodes.find(n => n.id === pipe.target);

    if (!srcNode || !tgtNode) return;

    // Check for sudden flow drop
    const expectedFlow = Math.min(pipe.capacity || 1000, srcNode.pressure * 10);
    const actualFlow = pipe.flowRate || 0;
    const flowDropPct = expectedFlow > 0 ? (expectedFlow - actualFlow) / expectedFlow : 0;

    // Check for downstream pressure collapse
    const downstreamPressure = tgtNode.pressure || 0;

    // Blockage indicators:
    // 1. Flow drop >70% compared to expected
    // 2. Downstream pressure very low (<20 PSI)
    // 3. Upstream still has pressure
    if (flowDropPct > 0.7 && downstreamPressure < 20 && srcNode.pressure > 30) {
      const location = `Between ${pipe.source}-${pipe.target}`;
      const segment = Math.floor(pipe.segments / 2) || 1; // Assume mid-segment

      anomalies.push({
        id: `MID_BLOCK_${pipe.id}`,
        type: 'MID_PIPE_BLOCKAGE',
        pipeId: pipe.id,
        location,
        segment,
        severity: 'critical',
        message: `Suspected blockage in ${pipe.id} (segment ${segment}/${pipe.segments || 1})`,
        confidence: Math.min(95, Math.round(flowDropPct * 100)),
        flowDrop: Math.round(flowDropPct * 100),
        downstreamPressure: Math.round(downstreamPressure),
        lifecycle: 'validated',
        firstDetected: Date.now(),
        autoFixAvailable: true,
      });
    }
  });

  return anomalies;
}

/**
 * Detect mid-pipe leaks using pressure differential analysis.
 * Returns array of anomaly objects.
 */
export function detectMidPipeLeaks(state) {
  const { pipes, nodes } = state;
  const anomalies = [];

  pipes.forEach((pipe) => {
    if (pipe.status === 'leak' || pipe.status === 'blocked') return; // Already known

    const srcNode = nodes.find(n => n.id === pipe.source);
    const tgtNode = nodes.find(n => n.id === pipe.target);

    if (!srcNode || !tgtNode) return;

    const pressureDiff = srcNode.pressure - tgtNode.pressure;

    // Expected pressure drop based on pipe length
    const expectedDrop = (pipe.length || 100) / 100 * 5; // ~5 PSI per 100m

    // Leak indicators:
    // 1. Pressure drop much larger than expected (>15 PSI excess)
    // 2. Flow still exists (not blocked)
    // 3. Both nodes have some pressure
    const excessDrop = pressureDiff - expectedDrop;

    if (excessDrop > 15 && pipe.flowRate > 0 && srcNode.pressure > 20 && tgtNode.pressure > 10) {
      const location = `Between ${pipe.source}-${pipe.target}`;
      const segment = Math.floor(pipe.segments * 0.6) || 1; // Assume 60% along pipe

      anomalies.push({
        id: `MID_LEAK_${pipe.id}`,
        type: 'MID_PIPE_LEAK',
        pipeId: pipe.id,
        location,
        segment,
        severity: excessDrop > 25 ? 'critical' : 'warning',
        message: `Suspected leak in ${pipe.id} (pressure drop: ${Math.round(pressureDiff)} PSI)`,
        confidence: Math.min(90, Math.round((excessDrop / 20) * 80)),
        pressureDiff: Math.round(pressureDiff),
        expectedDrop: Math.round(expectedDrop),
        excessDrop: Math.round(excessDrop),
        lifecycle: 'validated',
        firstDetected: Date.now(),
        autoFixAvailable: true,
      });
    }
  });

  return anomalies;
}

/**
 * Get all between-node anomalies.
 */
export function detectBetweenNodeAnomalies(state) {
  return [
    ...detectMidPipeBlockages(state),
    ...detectMidPipeLeaks(state),
  ];
}
