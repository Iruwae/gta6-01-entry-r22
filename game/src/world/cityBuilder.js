import * as THREE from 'three';
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function paintFacades(rng) {
  const day = makeCanvas(512, 512);
  const night = makeCanvas(512, 512);
  const d = day.getContext('2d');
  const n = night.getContext('2d');
  n.fillStyle = '#000'; n.fillRect(0, 0, 512, 512);
  const styles = [
    { base: '#5a7a9a', win: '#2a3a4e', lit: 0.42 }, // glass
    { base: '#c8a080', win: '#3a2a28', lit: 0.40 }, // deco hotel
    { base: '#b09878', win: '#2e2a24', lit: 0.45 }, // apartment
    { base: '#8a7a68', win: '#3a3430', lit: 0.30 }, // warehouse
  ];
  styles.forEach((s, si) => {
    const x0 = si * 128;
    for (let fy = 0; fy < 16; fy++) {
      for (let fx = 0; fx < 4; fx++) {
        const wx = x0 + 8 + fx * 30;
        const wy = 8 + fy * 31;
        d.fillStyle = s.base; d.fillRect(x0, wy, 128, 31);
        d.fillStyle = s.win; d.fillRect(wx, wy + 5, 20, 20);
        if (si === 0) { d.fillStyle = 'rgba(255,255,255,0.35)'; d.fillRect(wx, wy + 5, 20, 4); }
        if (si === 2) { d.fillStyle = 'rgba(255,255,255,0.25)'; d.fillRect(wx, wy + 25, 20, 2); }
        if (rng.chance(s.lit)) {
          n.fillStyle = rng.chance(0.85) ? '#ffd98a' : '#9fd4ff';
          n.fillRect(wx, wy + 5, 20, 20);
        }
      }
    }
    if (si === 3) { // warehouse: corrugated shading + rust
      for (let i = 0; i < 40; i++) {
        d.fillStyle = 'rgba(0,0,0,0.12)';
        d.fillRect(x0 + rng.int(0, 120), rng.int(0, 500), 4, rng.int(20, 80));
        d.fillStyle = 'rgba(120,60,20,0.25)';
        d.fillRect(x0 + rng.int(0, 120), rng.int(0, 500), 3, rng.int(10, 50));
      }
    }
  });
  const dayTex = new THREE.CanvasTexture(day);
  const nightTex = new THREE.CanvasTexture(night);
  for (const t of [dayTex, nightTex]) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; }
  return { dayTex, nightTex };
}
function paintSigns() {
  const c = makeCanvas(512, 128);
  const g = c.getContext('2d');
  const brands = [
    ['MANGO SODA', '#ff9d2e', '#7a2e00'], ['AEROLINE', '#6db9ff', '#0a2a5e'],
    ['CORAL MOTORS', '#ff5d5d', '#5e0a0a'], ['RUMBA RUM', '#ffd23d', '#5e3a0a'],
    ['VANE ESTATES', '#c9a86a', '#2a1a0a'], ['SUNSET 88.5', '#ff7ad9', '#3a0a2e'],
    ['TIDEWICH', '#7ee2a8', '#0a3a1e'], ['CLUB NEON TIDE', '#9be7ff', '#0a2a3a'],
  ];
  brands.forEach((b, i) => {
    const x = i * 64;
    g.fillStyle = b[2]; g.fillRect(x, 0, 64, 128);
    g.fillStyle = b[1]; g.font = 'bold 15px Arial'; g.textAlign = 'center';
    const words = b[0].split(' ');
    words.forEach((w, wi) => g.fillText(w, x + 32, 52 + wi * 20));
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function createBag() {
  const pos = []; const nor = []; const uv = []; const col = [];
  const tmpColor = new THREE.Color();
  function add(geo, matrix, color, uvScale = null) {
    const g = geo.toNonIndexed ? geo.toNonIndexed() : geo;
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const u = g.attributes.uv;
    const v = new THREE.Vector3();
    const nv = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(matrix);
      pos.push(v.x, v.y, v.z);
      nv.fromBufferAttribute(n, i).transformDirection(matrix);
      nor.push(nv.x, nv.y, nv.z);
      if (u) {
        let uu = u.getX(i); let vv = u.getY(i);
        if (uvScale) { uu = uu * uvScale.su + uvScale.ou; vv = vv * uvScale.sv + uvScale.ov; }
        uv.push(uu, vv);
      } else uv.push(0, 0);
      tmpColor.set(color);
      col.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
  }
  function build(material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    return mesh;
  }
  return { add, build };
}
const M4 = new THREE.Matrix4();
function m4(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0));
  m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
  return m;
}
export function buildCity(scene, plan, collision, rng) {
  const group = new THREE.Group();
  group.name = 'solmar-bay';
  scene.add(group);
  const { dayTex, nightTex } = paintFacades(rng.fork('facades'));
  const signTex = paintSigns();
  const fm = new THREE.MeshStandardMaterial({ map: dayTex, emissiveMap: nightTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: 0.9 });
  const colorMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
  const sm = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, roughness: 0.6 });
  const ot = (() => {
    const c = makeCanvas(256, 256);
    const g = c.getContext('2d');
    g.fillStyle = '#1a8a9a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 150; i++) {
      g.strokeStyle = rng.chance(0.5) ? 'rgba(120,220,235,0.5)' : 'rgba(20,120,140,0.5)';
      g.lineWidth = 2;
      const x = rng.range(0, 256); const y = rng.range(0, 256);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rng.range(8, 22), y + rng.range(-3, 3)); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(260, 260);
    return t;
  })();
  const facadeBag = createBag();
  const cb = createBag();
  const sb = createBag();
  const bg = new THREE.BoxGeometry(1, 1, 1);
  const pg = new THREE.PlaneGeometry(1, 1);
  {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2200), new THREE.MeshStandardMaterial({ color: '#2e2f36', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, 0); ground.receiveShadow = true;
    group.add(ground);
    const meadow = new THREE.Mesh(new THREE.PlaneGeometry(2600, 900), new THREE.MeshStandardMaterial({ color: '#5d8f52', roughness: 1 }));
    meadow.rotation.x = -Math.PI / 2; meadow.position.set(0, -0.05, -900); group.add(meadow);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(180, 220), new THREE.MeshStandardMaterial({ color: '#e0d0a0', roughness: 1 }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(503, 0.02, 330); sand.receiveShadow = true; group.add(sand);
    const dock = new THREE.Mesh(new THREE.PlaneGeometry(500, 90), new THREE.MeshStandardMaterial({ color: '#8a8578', roughness: 1 }));
    dock.rotation.x = -Math.PI / 2; dock.position.set(-200, 0.02, 400); group.add(dock);
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ map: ot, roughness: 0.55, metalness: 0.1 }));
    ocean.rotation.x = -Math.PI / 2; ocean.position.set(0, -0.7, 0); group.add(ocean);
    ot.userData = { mesh: ocean };
  }
  {
    const lots = new THREE.InstancedMesh(new THREE.PlaneGeometry(74, 74), new THREE.MeshStandardMaterial({ roughness: 1 }), 84);
    const dm = new THREE.Object3D();
    const color = new THREE.Color();
    let idx = 0;
    for (let bx = 0; bx < 10; bx++) {
      for (let bz = 0; bz < 8; bz++) {
        const cx = plan.X0 + bx * plan.SPACING + plan.SPACING / 2;
        const cz = plan.Z0 + bz * plan.SPACING + plan.SPACING / 2;
        dm.position.set(cx, 0.03, cz);
        dm.rotation.set(-Math.PI / 2, 0, 0);
        dm.updateMatrix();
        lots.setMatrixAt(idx, dm.matrix);
        lots.setColorAt(idx, color.set(plan.DISTRICTS[plan.districtOfBlock(bx, bz)].lot));
        idx++;
      }
    }
    for (let i = 0; i < 4; i++) { // island lots
      dm.position.set(805 + (i % 2) * 90, 0.03, -135 + Math.floor(i / 2) * 90);
      dm.rotation.set(-Math.PI / 2, 0, 0);
      dm.updateMatrix();
      lots.setMatrixAt(idx, dm.matrix);
      lots.setColorAt(idx, color.set(plan.DISTRICTS[7].lot));
      idx++;
    }
    lots.count = idx;
    lots.receiveShadow = true;
    group.add(lots);
  }
  {
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffd23d });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markBag = createBag();
    const whiteBag = createBag();
    for (let r = 0; r < plan.ROWS; r++) {
      const z = plan.Z0 + r * plan.SPACING;
      for (let x = plan.X0 + 20; x < plan.X0 + 10 * plan.SPACING - 10; x += 16) {
        markBag.add(pg, m4(x, 0.02, z - 0.6, 0, 7, 1, 0.25), '#ffd23d');
        markBag.add(pg, m4(x, 0.02, z + 0.6, 0, 7, 1, 0.25), '#ffd23d');
      }
    }
    for (let c = 0; c < plan.COLS; c++) {
      const x = plan.X0 + c * plan.SPACING;
      for (let z = plan.Z0 + 20; z < plan.Z0 + 8 * plan.SPACING - 10; z += 16) {
        whiteBag.add(pg, m4(x - 4, 0.02, z, 0, 0.25, 1, 7), '#ffffff');
        whiteBag.add(pg, m4(x + 4, 0.02, z, 0, 0.25, 1, 7), '#ffffff');
      }
    }
    for (const j of plan.junctions) {
      for (let s = -3; s <= 3; s++) {
        whiteBag.add(pg, m4(j.x + s * 2.2, 0.02, j.z - 9, 0, 1.1, 1, 2.4), '#ffffff');
        whiteBag.add(pg, m4(j.x + s * 2.2, 0.02, j.z + 9, 0, 1.1, 1, 2.4), '#ffffff');
      }
    }
    const m1 = markBag.build(markMat); m1.rotation.x = -Math.PI / 2; group.add(m1);
    const m2 = whiteBag.build(whiteMat); m2.rotation.x = -Math.PI / 2; group.add(m2);
  }
  const blockRng = rng.fork('blocks');
  const STYLE_UV = { glass: 0, deco: 1, apartment: 2, warehouse: 3 };
  const STYLE_COLORS = {
    glass: ['#7fa8c8', '#9ab8d0', '#6a94b8'],
    deco: ['#e8b48a', '#e8c9a0', '#d8a878', '#e8a8a0'],
    shop: ['#ff7a5c', '#ffd23d', '#7ee2a8', '#6db9ff', '#ff7ad9', '#c9a86a'],
    villa: ['#f0ead8', '#e8e0c8', '#f5f0e0'],
    warehouse: ['#8a7a68', '#7a6a58', '#9a8a78'],
  };
  function addBuilding(cx, cz, w, d, h, style, seedRng) {
    const y = h / 2 + 0.15;
    const uvStyle = STYLE_UV[style === 'shop' ? 'apartment' : style] ?? 0;
    const su = Math.max(w, d) / 8;
    const sv = h / 8;
    facadeBag.add(bg, m4(cx, y, cz, 0, w, h, d), '#ffffff', { su, sv, ou: uvStyle * 0.25, ov: 0 });
    cb.add(bg, m4(cx, h + 0.3, cz, 0, w + 0.6, 0.5, d + 0.6), '#3a3f4a');
    const nClutter = seedRng.int(1, 3);
    for (let i = 0; i < nClutter; i++) {
      cb.add(bg, m4(cx + seedRng.range(-w / 4, w / 4), h + 0.9, cz + seedRng.range(-d / 4, d / 4), 0, seedRng.range(1, 3), seedRng.range(0.8, 1.6), seedRng.range(1, 3)), '#565c6a');
    }
    collision.registerBox(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, h + 0.15, 'solid');
    return { x: cx, z: cz, w, d, h };
  }
  const LANDMARKS = {
    garage: { w: 34, d: 22, h: 9, style: 'warehouse', color: '#2a9a8a', sign: 2 },
    diner: { w: 18, d: 12, h: 7, style: 'shop', color: '#e8b48a', sign: 6 },
    hospital: { w: 30, d: 20, h: 26, style: 'glass', color: '#d8e8e8', sign: -1 },
    hq: { w: 26, d: 18, h: 16, style: 'glass', color: '#5a7ab8', sign: -1 },
    tower: { w: 24, d: 24, h: 60, style: 'glass', color: '#c9a86a', sign: 4 },
    club: { w: 20, d: 14, h: 10, style: 'shop', color: '#7a4a8a', sign: 7 },
    market: { w: 40, d: 24, h: 6, style: 'shop', color: '#8a5a3a', sign: 0 },
  };
  for (let bx = 0; bx < 10; bx++) {
    for (let bz = 0; bz < 8; bz++) {
      const district = plan.DISTRICTS[plan.districtOfBlock(bx, bz)];
      const cx = plan.X0 + bx * plan.SPACING + plan.SPACING / 2;
      const cz = plan.Z0 + bz * plan.SPACING + plan.SPACING / 2;
      const sr = blockRng;
      const style = district.style;
      if (style === 'glass') {
        const bw = sr.range(20, 30);
        const bd = sr.range(20, 30);
        const h1 = sr.range(8, 14);
        addBuilding(cx, cz, bw, bd, h1, 'glass', sr);
        let w = bw * 0.78; let d = bd * 0.78; let y = h1;
        const tiers = sr.int(2, 3);
        for (let t = 0; t < tiers; t++) {
          const th = sr.range(10, 18);
          addBuilding(cx, cz, w, d, y + th / 2 + 0.15, 'glass', sr);
          y += th; w *= 0.78; d *= 0.78;
        }
        cb.add(bg, m4(cx, y + 4, cz, 0, 1.2, 8, 1.2), '#c8ccd8');
        cb.add(bg, m4(cx, y + 8.5, cz, 0, 0.8, 0.8, 0.8), '#ff3b3b');
      } else if (style === 'deco') {
        const n = sr.int(1, 2);
        for (let i = 0; i < n; i++) {
          const w = sr.range(14, 22); const d = sr.range(12, 18); const h = sr.range(12, 34);
          const ox = (i - (n - 1) / 2) * 24;
          addBuilding(cx + ox, cz, w, d, h, 'deco', sr);
          cb.add(bg, m4(cx + ox, h + 1, cz, 0, 1, 4, w * 0.4), sr.pick(STYLE_COLORS.deco));
        }
      } else if (style === 'shop') {
        const n = sr.int(2, 3);
        for (let i = 0; i < n; i++) {
          const w = sr.range(10, 16); const d = sr.range(9, 13); const h = sr.range(6, 12);
          addBuilding(cx + (i - 1) * 20, cz + (i % 2) * 8 - 4, w, d, h, 'shop', sr);
          cb.add(bg, m4(cx + (i - 1) * 20, 1.2, cz + d / 2 + 1, 0, w * 0.8, 0.3, 1.6), sr.pick(STYLE_COLORS.shop));
        }
      } else if (style === 'villa') {
        for (let i = 0; i < 4; i++) {
          const ox = (i % 2 - 0.5) * 30; const oz = (Math.floor(i / 2) - 0.5) * 30;
          addBuilding(cx + ox, cz + oz, sr.range(9, 13), sr.range(9, 13), sr.range(5, 8), 'villa', sr);
          cb.add(bg, m4(cx + ox, 0.4, cz + oz + 10, 0, 5, 0.5, 3), '#4a9a9a');
        }
      } else if (style === 'warehouse') {
        if (sr.chance(0.5)) {
          addBuilding(cx, cz, sr.range(24, 34), sr.range(16, 22), sr.range(8, 13), 'warehouse', sr);
        } else {
          const cols = ['#c95a3a', '#3a7ac9', '#3a9a5a', '#c9a83a', '#8a5ac9', '#c97a3a'];
          for (let i = 0; i < 8; i++) {
            if (sr.chance(0.3)) continue;
            const stack = sr.int(1, 3);
            for (let s = 0; s < stack; s++) {
              cb.add(bg, m4(cx - 20 + (i % 4) * 13, 1.4 + s * 2.8, cz - 12 + Math.floor(i / 4) * 14, 0, 12, 2.6, 2.6), cols[i % 6]);
            }
            collision.registerBox(cx - 26 + (i % 4) * 13, cz - 13.3 + Math.floor(i / 4) * 14, cx - 14 + (i % 4) * 13, cz - 10.7 + Math.floor(i / 4) * 14, 8, 'solid');
          }
        }
      }
    }
  }
  {
    const sr = rng.fork('island');
    addBuilding(805, -135, 12, 12, 7, 'villa', sr);
    addBuilding(895, -135, 12, 12, 7, 'villa', sr);
    addBuilding(805, -45, 12, 12, 6, 'villa', sr);
    for (let f = 0; f < 6; f++) {
      cb.add(bg, m4(895, 2 + f * 3, -45, 0, 20, 0.5, 16), '#9a9a92');
    }
    for (let c = 0; c < 4; c++) {
      cb.add(bg, m4(887 + (c % 2) * 16, 9, -51 + Math.floor(c / 2) * 12, 0, 1.2, 18, 1.2), '#8a8a82');
    }
    cb.add(bg, m4(920, 23, -60, 0, 2, 46, 2), '#e8c93a');
    cb.add(bg, m4(920, 44, -60, 0, 24, 2, 2), '#e8c93a');
    collision.registerBox(885, -53, 905, -37, 18, 'solid');
  }
  for (const p of plan.PLACES) {
    const lm = LANDMARKS[p.id];
    if (!lm) continue;
    const b = addBuilding(p.x, p.z, lm.w, lm.d, lm.h, lm.style, rng.fork('lm-' + p.id));
    if (lm.sign >= 0) {
      sb.add(pg, m4(p.x, lm.h + 2.5, p.z - lm.d / 2 - 0.3, 0, 12, 3, 1), '#ffffff', { su: 1 / 8, sv: 1, ou: lm.sign / 8, ov: 0 });
      sb.add(pg, m4(p.x, lm.h + 2.5, p.z + lm.d / 2 + 0.3, Math.PI, 12, 3, 1), '#ffffff', { su: 1 / 8, sv: 1, ou: lm.sign / 8, ov: 0 });
    }
    if (p.id === 'tower') {
      for (let s = 0; s < 4; s++) {
        const a = (s * Math.PI) / 2;
        sb.add(pg, m4(p.x + Math.sin(a) * 12.4, 52, p.z + Math.cos(a) * 12.4, a, 16, 4, 1), '#ffffff', { su: 1 / 8, sv: 1, ou: 4 / 8, ov: 0 });
      }
    }
  }
  const facadeMesh = facadeBag.build(fm);
  const colorMesh = cb.build(colorMat);
  const signMesh = sb.build(sm);
  group.add(facadeMesh, colorMesh, signMesh);
  const palmRng = rng.fork('palms');
  const palmSpots = [];
  for (let bx = 0; bx < 10; bx++) {
    for (let bz = 0; bz < 8; bz++) {
      const d = plan.DISTRICTS[plan.districtOfBlock(bx, bz)];
      const n = Math.round(6 * d.palms);
      for (let i = 0; i < n; i++) {
        const cx = plan.X0 + bx * plan.SPACING + palmRng.range(10, 80);
        const cz = plan.Z0 + bz * plan.SPACING + palmRng.range(10, 80);
        if (collision.solidAt(cx, cz, 1)) continue;
        palmSpots.push({ x: cx, z: cz, h: palmRng.range(7, 11), lean: palmRng.range(-0.12, 0.12), rot: palmRng.range(0, Math.PI * 2) });
      }
    }
  }
  for (let i = 0; i < 24; i++) palmSpots.push({ x: 462 + (i % 2) * 4, z: 40 + i * 14, h: 8 + (i % 3), lean: 0.08, rot: i });
  {
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 1, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length);
    const crownGeo = new THREE.ConeGeometry(2.6, 2.2, 7);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x2e7a3a, roughness: 1, flatShading: true });
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, palmSpots.length);
    const dm = new THREE.Object3D();
    palmSpots.forEach((p, i) => {
      dm.position.set(p.x, p.h / 2, p.z);
      dm.rotation.set(p.lean, p.rot, 0);
      dm.scale.set(1, p.h, 1);
      dm.updateMatrix();
      trunks.setMatrixAt(i, dm.matrix);
      dm.position.set(p.x, p.h + 0.8, p.z);
      dm.rotation.set(0, p.rot, 0);
      dm.scale.set(1, 1, 1);
      dm.updateMatrix();
      crowns.setMatrixAt(i, dm.matrix);
      collision.registerBox(p.x - 0.4, p.z - 0.4, p.x + 0.4, p.z + 0.4, p.h, 'slim');
    });
    trunks.castShadow = true;
    group.add(trunks, crowns);
  }
  {
    const lampGeo = new THREE.CylinderGeometry(0.09, 0.12, 7.4, 5);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.8 });
    const spots = [];
    for (let bx = 0; bx < 10; bx++) for (let bz = 0; bz < 8; bz++) {
      for (let i = 0; i < 4; i++) {
        spots.push({ x: plan.X0 + bx * plan.SPACING + 8 + (i % 2) * 74, z: plan.Z0 + bz * plan.SPACING + 8 + Math.floor(i / 2) * 74 });
      }
    }
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, spots.length);
    const dm = new THREE.Object3D();
    spots.forEach((s, i) => { dm.position.set(s.x, 3.7, s.z); dm.rotation.set(0, 0, 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); lamps.setMatrixAt(i, dm.matrix); });
    group.add(lamps);
    const glowGeo = new THREE.BufferGeometry();
    const gp = new Float32Array(spots.length * 3);
    spots.forEach((s, i) => { gp[i * 3] = s.x; gp[i * 3 + 1] = 7.4; gp[i * 3 + 2] = s.z; });
    glowGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const glowMat = new THREE.PointsMaterial({ color: 0xffd98a, size: 3.2, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false });
    const glows = new THREE.Points(glowGeo, glowMat);
    group.add(glows);
    group.userData.lg = glowMat;
  }
  {
    const umbRng = rng.fork('beach');
    const umbGeo = new THREE.ConeGeometry(2.2, 1.1, 8);
    const umbMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const umbs = new THREE.InstancedMesh(umbGeo, umbMat, 90);
    const dm = new THREE.Object3D();
    const col = new THREE.Color();
    const cols = ['#ff5d5d', '#ffd23d', '#6db9ff', '#ff7ad9', '#7ee2a8'];
    for (let i = 0; i < 90; i++) {
      dm.position.set(umbRng.range(470, 536), 1.6, umbRng.range(310, 360));
      dm.rotation.set(0, umbRng.range(0, 6), 0);
      dm.updateMatrix();
      umbs.setMatrixAt(i, dm.matrix);
      umbs.setColorAt(i, col.set(cols[i % 5]));
    }
    group.add(umbs);
    for (let i = 0; i < 4; i++) {
      cb.add(bg, m4(478 + i * 18, 2, 320, 0, 4, 4, 4), '#f0ead8');
      cb.add(bg, m4(478 + i * 18, 4.4, 320, 0, 5, 0.5, 5), '#ff5d5d');
    }
  }
  const wheel = new THREE.Group();
  {
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 1 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(182, 0.6, 10), pierMat);
    pier.position.set(549, 0.35, 135); pier.receiveShadow = true; group.add(pier);
    for (let x = 462; x <= 636; x += 12) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), pierMat);
      post.position.set(x, -1.5, 131); group.add(post);
      const post2 = post.clone(); post2.position.z = 139; group.add(post2);
    }
    for (let i = 0; i < 3; i++) {
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), new THREE.MeshStandardMaterial({ color: ['#ff5d5d', '#ffd23d', '#6db9ff'][i], roughness: 0.9 }));
      kiosk.position.set(500 + i * 40, 2.2, 135); group.add(kiosk);
    }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(21, 0.7, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf0ead8, roughness: 0.6 }));
    wheel.add(rim);
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 42, 0.5), new THREE.MeshStandardMaterial({ color: 0xd8d0c0 }));
      spoke.rotation.z = (i * Math.PI) / 8;
      wheel.add(spoke);
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2, 2), new THREE.MeshStandardMaterial({ color: ['#ff5d5d', '#ffd23d', '#6db9ff', '#7ee2a8'][i % 4] }));
      car.position.set(Math.cos(a) * 21, Math.sin(a) * 21, 0);
      wheel.add(car);
    }
    const sup1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 26, 1.2), new THREE.MeshStandardMaterial({ color: 0xf0ead8 }));
    sup1.position.set(-6, 13, 0); sup1.rotation.z = 0.35; wheel.add(sup1);
    const sup2 = sup1.clone(); sup2.position.x = 6; sup2.rotation.z = -0.35; wheel.add(sup2);
    wheel.position.set(630, 24, 135);
    group.add(wheel);
  }
  {
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x6a6f78, roughness: 0.9 });
    for (let x = 470; x < 750; x += 10) {
      const t = (x - 470) / 280;
      const y = 0.15 + Math.sin(t * Math.PI) * 11;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 16), deckMat);
      seg.position.set(x + 5, y, -90); group.add(seg);
      if (x % 40 === 0) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(3, y + 4, 3), deckMat);
        pier.position.set(x, (y - 0.7) / 2 - 0.5, -90); group.add(pier);
      }
    }
    for (const tx of [540, 680]) {
      for (const tz of [-97, -83]) {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 46, 3), new THREE.MeshStandardMaterial({ color: 0xff7a8a, roughness: 0.7 }));
        tower.position.set(tx, 24, tz); group.add(tower);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b3b }));
        beacon.position.set(tx, 47.5, tz); group.add(beacon);
      }
    }
    collision.registerBox(470, -98, 750, -82, 12, 'solid');
  }
  {
    for (let i = 0; i < 5; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.18, 2.8 - i * 0.18, 7.4, 12), new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xd83a3a : 0xf0ead8, roughness: 0.8 }));
      band.position.set(940, 3.7 + i * 7.4, -200);
      group.add(band);
    }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(2, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    lamp.position.set(940, 41, -200); group.add(lamp);
  }
  const blimp = new THREE.Group();
  {
    for (let i = 0; i < 4; i++) {
      const crane = new THREE.Group();
      const legMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xc93a3a : 0x3a6ac9, roughness: 0.7 });
      for (const [lx, lz] of [[-6, -4], [6, -4], [-6, 4], [6, 4]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 38, 1.5), legMat);
        leg.position.set(lx, 19, lz); crane.add(leg);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 3), legMat);
      beam.position.set(0, 38, 0); crane.add(beam);
      crane.position.set(-320 + i * 60, 0, 380);
      group.add(crane);
    }
    const hull = new THREE.Mesh(new THREE.BoxGeometry(150, 10, 22), new THREE.MeshStandardMaterial({ color: 0x2a2f3a }));
    hull.position.set(-100, 2, 470); group.add(hull);
    const band = new THREE.Mesh(new THREE.BoxGeometry(150, 2, 22.4), new THREE.MeshStandardMaterial({ color: 0xc93a3a }));
    band.position.set(-100, 5, 470); group.add(band);
    const sup = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 16), new THREE.MeshStandardMaterial({ color: 0xf0ead8 }));
    sup.position.set(-160, 12, 470); group.add(sup);
    for (let i = 0; i < 8; i++) {
      const cont = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 2.6), new THREE.MeshStandardMaterial({ color: ['#c95a3a', '#3a7ac9', '#3a9a5a', '#c9a83a'][i % 4] }));
      cont.position.set(-120 + i * 13, 8.5, 470); group.add(cont);
    }
    const yachtRng = rng.fork('yachts');
    for (let i = 0; i < 11; i++) {
      const y = new THREE.Group();
      const hullY = new THREE.Mesh(new THREE.BoxGeometry(9 + yachtRng.range(0, 7), 1.6, 2.6), new THREE.MeshStandardMaterial({ color: 0xf0ead8 }));
      y.add(hullY);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9, 5), new THREE.MeshStandardMaterial({ color: 0x8a8a82 }));
      mast.position.y = 5; y.add(mast);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 6), new THREE.MeshStandardMaterial({ color: ['#ff5d5d', '#ffd23d', '#6db9ff'][i % 3], side: THREE.DoubleSide }));
      sail.position.set(1.2, 5, 0); y.add(sail);
      y.position.set(yachtRng.range(-300, 600), -0.4, yachtRng.range(480, 620));
      y.rotation.y = yachtRng.range(0, 6);
      group.add(y);
    }
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x7a9a5e, roughness: 1, flatShading: true });
    const hillRng = rng.fork('hills');
    for (let i = 0; i < 25; i++) {
      const h = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 7, 2), hillMat);
      const height = hillRng.range(50, 150);
      const a = Math.PI + (i / 24) * Math.PI;
      h.position.set(Math.cos(a) * hillRng.range(700, 1100), height / 2 - 6, Math.min(-120, Math.sin(a) * 900) - 420);
      h.scale.set(hillRng.range(200, 420), height, hillRng.range(200, 420));
      group.add(h);
    }
    const envelope = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff7a2e, roughness: 0.7 }));
    envelope.scale.set(2, 1, 1);
    blimp.add(envelope);
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 4), new THREE.MeshStandardMaterial({ color: 0xf0ead8 }));
    gondola.position.y = -8; blimp.add(gondola);
    blimp.position.set(130, 150, -60);
    group.add(blimp);
    group.userData.blimp = blimp;
    const gullMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const gulls = [];
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), gullMat);
      g.userData = { r: rng.range(14, 40), h: rng.range(16, 38), a: rng.range(0, 6.28), s: rng.range(0.3, 0.7) };
      group.add(g);
      gulls.push(g);
    }
    group.userData.gulls = gulls;
  }
  {
    const market = plan.placeById.get('market');
    const stallCols = ['#ff5d5d', '#ffd23d', '#6db9ff', '#7ee2a8', '#ff7ad9'];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = market.x - 20 + c * 10;
        const z = market.z - 16 + r * 8;
        const facing = (r + c) % 2 === 0 ? 1 : -1;
        cb.add(bg, m4(x, 1.1, z, 0, 6, 2.2, 4), '#6a4a3a');
        cb.add(bg, m4(x, 2.6, z + facing * 1.5, 0, 7, 0.4, 5), stallCols[(r + c) % 5]);
        for (let w = 0; w < 3; w++) {
          cb.add(bg, m4(x - 2 + w * 2, 2.4, z, 0, 1.2, 0.5, 1), ['#ff9d2e', '#7ee2a8', '#ff7ad9'][w]);
        }
        collision.registerBox(x - 3, z - 2, x + 3, z + 2, 3, 'solid');
      }
    }
    for (let i = 0; i < 8; i++) {
      const x = market.x - 24 + i * 7;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 5), new THREE.MeshStandardMaterial({ color: 0x3a2f28 }));
      post.position.set(x, 3, market.z - 18 + (i % 2) * 36);
      group.add(post);
    }
    sb.add(pg, m4(market.x, 9, market.z - 22, 0, 16, 4, 1), '#ffffff', { su: 1 / 8, sv: 1, ou: 0, ov: 0 });
  }
  group.userData.fm = fm;
  group.userData.sm = sm;
  group.userData.ot = ot;
  group.userData.wheel = wheel;
  function update(time, nightFactor) {
    fm.emissiveIntensity = nightFactor * 0.95;
    sm.emissiveIntensity = 0.25 + nightFactor * 0.75;
    const lg = group.userData.lg;
    if (lg) lg.opacity = nightFactor * 0.9;
    ot.offset.x = (time * 0.004) % 1;
    ot.offset.y = (time * 0.002) % 1;
    wheel.rotation.z = time * 0.12;
    const bl = group.userData.blimp;
    if (bl) {
      const a = time * 0.021;
      bl.position.set(130 + Math.cos(a) * 220, 150 + Math.sin(time * 0.3) * 3, -60 + Math.sin(a) * 220);
      bl.rotation.y = -a;
    }
    for (const g of group.userData.gulls || []) {
      g.userData.a += g.userData.s * 0.016;
      g.position.set(500 + Math.cos(g.userData.a) * g.userData.r, g.userData.h, 330 + Math.sin(g.userData.a) * g.userData.r);
      g.rotation.y = -g.userData.a;
      g.rotation.z = Math.sin(time * 6 + g.userData.a * 5) * 0.3;
    }
  }
  return { group, update };
}