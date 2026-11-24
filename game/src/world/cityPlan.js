export function createCityPlan(rng) {
  const COLS = 11;
  const ROWS = 9;
  const SPACING = 90;
  const ROAD_W = 16;
  const X0 = -450;
  const Z0 = -360;
  const WATER_Y = -0.7;
  const junctions = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      junctions.push({ id: r * COLS + c, x: X0 + c * SPACING, z: Z0 + r * SPACING, island: false });
    }
  }
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      junctions.push({ id: 100 + r * 3 + c, x: 760 + c * 90, z: -180 + r * 90, island: true });
    }
  }
  const byId = new Map(junctions.map((j) => [j.id, j]));
  function neighbours(id) {
    const j = byId.get(id);
    const out = [];
    if (!j) return out;
    if (!j.island) {
      const r = Math.floor(id / COLS);
      const c = id % COLS;
      if (c > 0) out.push(id - 1);
      if (c < COLS - 1) out.push(id + 1);
      if (r > 0) out.push(id - COLS);
      if (r < ROWS - 1) out.push(id + COLS);
      if (id === 3 * COLS + 10) out.push(101);
    } else {
      const r = Math.floor((id - 100) / 3);
      const c = (id - 100) % 3;
      if (c > 0) out.push(id - 1);
      if (c < 2) out.push(id + 1);
      if (r > 0) out.push(id - 3);
      if (r < 2) out.push(id + 3);
      if (id === 101) out.push(3 * COLS + 10);
    }
    return out;
  }
  const DISTRICTS = [
    { name: 'PALMERA STRAND', lot: '#d9c48a', map: '#e8c96a', style: 'deco', palms: 1.0, lamps: 1.0 },
    { name: 'SUNDIAL SQUARE', lot: '#b8b2a4', map: '#c9a86a', style: 'glass', palms: 0.5, lamps: 1.0 },
    { name: 'VIDRIO HEIGHTS', lot: '#a8b8c8', map: '#7fb2d9', style: 'glass', palms: 0.5, lamps: 1.0 },
    { name: 'OLD CANNERY', lot: '#a89a7a', map: '#c98a5a', style: 'shop', palms: 0.5, lamps: 0.9 },
    { name: 'MARINA ROW', lot: '#c8b89a', map: '#7fc9c9', style: 'deco', palms: 0.9, lamps: 1.0 },
    { name: 'SALTFLATS PORT', lot: '#8a8578', map: '#9a9a8a', style: 'warehouse', palms: 0.15, lamps: 0.8 },
    { name: 'SEAGLASS BEACH', lot: '#e0d0a0', map: '#f0d890', style: 'villa', palms: 1.0, lamps: 0.9 },
    { name: 'CORAL KEYS', lot: '#d8c8a8', map: '#f0b090', style: 'villa', palms: 0.9, lamps: 0.9 },
  ];
  function districtOfBlock(bx, bz) {
    if (bx >= 10) return 7;
    if (bz >= 7) return 1;
    if (bx >= 8 && bz <= 2) return 0;
    if (bx >= 8) return 4;
    if (bx <= 1 && bz >= 5) return 5;
    if (bx >= 4 && bx <= 6 && bz >= 2 && bz <= 4) return 2;
    if (bz <= 1) return 3;
    if (bx <= 2 && bz >= 3) return 1;
    if (bz >= 6) return 6;
    return 2;
  }
  function districtAt(x, z) {
    const bx = Math.floor((x - X0) / SPACING);
    const bz = Math.floor((z - Z0) / SPACING);
    if (x > 738) return DISTRICTS[7];
    if (bx < 0 || bx > 9 || bz < 0 || bz > 7) return DISTRICTS[6];
    return DISTRICTS[districtOfBlock(bx, bz)];
  }
  const PLACES = [
    { id: 'garage', name: "Lena's Garage", kind: 'safehouse', x: -410, z: 300 },
    { id: 'diner', name: 'La Rosa Diner', kind: 'diner', x: -320, z: 120 },
    { id: 'chopshop', name: 'Chop Shop', kind: 'chopshop', x: -410, z: -300 },
    { id: 'gunshop', name: 'Iron & Lead', kind: 'gunshop', x: 130, z: 210 },
    { id: 'respray', name: 'Respray', kind: 'respray', x: 220, z: -240 },
    { id: 'hospital', name: 'Bayside Clinic', kind: 'hospital', x: 310, z: -330 },
    { id: 'hq', name: 'SBPD HQ', kind: 'police', x: 40, z: -330 },
    { id: 'tower', name: 'Vane Tower', kind: 'tower', x: 130, z: -60 },
    { id: 'club', name: 'Club Neon Tide', kind: 'club', x: 400, z: 30 },
    { id: 'piergate', name: 'Pier Gate', kind: 'pier', x: 470, z: 135 },
    { id: 'pierend', name: 'Palmera Wheel', kind: 'pier', x: 630, z: 135 },
    { id: 'docks', name: 'Saltflats Docks', kind: 'docks', x: -230, z: 400 },
    { id: 'radio', name: 'Sunset Radio', kind: 'radio', x: -140, z: -150 },
    { id: 'lighthouse', name: 'Keys Lighthouse', kind: 'lighthouse', x: 940, z: -200 },
    { id: 'marina', name: 'Marina Row', kind: 'marina', x: 430, z: 210 },
    { id: 'villa', name: 'Vane Villa', kind: 'villa', x: 850, z: -40 },
    { id: 'market', name: 'Night Market', kind: 'market', x: -230, z: -60 },
    { id: 'park', name: 'Flamingo Park', kind: 'park', x: -50, z: 120 },
  ];
  const placeById = new Map(PLACES.map((p) => [p.id, p]));
  function groundHeight(x, z) {
    if (x >= 470 && x <= 750 && Math.abs(z + 90) < 8) {
      const t = (x - 470) / 280;
      return 0.15 + Math.sin(t * Math.PI) * 11;
    }
    if (x >= 458 && x <= 640 && Math.abs(z - 135) < 8) return 0.35;
    if (x > 738) {
      const d = Math.min(x - 738, 976 - x, z + 216, 36 - z);
      if (d < 14) return -0.7 + ((d / 14) * 0.85);
      return 0.15;
    }
    if (x >= 466 && x <= 540 && z > 300) {
      const t = Math.min(1, (z - 300) / 60);
      return 0.15 - t * 0.85;
    }
    if (z >= 368) return 0.15;
    const bx = Math.floor((x - X0) / SPACING);
    const bz = Math.floor((z - Z0) / SPACING);
    const inBlockX = (x - X0) % SPACING;
    const inBlockZ = (z - Z0) % SPACING;
    if (bx >= 0 && bx < 10 && bz >= 0 && bz < 8 && inBlockX > ROAD_W / 2 && inBlockX < SPACING - ROAD_W / 2 && inBlockZ > ROAD_W / 2 && inBlockZ < SPACING - ROAD_W / 2) return 0.15;
    return 0;
  }
  function nearestJunction(x, z) {
    let best = junctions[0];
    let bestD = Infinity;
    for (const j of junctions) {
      const d = (j.x - x) * (j.x - x) + (j.z - z) * (j.z - z);
      if (d < bestD) { bestD = d; best = j; }
    }
    return best;
  }
  function pointAlongRoad(fromId, toId, along, lane = 2.7) {
    const a = byId.get(fromId);
    const b = byId.get(toId);
    if (!a || !b) return null;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const t = Math.max(0, Math.min(1, along / len));
    const nx = -dz / len;
    const nz = dx / len;
    return { x: a.x + dx * t + nx * lane, z: a.z + dz * t + nz * lane, heading: Math.atan2(dx, dz) };
  }
  function nextWander(junctionId, fromId) {
    const opts = neighbours(junctionId).filter((id) => id !== fromId);
    if (!opts.length) return fromId;
    const j = byId.get(junctionId);
    const from = byId.get(fromId);
    if (from && j) {
      const dx = j.x - from.x;
      const dz = j.z - from.z;
      const straight = opts.find((id) => {
        const n = byId.get(id);
        return (n.x - j.x) * dx + (n.z - j.z) * dz > 0.5 * SPACING * SPACING * 0.5;
      });
      if (straight !== undefined && rng.chance(0.55)) return straight;
    }
    return rng.pick(opts);
  }
  function pursuitNext(junctionId, fromId, tx, tz) {
    const opts = neighbours(junctionId);
    let best = junctionId;
    let bestD = Infinity;
    for (const id of opts) {
      const n = byId.get(id);
      let d = Math.hypot(n.x - tx, n.z - tz);
      if (id === fromId) d += 60;
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }
  const LAND = [
    { x1: -530, z1: -440, x2: 522, z2: 436 },
    { x1: 738, z1: -216, x2: 976, z2: 36 },
    { x1: 470, z1: -98, x2: 750, z2: -82 },
    { x1: 458, z1: 127, x2: 640, z2: 143 },
  ];
  function landClamp(x, z) {
    let best = null;
    let bestD = Infinity;
    for (const r of LAND) {
      const cx = Math.max(r.x1, Math.min(r.x2, x));
      const cz = Math.max(r.z1, Math.min(r.z2, z));
      const d = (cx - x) * (cx - x) + (cz - z) * (cz - z);
      if (d < bestD) { bestD = d; best = { x: cx, z: cz }; }
    }
    return best || { x, z };
  }
  return {
    COLS, ROWS, SPACING, ROAD_W, X0, Z0, WATER_Y,
    junctions, byId, neighbours, DISTRICTS, districtOfBlock, districtAt,
    PLACES, placeById, groundHeight, nearestJunction,
    pointAlongRoad, nextWander, pursuitNext, landClamp,
  };
}
