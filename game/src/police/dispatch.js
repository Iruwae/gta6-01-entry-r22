import * as THREE from 'three';
const NAMES = ['TIDE-12', 'SURF-07', 'REEF-22', 'GULL-04', 'CORAL-19', 'BAY-31'];
const TACTICS = ['FLANKING', 'FIRING', 'RAMMING', 'CLOSING IN', 'ROADBLOCK', 'SPOTLIGHT'];
const vp = (v) => v.pos || v.position;
export function createDispatch(g) {
  const rng = g.rng.fork('dispatch');
  const d = {
    units: [],
    heli: null, heliT: 0, rbT: 0, roadblock: null, spawnT: 0,
    spawnUnit(kind = 'interceptor') {
      const p = g.player.pos;
      const a = rng.float(0, Math.PI * 2);
      const dd = rng.float(110, 200);
      const x = p.x + Math.cos(a) * dd, z = p.z + Math.sin(a) * dd;
      const jn = g.plan.nearestJunction(x, z);
      const v = g.fleet.spawn(kind, jn.x, jn.z, rng.float(0, Math.PI * 2));
      v.parked = false;
      v.cruise = 16;
      const u = {
        name: NAMES[d.units.length % NAMES.length],
        tactic: rng.pick(TACTICS),
        vehicle: v, from: jn, to: jn, along: 0, stuckT: 0, revT: 0,
        dist() { return Math.round(Math.hypot(vp(v).x - p.x, vp(v).z - p.z)); }
      };
      v.ai = (vv, dt) => d.driveUnit(u, dt);
      d.units.push(u);
      return u;
    },
    driveUnit(u, dt) {
      const v = u.vehicle;
      const p = g.player.pos;
      const dist = Math.hypot(vp(v).x - p.x, vp(v).z - p.z);
      if (dist > 300) { d.removeUnit(u); return; }
      const lead = 0.9;
      const tx = p.x + (g.player.vehicle ? g.player.vehicle.velocity.x * lead : 0);
      const tz = p.z + (g.player.vehicle ? g.player.vehicle.velocity.z * lead : 0);
      const want = Math.atan2(tx - vp(v).x, tz - vp(v).z);
      let dh = want - v.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const inp = {forward: true, back: false, left: dh > 0.1, right: dh < -0.1, brake: Math.abs(dh) > 1.1, handbrake: false};
      if (dist < 12 && u.tactic === 'RAMMING') inp.forward = true;
      if (u.revT > 0) { u.revT -= dt; inp.forward = false; inp.back = true; }
      else if (Math.abs(v.speed) < 0.5) { u.stuckT += dt; if (u.stuckT > 2.2) { u.revT = 1.3; u.stuckT = 0; } }
      else u.stuckT = 0;
      g.carPhysics.step(v, inp, dt);
      if (dist < 4 && g.player.vehicle) {
        g.carPhysics.damage(g.player.vehicle, 8 * dt * 10);
      }
    },
    removeUnit(u) {
      const i = d.units.indexOf(u);
      if (i >= 0) d.units.splice(i, 1);
      g.fleet.remove(u.vehicle);
    },
    clear() {
      for (const u of d.units.slice()) d.removeUnit(u);
      if (d.heli) { g.scene.remove(d.heli.mesh); d.heli = null; }
      if (d.roadblock) { for (const v of d.roadblock) g.fleet.remove(v); d.roadblock = null; }
    },
    update(dt) {
      const stars = g.wanted ? g.wanted.stars : 0;
      const want = [0, 1, 2, 3, 4, 5][stars];
      d.spawnT -= dt;
      if (d.units.length < want && d.spawnT <= 0) {
        d.spawnT = Math.max(1.2, 4.5 - 0.6 * stars);
        d.spawnUnit(stars >= 4 ? 'bulwark' : 'interceptor');
      }
      while (d.units.length > want) d.removeUnit(d.units[d.units.length - 1]);
      if (stars >= 3 && !d.heli) {
        const mesh = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 8), new THREE.MeshStandardMaterial({color: 0x2a3a4a, roughness: 0.5}));
        mesh.add(body);
        const rotor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.12, 0.5), new THREE.MeshStandardMaterial({color: 0x1a1a1a}));
        rotor.position.y = 1;
        mesh.add(rotor);
        mesh.userData.rotor = rotor;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 30, 12, 1, true), new THREE.MeshBasicMaterial({color: 0xfff2c0, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false}));
        cone.rotation.x = Math.PI;
        cone.position.y = -15;
        mesh.add(cone);
        mesh.position.set(g.player.pos.x + 260, 90, g.player.pos.z - 200);
        g.scene.add(mesh);
        d.heli = {mesh, a: 0, shots: 0, cd: 0};
      }
      if (d.heli) {
        if (stars < 3) { g.scene.remove(d.heli.mesh); d.heli = null; }
        else {
          const h = d.heli;
          h.a += dt * 0.32;
          const p = g.player.pos;
          h.mesh.position.set(p.x + Math.cos(h.a) * 30, 24, p.z + Math.sin(h.a) * 30);
          h.mesh.lookAt(p.x, 0, p.z);
          h.mesh.userData.rotor.rotation.y += dt * 34;
          h.cd -= dt;
          if (stars >= 4 && h.cd <= 0 && Math.hypot(h.mesh.position.x - p.x, h.mesh.position.z - p.z) < 60) {
            h.cd = stars >= 5 ? 0.22 : 0.4;
            h.shots++;
            if (h.shots % 9 === 0) h.cd += 2.4;
            if (g.effects) g.effects.tracer(h.mesh.position, p.clone().add(new THREE.Vector3(0, 1, 0)));
            if (Math.random() < 0.3) g.player.damage(8);
          }
        }
      }
      d.rbT -= dt;
      if (stars >= 3 && !d.roadblock && d.rbT <= 0) {
        d.rbT = 16;
        const p = g.player.pos;
        const hd = g.player.vehicle ? g.player.vehicle.heading : g.player.heading;
        const bx = p.x + Math.sin(hd) * 140, bz = p.z + Math.cos(hd) * 140;
        const jn = g.plan.nearestJunction(bx, bz);
        const v1 = g.fleet.spawn('interceptor', jn.x - 6, jn.z, hd + Math.PI / 2);
        const v2 = g.fleet.spawn('interceptor', jn.x + 6, jn.z, hd + Math.PI / 2);
        v1.parked = true; v2.parked = true;
        d.roadblock = [v1, v2];
        if (g.hud) g.hud.notify('Roadblock ahead');
      }
      if (d.roadblock) {
        const p = g.player.pos;
        const rp0 = vp(d.roadblock[0]);
        const dd = Math.hypot(rp0.x - p.x, rp0.z - p.z);
        if (dd < 14 || stars < 3) {
          for (const v of d.roadblock) g.fleet.remove(v);
          d.roadblock = null;
        }
      }
    }
  };
  g.dispatch = d;
  return d;
}
