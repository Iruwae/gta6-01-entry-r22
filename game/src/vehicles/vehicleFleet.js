import * as THREE from 'three';
import { createVehicle, CAR_SPECS } from './carPhysics.js';
const bodyMatCache = new Map();
function bodyMat(color) {
  if (!bodyMatCache.has(color)) {
    bodyMatCache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55 }));
  }
  return bodyMatCache.get(color);
}
const glassMat = new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.15, metalness: 0.7 });
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.9 });
const lightRed = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
const lightBlue = new THREE.MeshBasicMaterial({ color: 0x2a7aff });
export function createVehicleMesh(v) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.62, 4.4), bodyMat(v.color));
  body.position.y = 0.62; body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.2), glassMat);
  cabin.position.set(0, 1.15, -0.2); cabin.castShadow = true;
  g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.36, wz);
    g.add(w);
  }
  if (v.specKey === 'interceptor' || v.specKey === 'bulwark') {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.4), lightRed);
    bar.position.set(-0.28, 1.5, -0.2);
    g.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.4), lightBlue);
    bar2.position.set(0.28, 1.5, -0.2);
    g.add(bar2);
    g.userData.lightBar = [bar, bar2];
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 4.42), new THREE.MeshBasicMaterial({ color: 0x1a2a4a }));
    stripe.position.y = 0.62;
    g.add(stripe);
  }
  const hl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  hl.position.set(0, 0.72, 2.22);
  g.add(hl);
  const tl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
  tl.position.set(0, 0.72, -2.22);
  g.add(tl);
  g.userData.vehicle = v;
  return g;
}
export function createFleet(scene, plan, rng) {
  const vehicles = [];
  const meshes = new Map();
  const specs = Object.keys(CAR_SPECS).filter((k) => !['interceptor', 'bulwark'].includes(k));
  function spawn(specKey, x, z, heading = 0, missionKey = null) {
    const v = createVehicle(specKey, x, z, heading);
    v.missionKey = missionKey;
    const mesh = createVehicleMesh(v);
    mesh.position.set(x, plan.groundHeight(x, z), z);
    mesh.rotation.y = heading;
    scene.add(mesh);
    vehicles.push(v);
    meshes.set(v, mesh);
    return v;
  }
  function remove(v) {
    const m = meshes.get(v);
    if (m) { scene.remove(m); meshes.delete(v); }
    const i = vehicles.indexOf(v);
    if (i >= 0) vehicles.splice(i, 1);
  }
  function parkRandom(n, avoid) {
    for (let i = 0; i < n; i++) {
      const j = rng.pick(plan.junctions.filter((jj) => !jj.island));
      const to = plan.nextWander(j.id, j.id);
      const pt = plan.pointAlongRoad(j.id, to, rng.range(15, 70));
      if (!pt) continue;
      if (avoid && Math.hypot(pt.x - avoid.x, pt.z - avoid.z) < 25) continue;
      const v = spawn(rng.pick(specs), pt.x, pt.z, pt.heading);
      v.parked = true;
    }
  }
  function explode(v) {
    v.burnTimer = 6;
    v.health = Math.max(0, v.health - 40);
    return v;
  }
  function sync(dt, time) {
    for (const v of vehicles) {
      const m = meshes.get(v);
      if (!m) continue;
      m.position.set(v.position.x, (v.y ?? 0) + 0.02, v.position.z);
      m.rotation.y = v.heading;
      if (m.userData.lightBar) {
        const phase = Math.floor(time * 6) % 2 === 0;
        m.userData.lightBar[0].material = phase ? lightRed : lightBlue;
        m.userData.lightBar[1].material = phase ? lightBlue : lightRed;
      }
      if (v.burnTimer > 0) {
        const s = 1 + Math.sin(time * 20) * 0.02;
        m.scale.set(s, s, s);
      }
    }
  }
  function nearestEnterable(x, z, maxD = 4) {
    let best = null;
    let bestD = maxD;
    for (const v of vehicles) {
      const d = Math.hypot(v.position.x - x, v.position.z - z);
      if (d < bestD) { bestD = d; best = v; }
    }
    return best;
  }
  return { vehicles, meshes, spawn, remove, parkRandom, explode, sync, nearestEnterable };
}