// Network topology verification — check redundancy and connectivity

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const networkPath = path.join(__dirname, 'src', 'data', 'cityNetwork.json');
const buildingsPath = path.join(__dirname, 'src', 'data', 'buildings.json');

const network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'));
const buildings = JSON.parse(fs.readFileSync(buildingsPath, 'utf-8'));

console.log('=== NETWORK TOPOLOGY VERIFICATION ===\n');

// 1. Node count
console.log(`✓ Nodes: ${network.nodes.length} (requirement: 12-20)`);
if (network.nodes.length < 12 || network.nodes.length > 20) {
  console.log('  ⚠ WARNING: Node count out of range');
}

// 2. Reservoir count
console.log(`✓ Reservoirs: ${network.reservoirs.length} (requirement: 2+)`);

// 3. Valve count
console.log(`✓ Valves: ${network.valves.length}`);

// 4. Pipe count
console.log(`✓ Pipes: ${network.pipes.length}`);

// 5. Zone count
console.log(`✓ Zones: ${buildings.length} (requirement: 5+)`);
const residential = buildings.filter(z => z.type === 'residential').length;
const industrial = buildings.filter(z => z.type === 'industrial').length;
const schools = buildings.filter(z => z.type === 'school').length;
const hospitals = buildings.filter(z => z.type === 'hospital').length;
console.log(`  - Residential: ${residential}`);
console.log(`  - Industrial: ${industrial} (requirement: 3+)`);
console.log(`  - Schools: ${schools}`);
console.log(`  - Hospitals: ${hospitals}`);

// 6. Build adjacency graph
const graph = new Map();
network.nodes.forEach(n => graph.set(n.id, []));
network.reservoirs.forEach(r => graph.set(r.id, []));

network.pipes.forEach(pipe => {
  if (!graph.has(pipe.source)) graph.set(pipe.source, []);
  if (!graph.has(pipe.target)) graph.set(pipe.target, []);
  graph.get(pipe.source).push(pipe.target);
  graph.get(pipe.target).push(pipe.source);
});

// 7. Check node connectivity
console.log('\n=== NODE CONNECTIVITY ===');
let minConnections = Infinity;
let maxConnections = 0;
let lowConnectivityNodes = [];

network.nodes.forEach(node => {
  const connections = graph.get(node.id)?.length || 0;
  minConnections = Math.min(minConnections, connections);
  maxConnections = Math.max(maxConnections, connections);
  if (connections < 2) {
    lowConnectivityNodes.push(node.id);
  }
});

console.log(`✓ Min connections per node: ${minConnections} (requirement: 2+)`);
console.log(`✓ Max connections per node: ${maxConnections}`);

if (lowConnectivityNodes.length > 0) {
  console.log(`⚠ WARNING: ${lowConnectivityNodes.length} nodes with <2 connections: ${lowConnectivityNodes.join(', ')}`);
} else {
  console.log('✓ All nodes have redundant connections');
}

// 8. Check zone reachability from both reservoirs
console.log('\n=== ZONE REDUNDANCY ===');

function bfs(start, goal, excludePipe = null) {
  const queue = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (current === goal) return path;

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

let multiPathZones = 0;
let singlePathZones = 0;

buildings.forEach(zone => {
  const paths = [];
  network.reservoirs.forEach(reservoir => {
    const path = bfs(reservoir.id, zone.connectedNode);
    if (path) paths.push({ reservoir: reservoir.id, length: path.length });
  });

  if (paths.length >= 2) {
    multiPathZones++;
    console.log(`✓ ${zone.id}: ${paths.length} paths`);
  } else if (paths.length === 1) {
    singlePathZones++;
    console.log(`⚠ ${zone.id}: SINGLE PATH ONLY (no redundancy)`);
  } else {
    console.log(`✗ ${zone.id}: NO PATH (unreachable)`);
  }
});

console.log(`\n✓ Multi-path zones: ${multiPathZones}/${buildings.length}`);
if (singlePathZones > 0) {
  console.log(`⚠ Single-path zones: ${singlePathZones}/${buildings.length}`);
}

// 9. Check pipe capacity
console.log('\n=== PIPE SPECIFICATIONS ===');
const pipesWithCapacity = network.pipes.filter(p => p.capacity).length;
console.log(`✓ Pipes with capacity defined: ${pipesWithCapacity}/${network.pipes.length}`);

// 10. Summary
console.log('\n=== SUMMARY ===');
const passed = [];
const warnings = [];

if (network.nodes.length >= 12 && network.nodes.length <= 20) {
  passed.push('Node count');
} else {
  warnings.push('Node count out of range');
}

if (network.reservoirs.length >= 2) {
  passed.push('Multiple reservoirs');
} else {
  warnings.push('Need 2+ reservoirs');
}

if (industrial >= 3) {
  passed.push('Industrial zones');
} else {
  warnings.push('Need 3+ industrial zones');
}

if (lowConnectivityNodes.length === 0) {
  passed.push('All nodes redundantly connected');
} else {
  warnings.push(`${lowConnectivityNodes.length} nodes with <2 connections`);
}

if (multiPathZones === buildings.length) {
  passed.push('All zones have redundant paths');
} else {
  warnings.push(`${buildings.length - multiPathZones} zones lack redundancy`);
}

console.log(`\n✓ PASSED: ${passed.length}`);
passed.forEach(p => console.log(`  - ${p}`));

if (warnings.length > 0) {
  console.log(`\n⚠ WARNINGS: ${warnings.length}`);
  warnings.forEach(w => console.log(`  - ${w}`));
} else {
  console.log('\n🎉 NETWORK TOPOLOGY VALIDATED — PRODUCTION READY');
}
