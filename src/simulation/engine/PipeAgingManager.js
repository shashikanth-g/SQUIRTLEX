// AssetAgingManager.js — Full asset aging (pipes + valves + sensors)

const MATERIAL_LIFESPAN = {
  steel: 50,
  PVC: 100,
  cast_iron: 75,
  concrete: 80,
  brass: 40,        // valve material
  electronic: 15,   // sensor material
};

const DEGRADATION_RATE = {
  steel: 0.002,       // degrades faster (rust)
  PVC: 0.0008,        // most durable
  cast_iron: 0.0015,
  concrete: 0.001,
  brass: 0.0025,      // valves degrade faster than pipes
  electronic: 0.006,  // sensors degrade fastest
};

class AssetAgingManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize all asset aging data on first tick.
   * Adds: installDate, material, condition, riskLevel to pipes/valves/sensors.
   */
  initialize(pipes, valves, nodes) {
    if (this.initialized) return;

    const currentYear = 2025;

    // Initialize pipes
    pipes.forEach((pipe, idx) => {
      const materials = ['steel', 'PVC', 'cast_iron', 'concrete'];
      const material = materials[idx % materials.length];
      const ageYears = 5 + Math.floor(Math.random() * 35);
      const installYear = currentYear - ageYears;
      const lifespan = MATERIAL_LIFESPAN[material];
      const initialCondition = 100 - (ageYears / lifespan) * 100;

      pipe.material = material;
      pipe.installDate = installYear;
      pipe.lifespanYears = lifespan;
      pipe.condition = Math.max(20, Math.min(100, initialCondition));
      pipe.riskLevel = this._getRiskLevel(pipe.condition);
      pipe.ageYears = ageYears;
      pipe.assetType = 'pipe';

      // Calculate segments (300m per segment)
      pipe.segments = Math.max(1, Math.ceil((pipe.length || 100) / 300));
    });

    // Initialize valves
    valves.forEach((valve, idx) => {
      const material = 'brass'; // Most valves are brass
      const ageYears = 5 + Math.floor(Math.random() * 25);
      const installYear = currentYear - ageYears;
      const lifespan = MATERIAL_LIFESPAN[material];
      const initialCondition = 100 - (ageYears / lifespan) * 100;

      valve.material = material;
      valve.installDate = installYear;
      valve.lifespanYears = lifespan;
      valve.condition = Math.max(20, Math.min(100, initialCondition));
      valve.riskLevel = this._getRiskLevel(valve.condition);
      valve.ageYears = ageYears;
      valve.assetType = 'valve';
    });

    // Initialize sensors (on nodes)
    nodes.forEach((node, idx) => {
      if (!node.sensors) return;

      // Each sensor type ages independently
      ['pressure', 'flow', 'pH', 'turbidity'].forEach(sensorType => {
        if (!node.sensors[sensorType]) return;

        const material = 'electronic';
        const ageYears = 1 + Math.floor(Math.random() * 10); // Sensors newer
        const installYear = currentYear - ageYears;
        const lifespan = MATERIAL_LIFESPAN[material];
        const initialCondition = 100 - (ageYears / lifespan) * 100;

        node.sensors[sensorType].material = material;
        node.sensors[sensorType].installDate = installYear;
        node.sensors[sensorType].lifespanYears = lifespan;
        node.sensors[sensorType].condition = Math.max(30, Math.min(100, initialCondition));
        node.sensors[sensorType].riskLevel = this._getRiskLevel(node.sensors[sensorType].condition);
        node.sensors[sensorType].ageYears = ageYears;
        node.sensors[sensorType].assetType = 'sensor';
      });
    });

    this.initialized = true;
    console.log('[ASSET AGING] Initialized', pipes.length, 'pipes,', valves.length, 'valves,', nodes.length, 'nodes with sensors');
  }

  /**
   * Degrade all asset conditions over time.
   * Call every simulation tick.
   */
  tick(pipes, valves, nodes) {
    if (!this.initialized) this.initialize(pipes, valves, nodes);

    // Degrade pipes
    pipes.forEach((pipe) => {
      if (!pipe.material) return;

      const degradeRate = DEGRADATION_RATE[pipe.material] || 0.001;
      pipe.condition = Math.max(0, pipe.condition - degradeRate);

      const oldRisk = pipe.riskLevel;
      pipe.riskLevel = this._getRiskLevel(pipe.condition);

      if (oldRisk !== pipe.riskLevel && pipe.riskLevel !== 'low') {
        console.log(`[PIPE AGING] ${pipe.id} risk: ${oldRisk} → ${pipe.riskLevel} (condition: ${pipe.condition.toFixed(1)}%)`);
      }

      // Trigger failure if condition critical
      if (pipe.condition <= 5 && pipe.status === 'normal') {
        pipe.status = 'leak';
        console.log(`[PIPE FAILURE] ${pipe.id} failed due to age (${pipe.ageYears} years, ${pipe.material})`);
      }
    });

    // Degrade valves
    valves.forEach((valve) => {
      if (!valve.material) return;

      const degradeRate = DEGRADATION_RATE[valve.material] || 0.001;
      valve.condition = Math.max(0, valve.condition - degradeRate);

      const oldRisk = valve.riskLevel;
      valve.riskLevel = this._getRiskLevel(valve.condition);

      if (oldRisk !== valve.riskLevel && valve.riskLevel !== 'low') {
        console.log(`[VALVE AGING] ${valve.id} risk: ${oldRisk} → ${valve.riskLevel} (condition: ${valve.condition.toFixed(1)}%)`);
      }

      // Trigger failure (valve stuck)
      if (valve.condition <= 5 && valve.status === 'normal') {
        valve.status = 'stuck';
        valve.stuckPercentage = valve.openPercentage; // Frozen at current position
        console.log(`[VALVE FAILURE] ${valve.id} stuck at ${valve.stuckPercentage}% (age: ${valve.ageYears} years)`);
      }
    });

    // Degrade sensors
    nodes.forEach((node) => {
      if (!node.sensors) return;

      ['pressure', 'flow', 'pH', 'turbidity'].forEach(sensorType => {
        const sensor = node.sensors[sensorType];
        if (!sensor || !sensor.material) return;

        const degradeRate = DEGRADATION_RATE[sensor.material] || 0.001;
        sensor.condition = Math.max(0, sensor.condition - degradeRate);

        const oldRisk = sensor.riskLevel;
        sensor.riskLevel = this._getRiskLevel(sensor.condition);

        if (oldRisk !== sensor.riskLevel && sensor.riskLevel !== 'low') {
          console.log(`[SENSOR AGING] ${node.id}.${sensorType} risk: ${oldRisk} → ${sensor.riskLevel}`);
        }

        // Trigger failure (inaccurate readings)
        if (sensor.condition <= 5) {
          sensor.failed = true;
          // Add noise to readings
          const noise = (Math.random() - 0.5) * 20;
          sensor.value = Math.max(0, sensor.value + noise);
          console.log(`[SENSOR FAILURE] ${node.id}.${sensorType} providing inaccurate readings`);
        }
      });
    });
  }

  /**
   * Get all assets requiring maintenance soon.
   */
  getPredictiveIssues(pipes, valves, nodes, currentTime) {
    const issues = [];

    // Pipe aging issues
    pipes.forEach((pipe) => {
      if (!pipe.condition) return;

      if (pipe.condition < 40 && pipe.condition > 20 && pipe.status === 'normal') {
        const degradeRate = DEGRADATION_RATE[pipe.material] || 0.001;
        const ticksToFailure = (pipe.condition - 10) / degradeRate;
        const daysToFailure = Math.round((ticksToFailure * 0.5) / 86400);

        issues.push({
          id: `AGING_PIPE_${pipe.id}`,
          type: 'ASSET_AGING',
          assetType: 'pipe',
          pipeId: pipe.id,
          severity: pipe.condition < 30 ? 'critical' : 'warning',
          message: `Pipe ${pipe.id} (${pipe.material}) likely to fail in ~${daysToFailure} days`,
          confidence: Math.min(95, Math.round((40 - pipe.condition) * 2)),
          lifecycle: 'validated',
          firstDetected: currentTime,
          daysToFailure,
          condition: pipe.condition,
          material: pipe.material,
          age: pipe.ageYears,
          autoFixAvailable: true,
        });
      }
    });

    // Valve aging issues
    valves.forEach((valve) => {
      if (!valve.condition) return;

      if (valve.condition < 40 && valve.condition > 20 && valve.status === 'normal') {
        const degradeRate = DEGRADATION_RATE[valve.material] || 0.001;
        const ticksToFailure = (valve.condition - 10) / degradeRate;
        const daysToFailure = Math.round((ticksToFailure * 0.5) / 86400);

        issues.push({
          id: `AGING_VALVE_${valve.id}`,
          type: 'ASSET_AGING',
          assetType: 'valve',
          valveId: valve.id,
          severity: valve.condition < 30 ? 'critical' : 'warning',
          message: `Valve ${valve.id} likely to fail in ~${daysToFailure} days`,
          confidence: Math.min(95, Math.round((40 - valve.condition) * 2)),
          lifecycle: 'validated',
          firstDetected: currentTime,
          daysToFailure,
          condition: valve.condition,
          material: valve.material,
          age: valve.ageYears,
          autoFixAvailable: true,
        });
      }
    });

    // Sensor aging issues
    nodes.forEach((node) => {
      if (!node.sensors) return;

      ['pressure', 'flow'].forEach(sensorType => {
        const sensor = node.sensors[sensorType];
        if (!sensor || !sensor.condition) return;

        if (sensor.condition < 40 && sensor.condition > 20 && !sensor.failed) {
          const degradeRate = DEGRADATION_RATE[sensor.material] || 0.001;
          const ticksToFailure = (sensor.condition - 10) / degradeRate;
          const daysToFailure = Math.round((ticksToFailure * 0.5) / 86400);

          issues.push({
            id: `AGING_SENSOR_${node.id}_${sensorType}`,
            type: 'ASSET_AGING',
            assetType: 'sensor',
            nodeId: node.id,
            sensorType,
            severity: sensor.condition < 30 ? 'critical' : 'warning',
            message: `${node.id} ${sensorType} sensor likely to fail in ~${daysToFailure} days`,
            confidence: Math.min(90, Math.round((40 - sensor.condition) * 2)),
            lifecycle: 'validated',
            firstDetected: currentTime,
            daysToFailure,
            condition: sensor.condition,
            material: sensor.material,
            age: sensor.ageYears,
            autoFixAvailable: false, // Sensors need replacement, not autofix
          });
        }
      });
    });

    return issues;
  }

  _getRiskLevel(condition) {
    if (condition >= 60) return 'low';
    if (condition >= 40) return 'medium';
    return 'high';
  }

  /**
   * Get pipe color for UI visualization.
   */
  getPipeColor(pipe) {
    if (!pipe.condition) return '#00D4FF'; // Default cyan

    if (pipe.condition >= 60) return '#6BCF7F'; // Green - healthy
    if (pipe.condition >= 40) return '#FFD93D'; // Yellow - aging
    if (pipe.condition >= 20) return '#FF8C42'; // Orange - critical
    return '#FF6B6B'; // Red - failing
  }

  reset() {
    this.initialized = false;
  }
}

export const pipeAgingManager = new AssetAgingManager();
export const assetAgingManager = pipeAgingManager; // Alias for clarity
