import * as THREE from 'three';
export function createEffects(g) {
  const scene = g.scene;
  const tracers = [];
  const flashes = [];
  const parts = [];
  const tracerMat = new THREE.LineBasicMaterial({color: 0xffe080, transparent: true, opacity: 0.9});
  const flashMat = new THREE.MeshBasicMaterial({color: 0xffd070, transparent: true, opacity: 0.9});
  const smokeMat = new THREE.MeshBasicMaterial({color: 0x606060, transparent: true, opacity: 0.5});
  const ef = {
    tracer(from, to) {
      const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
      const line = new THREE.Line(geo, tracerMat.clone());
      scene.add(line);
      tracers.push({line, t: 0.07});
    },
    flash(pos) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), flashMat.clone());
      m.position.copy(pos);
      scene.add(m);
      flashes.push({m, t: 0.42});
    },
    sparks(x, y, z, n = 8) {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 3), new THREE.MeshBasicMaterial({color: 0xffc040}));
        m.position.set(x, y, z);
        m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6);
        scene.add(m);
        parts.push({m, t: 0.5});
      }
    },
    smoke(x, y, z, dt) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), smokeMat.clone());
      m.position.set(x + (Math.random() - 0.5), y + Math.random(), z + (Math.random() - 0.5));
      scene.add(m);
      parts.push({m, t: 1.2, grow: true});
    },
    explosion(x, y, z) {
      const cols = [0xfff0a0, 0xffb020, 0xff7010, 0xff4010, 0xffd070];
      for (let i = 0; i < 11; i++) {
        const r = 1 + Math.random() * 2.2;
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({color: cols[i % 5], transparent: true, opacity: 0.92}));
        m.position.set(x + (Math.random() - 0.5) * 4.5, y + 1 + Math.random() * 3.2, z + (Math.random() - 0.5) * 4.5);
        scene.add(m);
        const lt = 0.6 + Math.random() * 0.5;
        parts.push({m, t: lt, lt, o0: 0.92, grow: true, max: 1.3});
      }
      const light = new THREE.PointLight(0xff8030, 60, 45, 1.6);
      light.position.set(x, y + 2.5, z);
      scene.add(light);
      parts.push({m: light, t: 0.7, light: true});
      for (let i = 0; i < 26; i++) ef.sparks(x, y + 1, z, 1);
      if (g.chaseCamera) g.chaseCamera.addShake(0.6);
    },
    update(dt) {
      for (const t of tracers.slice()) {
        t.t -= dt;
        t.line.material.opacity = Math.max(0, t.t / 0.07) * 0.9;
        if (t.t <= 0) { scene.remove(t.line); t.line.geometry.dispose(); tracers.splice(tracers.indexOf(t), 1); }
      }
      for (const f of flashes.slice()) {
        f.t -= dt;
        f.m.material.opacity = Math.max(0, f.t / 0.42) * 0.9;
        if (f.t <= 0) { scene.remove(f.m); flashes.splice(flashes.indexOf(f), 1); }
      }
      for (const p of parts.slice()) {
        p.t -= dt;
        if (p.m.userData.v) {
          p.m.position.addScaledVector(p.m.userData.v, dt);
          p.m.userData.v.y -= 9 * dt;
        }
        if (p.grow) { const s = 1 + dt * (p.max || 1); p.m.scale.multiplyScalar(s); }
        if (p.light) { p.m.intensity = Math.max(0, 60 * (p.t / 0.7)); }
        else if (p.m.material && p.m.material.opacity !== undefined) p.m.material.opacity = (p.o0 !== undefined ? p.o0 : 0.5) * Math.max(0, p.t / (p.lt || 1.1));
        if (p.t <= 0) { scene.remove(p.m); parts.splice(parts.indexOf(p), 1); }
      }
    }
  };
  g.effects = ef;
  return ef;
}
