export function createPlan(g) {
  const P = 90, RW = 16, BS = 74;
  const COLS = 8, ROWS = 7;
  const X0 = -360, Z0 = -315;
  const districts = [
    {name: 'PALMERA STRAND', color: 0xf2c9a0, style: 'deco', stand: 58},
    {name: 'SUNDIAL SQUARE', color: 0xd8cdb4, style: 'shop', stand: 50},
    {name: 'VIDRIO HEIGHTS', color: 0x9fc4d8, style: 'glass', stand: 44},
    {name: 'OLD CANNERY', color: 0xb8a888, style: 'brick', stand: 52},
    {name: 'MARINA ROW', color: 0xc9b8a8, style: 'concrete', stand: 47},
    {name: 'SALTFLATS PORT', color: 0xa8a898, style: 'warehouse', stand: 41},
    {name: 'SEAGLASS BEACH', color: 0xe8d8a8, style: 'villa', stand: 60},
    {name: 'CORAL KEYS', color: 0xd8e8d8, style: 'villa', stand: 55}
  ];
  const junctions = [];
  for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= COLS; i++) junctions.push({id: j * (COLS + 1) + i, i, j, x: X0 + i * P, z: Z0 + j * P});
  const distAt = (c, r) => {
    if (c >= 7) return r >= 5 ? 6 : 0;
    if (r === 6) return c <= 1 ? 5 : 4;
    if (c >= 3 && c <= 4 && r >= 2 && r <= 4) return 2;
    if (c <= 1 && r <= 1) return 3;
    if (c <= 1) return 5;
    if (r >= 3 && r <= 4 && c >= 2 && c <= 3) return 1;
    return 1;
  };
  const blocks = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = distAt(c, r);
    blocks.push({c, r, cx: X0 + c * P + P / 2, cz: Z0 + r * P + P / 2, d, district: districts[d].name, style: districts[d].style, seed: (c * 7 + r * 13 + 5)});
  }
  const places = {
    garage: {name: "Lena's Garage", x: -225, z: -45, kind: 'garage'},
    safehouse: {name: 'Safehouse', x: -225, z: -45, kind: 'safehouse'},
    diner: {name: 'Mango Diner', x: 45, z: 135, kind: 'diner'},
    chopshop: {name: 'Chop Shop', x: -315, z: 225, kind: 'chopshop'},
    gunshop: {name: 'Gun Shop', x: 135, z: -135, kind: 'gunshop'},
    respray: {name: 'Respray', x: 225, z: 45, kind: 'respray'},
    hospital: {name: 'Bayside Clinic', x: -135, z: -225, kind: 'hospital'},
    policehq: {name: 'SBPD Precinct 4', x: 45, z: -225, kind: 'police'},
    tower: {name: 'Solmar Tower', x: 45, z: -45, kind: 'tower'},
    club: {name: 'Club Neon', x: 315, z: 45, kind: 'club'},
    piergate: {name: 'Pier Gate', x: 405, z: 135, kind: 'pier'},
    docks: {name: 'Docks', x: -315, z: 315, kind: 'docks'},
    radio: {name: 'Sunset Studio', x: 135, z: 225, kind: 'radio'},
    lighthouse: {name: 'Lighthouse', x: 640, z: -180, kind: 'lighthouse'},
    marina: {name: 'Marina', x: 315, z: 225, kind: 'marina'},
    villa: {name: 'Villa Coral', x: 585, z: -90, kind: 'villa'},
    foodstand: {name: 'Food Stand', x: -45, z: 135, kind: 'food'},
    market: {name: 'Night Market', x: -135, z: 45, kind: 'market'}
  };
  const plan = {
    P, RW, BS, COLS, ROWS, X0, Z0, districts, junctions, blocks, places,
    w: COLS * P, h: ROWS * P,
    nearestJunction(x, z) {
      let best = junctions[0], bd = 1e12;
      for (const jn of junctions) { const dx = jn.x - x, dz = jn.z - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = jn; } }
      return best;
    },
    districtAt(x, z) {
      const c = Math.max(0, Math.min(COLS - 1, Math.floor((x - X0) / P)));
      const r = Math.max(0, Math.min(ROWS - 1, Math.floor((z - Z0) / P)));
      if (x > 470) return districts[7];
      return districts[distAt(c, r)];
    },
    streetName(x, z) {
      const aves = ['Ridge Rd', 'Cannery Ave', 'Sundial Blvd', 'Lantern St', 'Hibiscus St', 'Old Mill St', 'Gull St', 'Coral St', 'Harbor St'];
      const sts = ['Amber Ave', 'Breakwater Rd', 'Tidewater St', 'Seaglass Parade', 'Mango Ave', 'Tamarind St', 'Vidrio Blvd', 'Marlin St'];
      const jn = plan.nearestJunction(x, z);
      return Math.abs(jn.x - x) < Math.abs(jn.z - z) ? aves[jn.j % aves.length] : sts[jn.i % sts.length];
    },
    groundHeight(x, z) {
      if (x >= 470 && x <= 750 && Math.abs(z + 90) < 8) { const t = (x - 470) / 280; return Math.sin(t * Math.PI) * 11; }
      if (x >= 458 && x <= 640 && Math.abs(z - 135) < 8) return 0.35;
      if (x > 450 && x < 540) return Math.max(-0.7, (450 - x) * 0.02);
      if (x > 738) return 0.2;
      return 0;
    },
    onRoad(x, z) {
      const fx = ((x - X0) % P + P) % P, fz = ((z - Z0) % P + P) % P;
      return fx < RW / 2 || fx > P - RW / 2 || fz < RW / 2 || fz > P - RW / 2;
    },
    clampLand(x, z) {
      return {x: Math.max(-440, Math.min(760, x)), z: Math.max(-400, Math.min(360, z))};
    }
  };
  g.plan = plan;
  return plan;
}
