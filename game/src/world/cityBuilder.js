import * as THREE from 'three';
const SIGNS = ['MANGO SODA', 'TIDEWICH', 'CORAL MOTORS', 'CLUB NEON'];
const SIGNC = ['#e8a020', '#c04050', '#2080c0', '#c040a0'];
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function winDraw(x, rng, base, cols, night) {
  const style = cols[0];
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  if (style === 'glass' || style === 'dglass') {
    const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#7fb0d8'); gr.addColorStop(1, '#2a4a68');
    x.fillStyle = night ? '#0e1a28' : gr; x.fillRect(0, 0, 256, 256);
  }
  if (style === 'brick') { x.fillStyle = night ? '#3a1e16' : '#8a4030'; x.fillRect(0, 0, 256, 256); x.fillStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < 256; i += 8) x.fillRect(0, i, 256, 1); }
  if (style === 'deco') { x.fillStyle = night ? '#4a4034' : '#e8d8b8'; x.fillRect(0, 0, 256, 256); }
  if (style === 'sand') { x.fillStyle = night ? '#3d3428' : '#d8b890'; x.fillRect(0, 0, 256, 256); }
  if (style === 'concrete') { x.fillStyle = night ? '#2a2c2e' : '#9a9a92'; x.fillRect(0, 0, 256, 256); }
  if (style === 'terra') { x.fillStyle = night ? '#3a2418' : '#b06a40'; x.fillRect(0, 0, 256, 256); }
  if (style === 'ware') { x.fillStyle = night ? '#24201c' : '#7a7268'; x.fillRect(0, 0, 256, 256); x.fillStyle = 'rgba(120,60,20,0.35)'; for (let i = 0; i < 8; i++) x.fillRect(rng.int(0, 240), rng.int(0, 240), 4, rng.int(20, 80)); }
  const bw = 64, bh = 32;
  for (let f = 0; f < 8; f++) for (let b = 0; b < 4; b++) {
    const wx = b * bw + 8, wy = f * bh + 6;
    const ww = rng.chance(0.25) ? bw - 12 : bw - 26;
    const roll = rng.float(0, 1);
    let lit = null;
    if (roll < 0.42) lit = rng.chance(0.75) ? '#ffc070' : '#9fd0ff';
    const dark = night ? 0.25 : 1;
    if (lit && night) { x.fillStyle = lit; x.shadowColor = lit; x.shadowBlur = 8; x.fillRect(wx, wy, ww, bh - 12); x.shadowBlur = 0; }
    else if (lit) { x.fillStyle = lit; x.fillRect(wx, wy, ww, bh - 12); }
    else { x.fillStyle = night ? '#0a0f16' : (style === 'glass' || style === 'dglass' ? '#3a6a98' : '#20282e'); x.fillRect(wx, wy, ww, bh - 12); }
    if (style === 'glass' || style === 'dglass') { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(wx, wy, ww, 3); }
    if (style === 'brick' || style === 'sand' || style === 'deco') { x.fillStyle = night ? '#181410' : '#f0e8d8'; x.fillRect(wx - 2, wy + bh - 12, ww + 4, 3); }
    if (style === 'deco' && f === 3) { x.fillStyle = night ? '#241c14' : '#6a5a40'; x.fillRect(0, wy + bh - 6, 256, 4); }
    if (style === 'ware' && f > 5) { x.fillStyle = night ? '#0a0f16' : '#20282e'; x.fillRect(wx + 8, wy + 4, ww - 16, 8); }
  }
  return x;
}
function facadeTex(style, seed, night) {
  const rng = new (function (s) { let a = s; this.int = (x, y) => x + Math.floor(((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296) * (y - x + 1)); this.float = (x, y) => x + (((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296) * (y - x)); this.chance = (p) => (((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296) < p); })(seed);
  const c = cv(256, 256);
  const ctx = c.getContext('2d');
  winDraw(ctx, rng, '', [style], night);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function storeTex(variant, seed) {
  const c = cv(512, 128);
  const x = c.getContext('2d');
  x.fillStyle = '#1a1a22'; x.fillRect(0, 0, 512, 128);
  x.fillStyle = SIGNC[variant]; x.fillRect(0, 0, 512, 30);
  x.fillStyle = '#111'; x.font = 'bold 20px sans-serif'; x.textAlign = 'center';
  x.fillText(SIGNS[variant], 256, 22);
  x.fillStyle = variant % 2 ? '#c04040' : '#e8e0d0';
  for (let i = 0; i < 8; i++) { if (i % 2 === 0) x.fillRect(i * 64, 30, 64, 16); }
  x.fillStyle = '#f0c070';
  for (let i = 0; i < 3; i++) { x.fillRect(20 + i * 160, 52, 130, 60); x.fillStyle = 'rgba(20,20,30,0.85)'; x.fillRect(30 + i * 160, 60, 110, 44); x.fillStyle = '#f0c070'; }
  x.fillStyle = '#2a2a34'; x.fillRect(470, 52, 30, 76);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function createCity(g) {
  const scene = g.scene;
  const plan = g.plan;
  const rng = g.rng.fork('city');
  const mats = new Map();
  const M = (c, o = {}) => {
    const k = c + JSON.stringify(o);
    if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({color: c, roughness: 0.9, metalness: 0, ...o}));
    return mats.get(k);
  };
  const box = (w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = h > 4;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const styles = ['glass', 'dglass', 'brick', 'deco', 'sand', 'concrete', 'terra', 'ware'];
  const fac = {};
  styles.forEach((s, i) => {
    fac[s] = {
      day: facadeTex(s, 100 + i * 17, false),
      night: facadeTex(s, 100 + i * 17, true)
    };
  });
  const stores = [0, 1, 2, 3].map(v => storeTex(v, 7 + v));
  const photo = {};
  const loader = new THREE.TextureLoader();
  const photoNames = {brick: 'tex2-brick.png', glass: 'tex2-glass.png', concrete: 'tex2-concrete.png', barber: 'tex2-barber.png'};
  const photoPromises = Object.entries(photoNames).map(([k, f]) => new Promise((res) => {
    loader.load('./' + f, (t) => { t.colorSpace = THREE.SRGBColorSpace; photo[k] = t; res(); }, undefined, () => res());
  }));
  g.photosReady = Promise.all(photoPromises);
  g.photoTex = photo;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(780, 680), M(0x2a2a30));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, 0);
  ground.receiveShadow = true;
  scene.add(ground);
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2000), M(0x4a5a3a));
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.set(0, -0.08, 0);
  scene.add(meadow);
  const lotGeo = new THREE.PlaneGeometry(plan.BS, plan.BS);
  const lotMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 1});
  const lots = new THREE.InstancedMesh(lotGeo, lotMat, plan.blocks.length);
  const col = new THREE.Color();
  plan.blocks.forEach((b, i) => {
    const m4 = new THREE.Matrix4();
    m4.makeRotationX(-Math.PI / 2);
    m4.setPosition(b.cx, 0.15, b.cz);
    lots.setMatrixAt(i, m4);
    col.setHex(plan.districts[b.d].color);
    lots.setColorAt(i, col);
  });
  lots.receiveShadow = true;
  scene.add(lots);
  const dashMat = M(0xd8c040);
  const dashGeo = new THREE.BoxGeometry(0.3, 0.06, 6);
  const dashes = [];
  for (let j = 0; j <= plan.ROWS; j++) for (let i = 0; i < plan.COLS; i++) {
    for (let s = 0; s < 10; s++) dashes.push([plan.X0 + i * plan.P + 45, plan.Z0 + j * plan.P + (s * 9 - 40)]);
  }
  const dashMesh = new THREE.InstancedMesh(dashGeo, dashMat, dashes.length);
  const dm = new THREE.Matrix4();
  dashes.forEach((p, i) => { dm.makeTranslation(p[0], 0.02, p[1]); dashMesh.setMatrixAt(i, dm); });
  scene.add(dashMesh);
  const crossMat = M(0xe8e8e8);
  const crossGeo = new THREE.BoxGeometry(3, 0.06, 1.1);
  const crosses = [];
  for (const jn of plan.junctions) for (const [dx, dz] of [[-11, 0], [11, 0], [0, -11], [0, 11]]) crosses.push([jn.x + dx, jn.z + dz, dx !== 0 ? 0 : Math.PI / 2]);
  const crossMesh = new THREE.InstancedMesh(crossGeo, crossMat, crosses.length * 7);
  let ci = 0;
  for (const [cx, cz, ry] of crosses) for (let k = -3; k <= 3; k++) {
    dm.makeRotationY(ry);
    dm.setPosition(cx + (ry === 0 ? 0 : k * 2), 0.02, cz + (ry === 0 ? k * 2 : 0));
    crossMesh.setMatrixAt(ci++, dm);
  }
  crossMesh.count = ci;
  scene.add(crossMesh);
  const hero = [];
  const bRng = g.rng.fork('buildings');
  const styleFor = (d) => plan.districts[d].style === 'shop' ? 'brick' : plan.districts[d].style;
  for (const b of plan.blocks) {
    const st = styleFor(b.d);
    const n = st === 'glass' ? bRng.int(1, 2) : st === 'villa' ? bRng.int(3, 4) : bRng.int(1, 3);
    for (let k = 0; k < n; k++) {
      const w = bRng.float(16, 30), d = bRng.float(16, 30);
      const ox = bRng.float(-14, 14), oz = bRng.float(-14, 14);
      const x = b.cx + ox, z = b.cz + oz;
      if (Math.abs(x - b.cx) + w / 2 > 34 || Math.abs(z - b.cz) + d / 2 > 34) continue;
      let h;
      if (st === 'glass') h = bRng.float(40, 120);
      else if (st === 'deco') h = bRng.float(12, 33);
      else if (st === 'brick') h = bRng.float(12, 20);
      else if (st === 'concrete') h = bRng.float(15, 40);
      else if (st === 'warehouse') h = bRng.float(8, 13);
      else if (st === 'villa') h = bRng.float(6, 9);
      else h = bRng.float(10, 18);
      const isHero = Math.abs(x) < 60 && z > -180 && z < 180 && hero.length < 16;
      let mat;
      if (isHero) {
        const band = hero.length;
        const pk = band < 6 ? 'brick' : band < 11 ? 'concrete' : 'glass';
        hero.push({x, z, w, h, d, pk});
        mat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.25, emissiveMap: null});
        mat.userData.photoKey = pk;
        mat.userData.isHero = true;
      } else {
        const f = fac[st] || fac.brick;
        const dm = f.day.clone(); dm.needsUpdate = true;
        const nm = f.night.clone(); nm.needsUpdate = true;
        dm.repeat.set(Math.max(1, Math.round(w / 25.6)), Math.max(1, Math.round(h / 25.6)));
        nm.repeat.copy(dm.repeat);
        mat = new THREE.MeshStandardMaterial({map: dm, emissiveMap: nm, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.9});
      }
      const mesh = box(w, h, d, mat, x, h / 2 + 0.15, z);
      mesh.userData.hero = isHero;
      g.collision.add(x, z, w / 2, d / 2, h);
      box(w + 0.8, 0.6, d + 0.8, M(0x3a3a40), x, h + 0.4, z);
      if (st === 'deco' && bRng.chance(0.3)) {
        box(4, 5, 4, M(0x6a5a40), x + w / 4, h + 3, z);
        box(0.4, 6, 0.4, M(0x8a7a5a), x - w / 4, h + 3, z);
      }
      if (st === 'glass' && bRng.chance(0.4)) {
        box(1, bRng.float(6, 14), d * 0.5, M(0x2a3a4a), x, h + 4, z);
        const bc = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({color: 0xff2020}));
        bc.position.set(x, h + 9, z);
        scene.add(bc);
      }
      if (st === 'glass' && bRng.chance(0.25)) {
        box(w * 0.6, 8, d * 0.6, M(0x4a5a6a), x, h + 4, z);
      }
      if (bRng.chance(0.5)) box(3, 1.5, 2, M(0x5a5a5a), x + bRng.float(-w / 4, w / 4), h + 1, z + bRng.float(-d / 4, d / 4));
      if (st === 'shop' || st === 'deco' || (st === 'brick' && bRng.chance(0.6))) {
        const sv = bRng.int(0, 3);
        const pod = box(w + 1, 4.2, d + 1, new THREE.MeshStandardMaterial({map: stores[sv], emissiveMap: stores[sv], emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.85}), x, 2.2, z);
        pod.castShadow = false;
        g.collision.add(x, z, w / 2 + 0.5, d / 2 + 0.5, 4.2);
      }
    }
  }
  const tower = box(34, 188, 34, new THREE.MeshStandardMaterial({map: fac.glass.day, emissiveMap: fac.glass.night, emissive: 0xffffff, emissiveIntensity: 0.9, color: 0xd8b060, roughness: 0.7}), plan.places.tower.x, 94, plan.places.tower.z);
  tower.material.map.repeat.set(2, 8);
  tower.material.emissiveMap.repeat.set(2, 8);
  g.collision.add(plan.places.tower.x, plan.places.tower.z, 17, 17, 188);
  box(36, 2, 36, M(0x2a2a30), plan.places.tower.x, 189, plan.places.tower.z);
  const palmRng = g.rng.fork('palms');
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 8, 6);
  const trunkMat = M(0x7a5a3a);
  const frondGeo = new THREE.ConeGeometry(1.6, 4.5, 5);
  const frondMat = M(0x3a7a30);
  const palmSpots = [];
  for (let j = 0; j <= plan.ROWS; j++) for (let i = 0; i < plan.COLS; i++) {
    palmSpots.push([plan.X0 + i * plan.P + 12, plan.Z0 + j * plan.P + 10]);
    palmSpots.push([plan.X0 + i * plan.P + 78, plan.Z0 + j * plan.P - 10]);
  }
  for (let i = 0; i < 90; i++) palmSpots.push([palmRng.float(455, 535), palmRng.float(-300, 300)]);
  const palms = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length);
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, palmSpots.length * 7);
  const pm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  let fi = 0;
  palmSpots.forEach((p, i) => {
    const lean = palmRng.float(-0.12, 0.12);
    e.set(lean, 0, palmRng.float(-0.12, 0.12)); q.setFromEuler(e); v.set(p[0], 4, p[1]);
    pm.compose(v, q, sc); palms.setMatrixAt(i, pm);
    g.collision.add(p[0], p[1], 0.4, 0.4, 8, true);
    for (let f = 0; f < 7; f++) {
      const a = (f / 7) * Math.PI * 2;
      e.set(Math.PI / 2 + 0.5, a, 0); q.setFromEuler(e);
      v.set(p[0] + Math.cos(a) * 1.4, 8.4, p[1] + Math.sin(a) * 1.4);
      pm.compose(v, q, sc); fronds.setMatrixAt(fi++, pm);
    }
  });
  palms.castShadow = true;
  scene.add(palms); scene.add(fronds);
  const treeRng = g.rng.fork('trees');
  const treeSpots = [];
  for (let j = 0; j <= plan.ROWS; j++) for (let i = 0; i < plan.COLS; i++) {
    for (let s = 0; s < 4; s++) {
      treeSpots.push([plan.X0 + i * plan.P + 12, plan.Z0 + j * plan.P + 20 + s * 16]);
      treeSpots.push([plan.X0 + i * plan.P + 78, plan.Z0 + j * plan.P + 20 + s * 16]);
    }
  }
  const tTrunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.22, 2.4, 5), M(0x5a4030), treeSpots.length);
  const crownGeo = new THREE.IcosahedronGeometry(1.6, 0);
  const crownMat = [M(0x2a5a28), M(0x3a7a30), M(0x4a8a38)];
  const crowns = crownMat.map(m => new THREE.InstancedMesh(crownGeo, m, treeSpots.length));
  treeSpots.forEach((p, i) => {
    e.set(0, 0, 0); q.setFromEuler(e); v.set(p[0], 1.2, p[1]); sc.set(1, 1, 1);
    pm.compose(v, q, sc); tTrunk.setMatrixAt(i, pm);
    g.collision.add(p[0], p[1], 0.3, 0.3, 2.4, true);
    for (let k = 0; k < 3; k++) {
      const off = [[0, 3.4, 0], [0.9, 2.9, 0.4], [-0.8, 3.0, -0.4]][k];
      v.set(p[0] + off[0], off[1], p[1] + off[2]);
      sc.set(k === 0 ? 1.15 : 0.8, k === 0 ? 1.15 : 0.8, k === 0 ? 1.15 : 0.8);
      pm.compose(v, q, sc); crowns[k].setMatrixAt(i, pm);
    }
    sc.set(1, 1, 1);
  });
  scene.add(tTrunk);
  crowns.forEach(c => { c.castShadow = true; scene.add(c); });
  const lampRng = g.rng.fork('lamps');
  const lampSpots = [];
  for (const b of plan.blocks) for (let k = 0; k < 6; k++) lampSpots.push([b.cx + lampRng.float(-30, 30), b.cz + lampRng.float(-30, 30)]);
  const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 7.4, 5), M(0x2a2a30), lampSpots.length);
  const lampHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshBasicMaterial({color: 0xffd9a0}), lampSpots.length);
  const lampGlow = new THREE.InstancedMesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshBasicMaterial({color: 0xffc070, transparent: true, opacity: 0.18}), lampSpots.length);
  lampSpots.forEach((p, i) => {
    e.set(0, 0, 0); q.setFromEuler(e); sc.set(1, 1, 1);
    v.set(p[0], 3.7, p[1]); pm.compose(v, q, sc); lampPole.setMatrixAt(i, pm);
    v.set(p[0], 7.5, p[1]); pm.compose(v, q, sc); lampHead.setMatrixAt(i, pm);
    v.set(p[0], 7.5, p[1]); pm.compose(v, q, sc); lampGlow.setMatrixAt(i, pm);
    g.collision.add(p[0], p[1], 0.15, 0.15, 7.4, true);
  });
  scene.add(lampPole); scene.add(lampHead); scene.add(lampGlow);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(90, 660), M(0xe8d8a0));
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(495, 0.02, 0);
  beach.receiveShadow = true;
  scene.add(beach);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({color: 0x1a6a8a, roughness: 0.35, metalness: 0.1}));
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(2000, -0.7, 0);
  scene.add(ocean);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(8, 660), new THREE.MeshBasicMaterial({color: 0xd8f0f0, transparent: true, opacity: 0.5}));
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(546, -0.2, 0);
  scene.add(surf);
  for (let i = 0; i < 90; i++) {
    const ux = 470 + (i % 10) * 7, uz = -300 + Math.floor(i / 10) * 70;
    box(0.2, 2.2, 0.2, M(0x8a6a40), ux, 1.1, uz);
    const um = new THREE.Mesh(new THREE.ConeGeometry(3, 1.6, 6), M(i % 2 ? 0xe86040 : 0x40a0e0));
    um.position.set(ux, 3, uz);
    scene.add(um);
  }
  for (let x = 458; x <= 640; x += 10) {
    box(10, 0.5, 16, M(0x8a6a44), x, 0.35, 135);
    box(0.3, 1, 16, M(0xe8e8e8), x, 1, 127);
    box(0.3, 1, 16, M(0xe8e8e8), x, 1, 143);
  }
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(21, 0.8, 6, 24), M(0xe8e8e8));
  wheel.add(rim);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const car = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), M([0xe04040, 0x40a0e0, 0xe0a020, 0x40e080][i % 4]));
    car.position.set(Math.cos(a) * 21, Math.sin(a) * 21, 0);
    wheel.add(car);
  }
  wheel.position.set(630, 24, 135);
  scene.add(wheel);
  g.wheel = wheel;
  for (let x = 470; x <= 750; x += 10) {
    const t = (x - 470) / 280;
    const y = Math.sin(t * Math.PI) * 11;
    box(10, 0.8, 16, M(0x9a9a9a), x, y + 0.4, -90);
    box(0.4, 1.2, 16, M(0x6a6a6a), x, y + 1.4, -98);
    box(0.4, 1.2, 16, M(0x6a6a6a), x, y + 1.4, -82);
  }
  for (const tx of [540, 680]) {
    box(4, 46, 4, M(0xe06080), tx, 22, -98);
    box(4, 46, 4, M(0xe06080), tx, 22, -82);
    box(2, 2, 20, M(0xe06080), tx, 44, -90);
  }
  const island = new THREE.Mesh(new THREE.PlaneGeometry(240, 260), M(0xc9b896));
  island.rotation.x = -Math.PI / 2;
  island.position.set(857, 0.2, -90);
  island.receiveShadow = true;
  scene.add(island);
  for (let i = 0; i < 4; i++) {
    const ix = 780 + (i % 2) * 120, iz = -160 + Math.floor(i / 2) * 120;
    box(24, 9, 20, new THREE.MeshStandardMaterial({map: fac.villa ? fac.deco.day : fac.brick.day, emissiveMap: fac.deco.night, emissive: 0xffffff, emissiveIntensity: 0.6}), ix, 4.5, iz);
    g.collision.add(ix, iz, 12, 10, 9);
  }
  const lh = new THREE.Group();
  const lhBody = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.5, 37, 10), M(0xe04040));
  lhBody.position.y = 18.5;
  lh.add(lhBody);
  const lhTop = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 8), M(0x2a2a30));
  lhTop.position.y = 38;
  lh.add(lhTop);
  lh.position.set(640, 0, -180);
  scene.add(lh);
  g.collision.add(640, -180, 4, 4, 37);
  const hillRng = g.rng.fork('hills');
  for (let i = 0; i < 34; i++) {
    const hx = -500 + i * 32 + hillRng.float(-10, 10);
    const hz = -520 + hillRng.float(-40, 40);
    const hh = hillRng.float(50, 150);
    const hill = new THREE.Mesh(new THREE.ConeGeometry(hillRng.float(40, 90), hh, 7), M(0x3a5a34));
    hill.position.set(hx, hh / 2 - 2, hz);
    scene.add(hill);
  }
  for (let i = 0; i < 11; i++) {
    const yx = 600 + i * 40, yz = -260 + (i % 3) * 90;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 4), M(0xf0f0e8));
    hull.position.set(yx, -0.2, yz);
    scene.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 4), M(0x6a5a3a));
    mast.position.set(yx, 6, yz);
    scene.add(mast);
  }
  const freighter = new THREE.Group();
  const fh = new THREE.Mesh(new THREE.BoxGeometry(150, 10, 22), M(0x2a2a30));
  fh.position.y = 2;
  freighter.add(fh);
  const fs = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 18), M(0xe8e8e8));
  fs.position.set(-50, 12, 0);
  freighter.add(fs);
  for (let i = 0; i < 8; i++) {
    const cc = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 8), M([0xc04040, 0x40a0c0, 0xe0a020, 0x40c060][i % 4]));
    cc.position.set(10 + i * 13, 8, (i % 2 ? 5 : -5));
    freighter.add(cc);
  }
  freighter.position.set(200, -0.7, 420);
  scene.add(freighter);
  for (let i = 0; i < 4; i++) {
    const cxp = -330 + i * 30, czp = 330;
    box(2, 38, 2, M(i % 2 ? 0xc04040 : 0x4060c0), cxp, 19, czp);
    box(20, 2, 2, M(0x3a3a3a), cxp, 36, czp);
    g.collision.add(cxp, czp, 1, 1, 38);
  }
  const contRng = g.rng.fork('containers');
  for (let i = 0; i < 24; i++) {
    const ccx = -340 + (i % 6) * 14, ccz = 300 + Math.floor(i / 6) * 10;
    const stack = contRng.int(1, 3);
    for (let s = 0; s < stack; s++) box(12.2, 2.55, 2.6, M([0xc04040, 0x40a0c0, 0xe0a020, 0x40c060, 0x8040c0, 0xc0c0c0][(i + s) % 6]), ccx, 1.3 + s * 2.6, ccz);
    g.collision.add(ccx, ccz, 6.1, 1.3, stack * 2.6);
  }
  const stallRng = g.rng.fork('market');
  for (let r = 0; r < 5; r++) for (let c2 = 0; c2 < 5; c2++) {
    const sx = -165 + c2 * 14, sz = 25 + r * 10;
    box(6, 2.4, 4, M(0x6a4a30), sx, 1.2, sz);
    const can = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.6, 4), M([0xe04040, 0x40a0e0, 0xe0a020, 0x40e080, 0xc040a0][(r + c2) % 5]));
    can.position.set(sx, 3.2, sz);
    can.rotation.y = Math.PI / 4;
    scene.add(can);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({color: 0xffd9a0}));
    lamp.position.set(sx, 2.6, sz);
    scene.add(lamp);
    g.collision.add(sx, sz, 3, 2, 2.4);
  }
  const bbRng = g.rng.fork('billboards');
  const bbCols = [0xe86040, 0x40a0e0, 0xe0a020, 0xc040a0];
  for (let i = 0; i < 8; i++) {
    const bx = -300 + i * 90, bz = -280 + (i % 2) * 560;
    box(1, 11, 1, M(0x3a3a3a), bx, 5.5, bz);
    box(13, 6, 0.5, M(bbCols[i % 4]), bx, 13, bz);
  }
  g.city = {fac, stores, hero, photo};
  g.applyPhotos = () => {
    for (const m of scene.children) {
      if (m.userData && m.userData.hero && m.material && m.material.userData && m.material.userData.photoKey) {
        const t = photo[m.material.userData.photoKey];
        if (t) { m.material.map = t; m.material.emissiveMap = t; m.material.emissiveIntensity = 0.55; m.material.needsUpdate = true; }
        else { m.material.map = fac.brick.day; m.material.emissiveMap = fac.brick.night; m.material.emissiveIntensity = 0.85; m.material.needsUpdate = true; }
      }
    }
  };
  return g.city;
}
