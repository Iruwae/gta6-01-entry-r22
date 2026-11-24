import * as THREE from 'three';
export const MAKES = {
  sprint: {name: 'Sprint GT', top: 56, accel: 15, grip: 9.5, health: 1200, value: 4200, len: 4.4, color: 0xd02020},
  interceptor: {name: 'SBPD Interceptor', top: 53, accel: 14, grip: 9.2, health: 1600, value: 0, len: 4.6, color: 0x1a2a3a, police: true},
  brava: {name: 'Brava', top: 50, accel: 13, grip: 9, health: 1100, value: 3200, len: 4.3, color: 0x2080c0},
  bulwark: {name: 'Bulwark', top: 44, accel: 10, grip: 8.5, health: 2400, value: 0, len: 5.4, color: 0x2a2a30, police: true},
  cab: {name: 'Cab', top: 43, accel: 11, grip: 8.5, health: 1000, value: 1500, len: 4.4, color: 0xe0a020},
  tide: {name: 'Tide', top: 42, accel: 11, grip: 8.8, health: 1000, value: 1800, len: 4.4, color: 0x40a080},
  hauler: {name: 'Hauler', top: 40, accel: 8, grip: 7.5, health: 2200, value: 0, len: 6.5, color: 0x8a6a40},
  fizz: {name: 'Fizz', top: 38, accel: 10, grip: 8.2, health: 800, value: 900, len: 3.6, color: 0xe0e040},
  vanette: {name: 'Vanette', top: 36, accel: 9, grip: 7.8, health: 1400, value: 1200, len: 4.8, color: 0x808080},
  rockhog: {name: 'Rockhog', top: 30, accel: 9, grip: 7, health: 1800, value: 2200, len: 5, color: 0x804020},
  bus: {name: 'Bus', top: 27, accel: 5.5, grip: 6.5, health: 2800, value: 2000, len: 9, color: 0x40a0c0}
};
function buildCarMesh(g, kind, color) {
  const m = MAKES[kind] || MAKES.tide;
  const grp = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({color, roughness: 0.4, metalness: 0.4});
  const glassMat = new THREE.MeshStandardMaterial({color: 0x18242e, roughness: 0.15, metalness: 0.6});
  const darkMat = new THREE.MeshStandardMaterial({color: 0x181818, roughness: 0.9});
  const L = m.len, W = kind === 'bus' ? 2.5 : 1.9;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, 0.7, L), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  grp.add(body);
  const cabH = kind === 'bus' || kind === 'hauler' || kind === 'vanette' ? 0.9 : 0.55;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(W * 0.82, cabH, L * (kind === 'bus' ? 0.85 : 0.45)), glassMat);
  cab.position.set(0, 1.05 + cabH / 2 - 0.2, kind === 'bus' ? 0 : -L * 0.08);
  grp.add(cab);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, 0.08, L * (kind === 'bus' ? 0.9 : 0.5)), bodyMat);
  roof.position.set(0, 1.05 + cabH - 0.2, kind === 'bus' ? 0 : -L * 0.08);
  grp.add(roof);
  const wg = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 10);
  const wm = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.9});
  const hub = new THREE.MeshStandardMaterial({color: 0xc0c0c0, roughness: 0.3, metalness: 0.8});
  for (const [wx, wz] of [[-W / 2, L * 0.32], [W / 2, L * 0.32], [-W / 2, -L * 0.32], [W / 2, -L * 0.32]]) {
    const wh = new THREE.Mesh(wg, wm);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(wx, 0.36, wz);
    grp.add(wh);
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 8), hub);
    hb.rotation.z = Math.PI / 2;
    hb.position.set(wx, 0.36, wz);
    grp.add(hb);
  }
  const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.06), new THREE.MeshBasicMaterial({color: 0xfff2c0}));
  hl.position.set(-W / 2 + 0.3, 0.62, L / 2 + 0.01);
  grp.add(hl);
  const hl2 = hl.clone(); hl2.position.x = W / 2 - 0.3; grp.add(hl2);
  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), new THREE.MeshBasicMaterial({color: 0xff2020}));
  tl.position.set(-W / 2 + 0.3, 0.62, -L / 2 - 0.01);
  grp.add(tl);
  const tl2 = tl.clone(); tl2.position.x = W / 2 - 0.3; grp.add(tl2);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.6, 0.18, 0.05), darkMat);
  grille.position.set(0, 0.5, L / 2 + 0.01);
  grp.add(grille);
  if (m.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.4), darkMat);
    bar.position.set(0, 1.45, -L * 0.08);
    grp.add(bar);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.42), new THREE.MeshBasicMaterial({color: 0xff2020}));
    r.position.set(-0.28, 1.56, -L * 0.08);
    grp.add(r);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.42), new THREE.MeshBasicMaterial({color: 0x2040ff}));
    b.position.set(0.28, 1.56, -L * 0.08);
    grp.add(b);
    grp.userData.lightBar = [r, b];
  }
  if (kind === 'cab') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.3), new THREE.MeshBasicMaterial({color: 0xffe040}));
    sign.position.set(0, 1.62, -L * 0.08);
    grp.add(sign);
  }
  return grp;
}
export function createFleet(g) {
  const fleet = {
    list: [],
    spawn(kind, x, z, heading = 0, color) {
      const m = MAKES[kind] || MAKES.tide;
      const mesh = buildCarMesh(g, kind, color !== undefined ? color : m.color);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = heading;
      g.scene.add(mesh);
      const v = {
        kind, name: m.name, mesh, top: m.top, accel: m.accel, grip: m.grip,
        health: m.health, maxHealth: m.health, value: m.value, len: m.len,
        police: !!m.police, pos: mesh.position, heading, speed: 0, steer: 0,
        velocity: new THREE.Vector3(), parked: true, burning: false, burnT: 0,
        wrecked: false, driver: null, ai: null, color: color !== undefined ? color : m.color
      };
      fleet.list.push(v);
      return v;
    },
    remove(v) {
      const i = fleet.list.indexOf(v);
      if (i >= 0) fleet.list.splice(i, 1);
      g.scene.remove(v.mesh);
    },
    clear() {
      for (const v of fleet.list.slice()) fleet.remove(v);
    },
    nearest(x, z, maxD, filter) {
      let best = null, bd = maxD * maxD;
      for (const v of fleet.list) {
        if (filter && !filter(v)) continue;
        const dx = v.pos.x - x, dz = v.pos.z - z, d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = v; }
      }
      return best;
    },
    update(dt, inp) {
      for (const v of fleet.list) {
        if (v.ai) { v.ai(v, dt); continue; }
        if (v === g.player.vehicle) continue;
        if (v.parked) continue;
        g.carPhysics.step(v, {forward: false, back: false, left: false, right: false, brake: false, handbrake: false}, dt);
      }
      for (const v of fleet.list) {
        if (v.police && v.mesh.userData.lightBar) {
          const ph = Math.floor(g.time * 6) % 2;
          v.mesh.userData.lightBar[0].material.color.setHex(ph ? 0xff2020 : 0x601010);
          v.mesh.userData.lightBar[1].material.color.setHex(ph ? 0x101060 : 0x2040ff);
        }
      }
    }
  };
  g.fleet = fleet;
  return fleet;
}
