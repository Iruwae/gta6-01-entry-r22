import * as THREE from 'three';
const MIX = [['tide', 5], ['fizz', 4], ['cab', 3], ['hauler', 2], ['vanette', 2], ['brava', 2], ['sprint', 1], ['bus', 1]];
export function createTraffic(g) {
  const rng = g.rng.fork('traffic');
  let timer = 0;
  const pickKind = () => {
    if (rng.chance(0.07)) return 'interceptor';
    let total = 0;
    for (const [, w] of MIX) total += w;
    let r = rng.float(0, total);
    for (const [k, w] of MIX) { r -= w; if (r <= 0) return k; }
    return 'tide';
  };
  const aiDrive = (v, dt) => {
    if (!v.aiTarget || v.aiWait > 0) {
      v.aiWait -= dt;
      if (v.aiWait <= 0) {
        const jn = g.plan.nearestJunction(v.pos.x, v.pos.z);
        const opts = [];
        for (const o of g.plan.junctions) {
          const dx = o.x - jn.x, dz = o.z - jn.z;
          if ((Math.abs(dx) === 90 && dz === 0) || (Math.abs(dz) === 90 && dx === 0)) opts.push(o);
        }
        if (opts.length) {
          const t = rng.pick(opts);
          v.aiTarget = t;
          v.aiLane = rng.chance(0.5) ? 2.7 : -2.7;
        }
      }
      return;
    }
    const t = v.aiTarget;
    const dx = t.x - v.pos.x, dz = t.z - v.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 6) { v.aiTarget = null; v.aiWait = rng.float(0, 1.5); return; }
    const want = Math.atan2(dx, dz);
    let dh = want - v.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    const inp = {forward: true, back: false, left: dh > 0.08, right: dh < -0.08, brake: Math.abs(dh) > 0.9, handbrake: false};
    const cruise = v.cruise || 11;
    if (Math.abs(v.speed) > cruise) inp.forward = false;
    if (v.panicT > 0) { v.panicT -= dt; inp.forward = true; }
    g.carPhysics.step(v, inp, dt);
  };
  const traffic = {
    moving: [], parked: [],
    populate() {
      for (let i = 0; i < 24; i++) traffic.spawnMoving(true);
      for (let i = 0; i < 18; i++) traffic.spawnParked(true);
    },
    spawnMoving(init) {
      const p = g.player.pos;
      const a = rng.float(0, Math.PI * 2);
      const d = init ? rng.float(28, 210) : rng.float(80, 200);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      const jn = g.plan.nearestJunction(x, z);
      const kind = pickKind();
      const v = g.fleet.spawn(kind, jn.x + rng.float(-6, 6), jn.z + rng.float(-6, 6), rng.float(0, Math.PI * 2));
      v.parked = false;
      v.cruise = rng.float(9.5, 13.5);
      v.speed = 8;
      v.ai = aiDrive;
      v.aiTarget = null; v.aiWait = 0; v.panicT = 0;
      traffic.moving.push(v);
      return v;
    },
    spawnParked(init) {
      const p = g.player.pos;
      const a = rng.float(0, Math.PI * 2);
      const d = init ? rng.float(14, 190) : rng.float(80, 190);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      const jn = g.plan.nearestJunction(x, z);
      const v = g.fleet.spawn(pickKind(), jn.x + rng.float(-8, 8), jn.z + rng.float(-8, 8), rng.float(0, Math.PI * 2));
      v.parked = true;
      traffic.parked.push(v);
      return v;
    },
    panic(x, z, radius) {
      for (const v of traffic.moving) {
        if (Math.hypot(v.pos.x - x, v.pos.z - z) < radius) v.panicT = 10;
      }
      for (const v of traffic.parked) {
        if (Math.hypot(v.pos.x - x, v.pos.z - z) < radius * 0.6) { v.parked = false; v.cruise = 13; v.ai = aiDrive; v.panicT = 10; traffic.moving.push(v); traffic.parked.splice(traffic.parked.indexOf(v), 1); }
      }
    },
    clear() {
      for (const v of traffic.moving.slice()) g.fleet.remove(v);
      for (const v of traffic.parked.slice()) g.fleet.remove(v);
      traffic.moving.length = 0;
      traffic.parked.length = 0;
    },
    update(dt) {
      timer += dt;
      if (timer > 0.2) {
        timer = 0;
        const p = g.player.pos;
        for (const v of traffic.moving.slice()) {
          const d = Math.hypot(v.pos.x - p.x, v.pos.z - p.z);
          if (d > 250 || v.wrecked) { g.fleet.remove(v); traffic.moving.splice(traffic.moving.indexOf(v), 1); }
        }
        for (const v of traffic.parked.slice()) {
          const d = Math.hypot(v.pos.x - p.x, v.pos.z - p.z);
          if (d > 215 || v.wrecked) { g.fleet.remove(v); traffic.parked.splice(traffic.parked.indexOf(v), 1); }
        }
        let tries = 0;
        while (traffic.moving.length < 24 && tries++ < 20) traffic.spawnMoving(false);
        while (traffic.parked.length < 18 && tries++ < 20) traffic.spawnParked(false);
      }
    }
  };
  g.traffic = traffic;
  return traffic;
}
