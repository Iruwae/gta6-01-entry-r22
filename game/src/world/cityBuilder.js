import * as THREE from 'three';
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function paintFacades(rng) {
  const day = makeCanvas(512, 640), night = makeCanvas(512, 640);
  const d = day.getContext('2d'), n = night.getContext('2d');
  n.fillStyle = '#000'; n.fillRect(0, 0, 512, 640);
  function F(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  const V = [
    ['#5a7a9a', .45, 1, 0, 0, 0], ['#3a4a5a', .35, 1, 0, 0, 0],
    ['#a86a4a', .40, 0, 0, 0, 0], ['#d8c8a8', .42, 0, 1, 0, 0],
    ['#c8a878', .45, 0, 0, 1, 0], ['#8a8a82', .30, 0, 0, 0, 0],
    ['#b07850', .40, 1, 0, 0, 0], ['#7a6a58', .25, 0, 0, 0, 1],
  ];
  V.forEach((v, vi) => {
    const x0 = (vi % 4) * 128, y0 = Math.floor(vi / 4) * 256;
    F(d, v[0], x0, y0, 128, 256);
    for (let f = 0; f < 8; f++) {
      const fy = y0 + f * 32;
      F(d, 'rgba(0,0,0,' + (0.08 + f * 0.02) + ')', x0, fy, 128, 32);
      F(d, 'rgba(0,0,0,0.3)', x0, fy, 128, 2);
      for (let b = 0; b < 4; b++) {
        if (v[5] && f < 4) continue;
        if (!rng.chance(0.82)) continue;
        const wx = x0 + b * 32 + 5 + rng.int(0, 3), wy = fy + 6 + rng.int(0, 3), wh = 18 + rng.int(0, 4);
        const lit = rng.chance(v[1]), ww = v[2] ? 22 : 10;
        F(d, lit ? '#3d434e' : '#22262f', wx, wy, ww, wh);
        F(d, 'rgba(255,255,255,0.28)', wx, wy, ww, 4);
        if (!v[2]) { F(d, lit ? '#3d434e' : '#22262f', wx + 12, wy, ww, wh); F(d, 'rgba(255,255,255,0.25)', wx + 12, wy, ww, 3); }
        if (v[3]) F(d, 'rgba(0,0,0,0.4)', wx - 2, wy + wh + 1, ww + 4, 2);
        if (v[4]) F(d, 'rgba(255,255,255,0.4)', wx - 1, wy + wh + 1, ww + 2, 2);
        if (lit) {
          n.fillStyle = rng.chance(0.75) ? '#ffd98a' : '#9fd4ff';
          n.fillRect(wx, wy, ww, wh);
          if (!v[2]) n.fillRect(wx + 12, wy, ww, wh);
        }
      }
    }
    if (vi === 7) for (let i = 0; i < 26; i++) F(d, 'rgba(120,60,20,0.25)', x0 + rng.int(0, 120), y0 + rng.int(0, 250), 3, rng.int(10, 50));
  });
  const brands = [['MANGO SODA', '#ff9d2e'], ['TIDEWICH', '#7ee2a8'], ['CORAL MOTORS', '#ff5d5d'], ['CLUB NEON', '#9be7ff']];
  brands.forEach((br, i) => {
    const x0 = i * 128, y0 = 512;
    F(d, '#14141c', x0, y0, 128, 32);
    d.fillStyle = br[1]; d.font = 'bold 16px Arial'; d.textAlign = 'center'; d.fillText(br[0], x0 + 64, y0 + 22);
    n.fillStyle = br[1]; n.font = 'bold 16px Arial'; n.textAlign = 'center'; n.fillText(br[0], x0 + 64, y0 + 22);
    for (let s = 0; s < 8; s++) F(d, s % 2 ? '#f0ead8' : br[1], x0 + s * 16, y0 + 32, 16, 12);
    for (let p = 0; p < 3; p++) {
      const px = x0 + 6 + p * 41;
      F(d, '#20242e', px, y0 + 48, 37, 76);
      F(d, 'rgba(160,200,255,0.25)', px, y0 + 48, 37, 10);
      F(d, '#3a3f4a', px + 17, y0 + 48, 3, 76);
      F(n, '#ffcf7a', px, y0 + 54, 37, 66);
    }
    F(d, '#10131c', x0 + 56, y0 + 48, 16, 76);
    F(d, '#c9a86a', x0 + 70, y0 + 80, 2, 4);
  });
  const dayTex = new THREE.CanvasTexture(day);
  const nightTex = new THREE.CanvasTexture(night);
  for (const t of [dayTex, nightTex]) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; }
  return { dayTex, nightTex };
}
function createBag() {
  const pos = [], nor = [], uv = [], col = [];
  const tc = new THREE.Color();
  function add(geo, matrix, color, uvScale = null) {
    const g = geo.toNonIndexed ? geo.toNonIndexed() : geo;
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    const v = new THREE.Vector3(), nv = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(matrix);
      pos.push(v.x, v.y, v.z);
      nv.fromBufferAttribute(n, i).transformDirection(matrix);
      nor.push(nv.x, nv.y, nv.z);
      if (u) {
        let uu = u.getX(i), vv = u.getY(i);
        if (uvScale) { uu = uu * uvScale.su + uvScale.ou; vv = vv * uvScale.sv + uvScale.ov; }
        uv.push(uu, vv);
      } else uv.push(0, 0);
      tc.set(color);
      col.push(tc.r, tc.g, tc.b);
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
    return mesh;
  }
  return { add, build };
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function m4(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(sx, sy, sz));
  return m;
}
export function buildCity(scene, plan, collision, rng) {
  const group = new THREE.Group();
  group.name = 'solmar-bay';
  scene.add(group);
  const { dayTex, nightTex } = paintFacades(rng.fork('facades'));
  const fm = new THREE.MeshStandardMaterial({ map: dayTex, emissiveMap: nightTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: 0.9, vertexColors: true });
  const colorMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 1 });
  function pm(f, c, rx) {
    const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0 });
    new THREE.TextureLoader().load(f, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rx > 1) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(rx, 1); } m.map = t; m.emissiveMap = t; m.color.set(0xffffff); m.emissiveIntensity = 0.3; m.needsUpdate = true; });
    return m;
  }
  const photoMats = { brick: pm('tex-brick.png', 0x8a6a5a, 1), concrete: pm('tex-concrete.png', 0x9a9a92, 1), glass: pm('tex-glass.png', 0x2a4a6a, 1), barber: pm('tex-barber.png', 0x3a3a3a, 3) };
  let heroCount = 0, barberCount = 0;
  const ot = (() => {
    const c = makeCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#1a8a9a'; g.fillRect(0, 0, 256, 256);
    g.lineWidth = 2;
    for (let i = 0; i < 120; i++) {
      g.strokeStyle = rng.chance(0.5) ? 'rgba(120,220,235,0.5)' : 'rgba(20,120,140,0.5)';
      const x = rng.range(0, 256), y = rng.range(0, 256);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rng.range(8, 22), y + rng.range(-3, 3)); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(260, 260);
    return t;
  })();
  const facadeBag = createBag();
  const cb = createBag();
  const sb = createBag();
  const bg = new THREE.BoxGeometry(1, 1, 1);
  const pg = new THREE.PlaneGeometry(1, 1);
  function B(x, y, z, sx, sy, sz, c) { cb.add(bg, m4(x, y, z, 0, sx, sy, sz), c); }
  {
    function flat(w, h, c, x, y, z, sh) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = !!sh;
      group.add(m);
      return m;
    }
    flat(2600, 2200, '#2e2f36', 0, -0.02, 0, 1);
    flat(2600, 900, '#5d8f52', 0, -0.05, -900);
    flat(180, 220, '#e0d0a0', 503, 0.02, 330, 1);
    flat(500, 90, '#8a8578', -200, 0.02, 400);
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ map: ot, roughness: 0.55, metalness: 0.1 }));
    ocean.rotation.x = -Math.PI / 2; ocean.position.set(0, -0.7, 0); group.add(ocean);
    ot.userData = { mesh: ocean };
  }
  {
    const lots = new THREE.InstancedMesh(new THREE.PlaneGeometry(74, 74), new THREE.MeshStandardMaterial({ roughness: 1 }), 84);
    const dm = new THREE.Object3D();
    const color = new THREE.Color();
    let idx = 0;
    function put(x, z, c) {
      dm.position.set(x, 0.03, z); dm.rotation.set(-Math.PI / 2, 0, 0); dm.updateMatrix();
      lots.setMatrixAt(idx, dm.matrix); lots.setColorAt(idx, color.set(c)); idx++;
    }
    for (let bx = 0; bx < 10; bx++) for (let bz = 0; bz < 8; bz++) {
      put(plan.X0 + bx * plan.SPACING + 45, plan.Z0 + bz * plan.SPACING + 45, plan.DISTRICTS[plan.districtOfBlock(bx, bz)].lot);
    }
    for (let i = 0; i < 4; i++) put(805 + (i % 2) * 90, -135 + Math.floor(i / 2) * 90, plan.DISTRICTS[7].lot);
    lots.count = idx;
    lots.receiveShadow = true;
    group.add(lots);
  }
  {
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffd23d });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markBag = createBag();
    const whiteBag = createBag();
    function M(bag, x, z, sx, sz, c) { bag.add(pg, m4(x, 0.02, z, 0, sx, 1, sz), c); }
    for (let r = 0; r < plan.ROWS; r++) {
      const z = plan.Z0 + r * plan.SPACING;
      for (let x = plan.X0 + 20; x < plan.X0 + 10 * plan.SPACING - 10; x += 16) {
        M(markBag, x, z - 0.6, 8, 0.35, '#ffd23d');
        M(markBag, x, z + 0.6, 8, 0.35, '#ffd23d');
      }
    }
    for (let c = 0; c < plan.COLS; c++) {
      const x = plan.X0 + c * plan.SPACING;
      for (let z = plan.Z0 + 20; z < plan.Z0 + 8 * plan.SPACING - 10; z += 16) {
        M(whiteBag, x - 4, z, 0.25, 7, '#ffffff');
        M(whiteBag, x + 4, z, 0.25, 7, '#ffffff');
      }
    }
    for (const j of plan.junctions) {
      for (let s = -3; s <= 3; s++) {
        M(whiteBag, j.x + s * 2.2, j.z - 9, 1.1, 2.4, '#ffffff');
        M(whiteBag, j.x + s * 2.2, j.z + 9, 1.1, 2.4, '#ffffff');
      }
    }
    const m1 = markBag.build(markMat); m1.rotation.x = -Math.PI / 2; group.add(m1);
    const m2 = whiteBag.build(whiteMat); m2.rotation.x = -Math.PI / 2; group.add(m2);
  }
  {
    const curbBag = createBag();
    for (let bx = 0; bx < 10; bx++) for (let bz = 0; bz < 8; bz++) {
      const cx = plan.X0 + bx * plan.SPACING + 45, cz = plan.Z0 + bz * plan.SPACING + 45;
      curbBag.add(bg, m4(cx, 0.17, cz - 37.2, 0, 74.8, 0.35, 0.5), '#9a9a90');
      curbBag.add(bg, m4(cx, 0.17, cz + 37.2, 0, 74.8, 0.35, 0.5), '#9a9a90');
      curbBag.add(bg, m4(cx - 37.2, 0.17, cz, 0, 0.5, 0.35, 74.8), '#9a9a90');
      curbBag.add(bg, m4(cx + 37.2, 0.17, cz, 0, 0.5, 0.35, 74.8), '#9a9a90');
    }
    group.add(curbBag.build(colorMat));
  }
  const blockRng = rng.fork('blocks');
  const STYLE_COLORS = {
    deco: ['#e8b48a', '#e8c9a0', '#d8a878', '#e8a8a0'],
    shop: ['#ff7a5c', '#ffd23d', '#7ee2a8', '#6db9ff', '#ff7ad9', '#c9a86a'],
  };
  const VAR = { glass: [0, 1], deco: [2, 3], apartment: [4, 5], shop: [6, 4], villa: [3], warehouse: [7] };
  const TINT = ['#ffffff', '#f2e8d8', '#dde4ee', '#ead8c8'];
  function addBuilding(cx, cz, w, d, h, style, seedRng) {
    const y = h / 2 + 0.15;
    const vs = VAR[style] || [0];
    const vi = vs[seedRng.int(0, vs.length - 1)];
    const su = Math.max(1, Math.round(Math.max(w, d) / 12.8)) * 0.25;
    const sv = Math.max(1, Math.round(h / 25.6)) * 0.5;
    const near = (Math.abs(cx + 300) < 140 && Math.abs(cz - 90) < 140) || (Math.abs(cx + 180) < 130 && Math.abs(cz - 60) < 130);
    let photo = null;
    if (near && heroCount < 16) {
      if (h >= 10 && h <= 18 && style !== 'glass' && style !== 'villa') photo = 'brick';
      else if (h >= 18 && h <= 28 && style === 'deco') photo = 'concrete';
      else if (h >= 28 && h <= 38 && style === 'deco') photo = 'glass';
    }
    if (photo) {
      heroCount++;
      const m = photoMats[photo];
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [m, m, roofMat, roofMat, m, m]);
      mesh.position.set(cx, y, cz); mesh.castShadow = true;
      group.add(mesh);
    } else {
      facadeBag.add(bg, m4(cx, y, cz, 0, w, h, d), seedRng.pick(TINT), { su, sv, ou: (vi % 4) * 0.25, ov: vi < 4 ? 0.5 : 0 });
    }
    if (style !== 'warehouse' && style !== 'villa' && photo !== 'brick') {
      const barber = near && style === 'shop' && h >= 6 && h <= 12 && barberCount < 6;
      if (barber) {
        barberCount++;
        const b = photoMats.barber;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 3.4, d + 0.6), [b, b, roofMat, roofMat, b, b]);
        mesh.position.set(cx, 1.85, cz); mesh.castShadow = true;
        group.add(mesh);
      } else {
        const ps = Math.max(1, Math.round(Math.max(w, d) / 6.4)) * 0.25;
        facadeBag.add(bg, m4(cx, 1.85, cz, 0, w + 0.6, 3.4, d + 0.6), '#ffffff', { su: ps, sv: 0.2, ou: seedRng.int(0, 3) * 0.25, ov: 0 });
      }
    }
    B(cx, h + 0.3, cz, w + 0.6, 0.5, d + 0.6, '#3a3f4a');
    const nClutter = seedRng.int(1, 3);
    for (let i = 0; i < nClutter; i++) {
      B(cx + seedRng.range(-w / 4, w / 4), h + 0.9, cz + seedRng.range(-d / 4, d / 4), seedRng.range(1, 3), seedRng.range(0.8, 1.6), seedRng.range(1, 3), '#565c6a');
    }
    if (style === 'deco' && seedRng.chance(0.3)) {
      B(cx, h + 2.2, cz, 2.6, 2.4, 2.6, '#7a6a58');
      B(cx, h + 1.1, cz, 0.5, 2, 0.5, '#5a5a52');
    }
    if (style === 'glass' && seedRng.chance(0.4)) {
      B(cx + w / 2 - 0.5, h + 4, cz, 0.5, 8, 3, seedRng.pick(['#c9a86a', '#7fa8c8', '#e8b48a']));
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
        const h1 = sr.range(14, 26);
        addBuilding(cx, cz, bw, bd, h1, 'glass', sr);
        let w = bw * 0.78; let d = bd * 0.78; let y = h1;
        const tiers = sr.int(3, 4);
        for (let t = 0; t < tiers; t++) {
          const th = sr.range(12, 22);
          addBuilding(cx, cz, w, d, y + th / 2 + 0.15, 'glass', sr);
          y += th; w *= 0.78; d *= 0.78;
        }
        const w2 = sr.range(14, 20);
        addBuilding(cx + 26, cz - 22, w2, w2, sr.range(18, 34), 'glass', sr);
        B(cx, y + 4, cz, 1.2, 8, 1.2, '#c8ccd8');
        B(cx, y + 8.5, cz, 0.8, 0.8, 0.8, '#ff3b3b');
      } else if (style === 'deco') {
        const n = sr.int(2, 3);
        for (let i = 0; i < n; i++) {
          const w = sr.range(14, 22); const d = sr.range(12, 18); const h = sr.range(12, 34);
          const ox = (i - (n - 1) / 2) * 24;
          addBuilding(cx + ox, cz, w, d, h, 'deco', sr);
          B(cx + ox, h + 1, cz, 1, 4, w * 0.4, sr.pick(STYLE_COLORS.deco));
        }
      } else if (style === 'shop') {
        const n = sr.int(4, 5);
        for (let i = 0; i < n; i++) {
          const w = sr.range(10, 16); const d = sr.range(9, 13); const h = sr.range(6, 12);
          addBuilding(cx + (i - (n - 1) / 2) * 14, cz + (i % 2) * 8 - 4, w, d, h, 'shop', sr);
          B(cx + (i - (n - 1) / 2) * 14, 1.2, cz + d / 2 + 1, w * 0.8, 0.3, 1.6, sr.pick(STYLE_COLORS.shop));
        }
      } else if (style === 'villa') {
        for (let i = 0; i < 6; i++) {
          const ox = (i % 3 - 1) * 22; const oz = (Math.floor(i / 3) - 0.5) * 24;
          addBuilding(cx + ox, cz + oz, sr.range(9, 13), sr.range(9, 13), sr.range(5, 8), 'villa', sr);
          B(cx + ox, 0.4, cz + oz + 10, 5, 0.5, 3, '#4a9a9a');
        }
      } else if (style === 'warehouse') {
        addBuilding(cx, cz, sr.range(24, 34), sr.range(16, 22), sr.range(10, 16), 'warehouse', sr);
        {
          const cols = ['#c95a3a', '#3a7ac9', '#3a9a5a', '#c9a83a', '#8a5ac9', '#c97a3a'];
          for (let i = 0; i < 8; i++) {
            if (sr.chance(0.3)) continue;
            const stack = sr.int(1, 3);
            for (let s = 0; s < stack; s++) {
              B(cx - 20 + (i % 4) * 13, 1.4 + s * 2.8, cz + 16 + Math.floor(i / 4) * 14, 12, 2.6, 2.6, cols[i % 6]);
            }
            collision.registerBox(cx - 26 + (i % 4) * 13, cz + 14.7 + Math.floor(i / 4) * 14, cx - 14 + (i % 4) * 13, cz + 17.3 + Math.floor(i / 4) * 14, 8, 'solid');
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
      B(895, 2 + f * 3, -45, 20, 0.5, 16, '#9a9a92');
    }
    for (let c = 0; c < 4; c++) {
      B(887 + (c % 2) * 16, 9, -51 + Math.floor(c / 2) * 12, 1.2, 18, 1.2, '#8a8a82');
    }
    B(920, 23, -60, 2, 46, 2, '#e8c93a');
    B(920, 44, -60, 24, 2, 2, '#e8c93a');
    collision.registerBox(885, -53, 905, -37, 18, 'solid');
  }
  for (const p of plan.PLACES) {
    const lm = LANDMARKS[p.id];
    if (!lm) continue;
    const b = addBuilding(p.x, p.z, lm.w, lm.d, lm.h, lm.style, rng.fork('lm-' + p.id));
    if (lm.sign >= 0) {
      sb.add(pg, m4(p.x, lm.h + 2.5, p.z - lm.d / 2 - 0.3, 0, 12, 3, 1), '#ffffff', { su: 0.25, sv: 0.05, ou: (lm.sign % 4) * 0.25, ov: 0.15 });
      sb.add(pg, m4(p.x, lm.h + 2.5, p.z + lm.d / 2 + 0.3, Math.PI, 12, 3, 1), '#ffffff', { su: 0.25, sv: 0.05, ou: (lm.sign % 4) * 0.25, ov: 0.15 });
    }
    if (p.id === 'tower') {
      for (let s = 0; s < 4; s++) {
        const a = (s * Math.PI) / 2;
        sb.add(pg, m4(p.x + Math.sin(a) * 12.4, 52, p.z + Math.cos(a) * 12.4, a, 16, 4, 1), '#ffffff', { su: 0.25, sv: 0.05, ou: 0, ov: 0.15 });
      }
    }
  }
  const facadeMesh = facadeBag.build(fm);
  const colorMesh = cb.build(colorMat);
  const signMesh = sb.build(fm);
  group.add(facadeMesh, colorMesh, signMesh);
  const palmRng = rng.fork('palms');
  const palmSpots = [];
  for (let bx = 0; bx < 10; bx++) {
    for (let bz = 0; bz < 8; bz++) {
      const d = plan.DISTRICTS[plan.districtOfBlock(bx, bz)];
      const n = Math.round(16 * d.palms);
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
    const frondGeo = new THREE.ConeGeometry(0.55, 3.4, 4);
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x2a6e35, roughness: 1, flatShading: true });
    const fronds = new THREE.InstancedMesh(frondGeo, frondMat, palmSpots.length * 7);
    const coreGeo = new THREE.ConeGeometry(1.3, 1.9, 7);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x3f9148, roughness: 1, flatShading: true });
    const cores = new THREE.InstancedMesh(coreGeo, coreMat, palmSpots.length);
    const dm = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    palmSpots.forEach((p, i) => {
      dm.position.set(p.x, p.h / 2, p.z);
      dm.rotation.set(p.lean, p.rot, 0);
      dm.scale.set(1, p.h, 1);
      dm.updateMatrix();
      trunks.setMatrixAt(i, dm.matrix);
      for (let f = 0; f < 7; f++) {
        const yaw = p.rot + (f / 7) * Math.PI * 2;
        dir.set(Math.sin(yaw) * Math.sin(0.95), Math.cos(0.95), Math.cos(yaw) * Math.sin(0.95));
        dm.position.set(p.x + dir.x * 0.9, p.h + 1.1, p.z + dir.z * 0.9);
        dm.quaternion.setFromUnitVectors(up, dir);
        dm.scale.set(1, 1, 0.3);
        dm.updateMatrix();
        fronds.setMatrixAt(i * 7 + f, dm.matrix);
      }
      dm.position.set(p.x, p.h + 0.9, p.z);
      dm.rotation.set(0, p.rot, 0);
      dm.scale.set(1, 1, 1);
      dm.updateMatrix();
      cores.setMatrixAt(i, dm.matrix);
      collision.registerBox(p.x - 0.4, p.z - 0.4, p.x + 0.4, p.z + 0.4, p.h, 'slim');
    });
    trunks.castShadow = true;
    group.add(trunks, fronds, cores);
  }
  {
    const tr = rng.fork('trees');
    const sp = [];
    for (let c = 0; c < 11; c++) for (let z = plan.Z0 + 30; z < plan.Z0 + 720; z += 45) for (const s of [-11, 11]) sp.push([plan.X0 + c * 90 + s, z]);
    for (let r = 0; r < 9; r++) for (let x = plan.X0 + 30; x < plan.X0 + 900; x += 45) for (const s of [-11, 11]) sp.push([x, plan.Z0 + r * 90 + s]);
    const kp = sp.filter(([x, z]) => !collision.solidAt(x, z, 1));
    const dm = new THREE.Object3D();
    const tk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 3, 5), new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 1 }), kp.length);
    const cr1 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.3, 0), new THREE.MeshStandardMaterial({ color: 0x2e6b34, roughness: 1, flatShading: true }), kp.length);
    const cr2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({ color: 0x3f8f3f, roughness: 1, flatShading: true }), kp.length);
    const cr3 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5, 0), new THREE.MeshStandardMaterial({ color: 0x55a04a, roughness: 1, flatShading: true }), kp.length);
    kp.forEach(([x, z], i) => {
      const h = 2.6 + tr.range(0, 1.4);
      dm.position.set(x, h / 2, z); dm.rotation.set(0, 0, 0); dm.scale.set(1, h / 3, 1); dm.updateMatrix(); tk.setMatrixAt(i, dm.matrix);
      const s = 0.9 + tr.range(0, 0.25);
      dm.position.set(x, h + 1.7, z); dm.rotation.set(0, tr.range(0, 6), 0); dm.scale.set(s, s, s); dm.updateMatrix(); cr1.setMatrixAt(i, dm.matrix);
      dm.position.set(x + 1.3, h + 2.6, z + 0.5); dm.rotation.set(0, tr.range(0, 6), 0); dm.scale.set(s, s, s); dm.updateMatrix(); cr2.setMatrixAt(i, dm.matrix);
      dm.position.set(x - 1.2, h + 2.4, z - 0.7); dm.rotation.set(0, tr.range(0, 6), 0); dm.scale.set(s, s, s); dm.updateMatrix(); cr3.setMatrixAt(i, dm.matrix);
    });
    group.add(tk, cr1, cr2, cr3);
  }
  {
    const lampGeo = new THREE.CylinderGeometry(0.09, 0.12, 7.4, 5);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.8 });
    const spots = [];
    for (let bx = 0; bx < 10; bx++) for (let bz = 0; bz < 8; bz++) {
      for (const [ox, oz] of [[8, 8], [82, 8], [8, 82], [82, 82], [45, 8], [45, 82], [8, 45], [82, 45]]) {
        spots.push({ x: plan.X0 + bx * plan.SPACING + ox, z: plan.Z0 + bz * plan.SPACING + oz });
      }
    }
    const lamps = new THREE.InstancedMesh(lampGeo, lampMat, spots.length);
    const dm = new THREE.Object3D();
    spots.forEach((s, i) => { dm.position.set(s.x, 3.7, s.z); dm.rotation.set(0, 0, 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); lamps.setMatrixAt(i, dm.matrix); });
    group.add(lamps);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd98a }), spots.length);
    spots.forEach((s, i) => { dm.position.set(s.x, 7.4, s.z); dm.rotation.set(0, 0, 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); heads.setMatrixAt(i, dm.matrix); });
    group.add(heads);
    const poolMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false });
    const pools = new THREE.InstancedMesh(new THREE.CircleGeometry(4, 12), poolMat, spots.length);
    spots.forEach((s, i) => { dm.position.set(s.x, 0.05, s.z); dm.rotation.set(-Math.PI / 2, 0, 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); pools.setMatrixAt(i, dm.matrix); });
    group.add(pools);
    group.userData.pool = poolMat;
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
      B(478 + i * 18, 2, 320, 4, 4, 4, '#f0ead8');
      B(478 + i * 18, 4.4, 320, 5, 0.5, 5, '#ff5d5d');
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
        B(x, 1.1, z, 6, 2.2, 4, '#6a4a3a');
        B(x, 2.6, z + facing * 1.5, 7, 0.4, 5, stallCols[(r + c) % 5]);
        for (let w = 0; w < 3; w++) {
          B(x - 2 + w * 2, 2.4, z, 1.2, 0.5, 1, ['#ff9d2e', '#7ee2a8', '#ff7ad9'][w]);
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
    sb.add(pg, m4(market.x, 9, market.z - 22, 0, 16, 4, 1), '#ffffff', { su: 0.25, sv: 0.05, ou: 0, ov: 0.15 });
  }
  group.userData.fm = fm;
  group.userData.ot = ot;
  group.userData.wheel = wheel;
  function update(time, nightFactor) {
    fm.emissiveIntensity = 0.35 + nightFactor * 0.65;
    const pm = group.userData.pool;
    if (pm) pm.opacity = nightFactor * 0.22;
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