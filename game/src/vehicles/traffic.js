import { stepVehicle } from './carPhysics.js';
export function createTrafficSystem(game) {
  const { plan, fleet, rng } = game;
  const cars = [];
  const MAX_CARS = 26;
  const SPECS = ['comet', 'tide', 'coral', 'taxi', 'van'];
  function spawnNear(px, pz) {
    const j = plan.nearestJunction(px + rng.range(-160, 160), pz + rng.range(-160, 160));
    const next = plan.nextWander(j.id, j.id);
    const from = plan.byId.get(j.id);
    const to = plan.byId.get(next);
    if (!from || !to) return null;
    const spec = rng.pick(SPECS);
    const v = fleet.spawn(spec, from.x, from.z, Math.atan2(to.x - from.x, to.z - from.z));
    v.parked = false;
    const t = {
      vehicle: v, from: j.id, to: next,
      along: rng.range(0, 60),
      speed: rng.range(8, 14),
      targetSpeed: rng.range(8, 14),
    };
    cars.push(t);
    return t;
  }
  function populate() {
    const p = game.player;
    for (let i = cars.length; i < MAX_CARS; i++) spawnNear(p.position.x, p.position.z);
  }
  function spawnOnRoad(fromId, toId, along, spec, speed = 10) {
    const pt = plan.pointAlongRoad(fromId, toId, along);
    if (!pt) return null;
    const v = fleet.spawn(spec, pt.x, pt.z, pt.heading);
    v.parked = false;
    const t = { vehicle: v, from: fromId, to: toId, along, speed, targetSpeed: speed };
    cars.push(t);
    return t;
  }
  function clear() {
    for (const t of [...cars]) {
      if (!t.vehicle.missionKey && t.vehicle !== game.player.vehicle) {
        fleet.remove(t.vehicle);
        cars.splice(cars.indexOf(t), 1);
      }
    }
  }
  function step(dt) {
    const p = game.player;
    for (let i = cars.length - 1; i >= 0; i--) {
      const t = cars[i];
      const d = Math.hypot(t.vehicle.position.x - p.position.x, t.vehicle.position.z - p.position.z);
      if (d > 320 && !t.vehicle.missionKey) {
        fleet.remove(t.vehicle);
        cars.splice(i, 1);
      }
    }
    while (cars.length < MAX_CARS) {
      if (!spawnNear(p.position.x, p.position.z)) break;
    }
    for (const t of cars) {
      const v = t.vehicle;
      if (v.wrecked || v.burnTimer > 0) continue;
      const pt = plan.pointAlongRoad(t.from, t.to, t.along);
      if (!pt) continue;
      const dx = pt.x - v.position.x;
      const dz = pt.z - v.position.z;
      const wantHeading = Math.atan2(dx, dz);
      let dh = wantHeading - v.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const steer = Math.max(-1, Math.min(1, dh * 2.2));
      let target = t.targetSpeed;
      for (const o of cars) {
        if (o === t) continue;
        const odx = o.vehicle.position.x - v.position.x;
        const odz = o.vehicle.position.z - v.position.z;
        const ahead = odx * Math.sin(v.heading) + odz * Math.cos(v.heading);
        const side = Math.abs(odx * Math.cos(v.heading) - odz * Math.sin(v.heading));
        if (ahead > 0 && ahead < 14 && side < 3) target = Math.min(target, o.vehicle.speed * 0.8);
      }
      const forward = v.speed < target ? 1 : 0.2;
      stepVehicle(v, { forward, steer, handbrake: false }, dt, plan.groundHeight, game.collision);
      t.along += Math.max(0, v.speed) * dt;
      const segLen = Math.hypot(plan.byId.get(t.to).x - plan.byId.get(t.from).x, plan.byId.get(t.to).z - plan.byId.get(t.from).z);
      if (t.along >= segLen) {
        t.from = t.to;
        t.to = plan.nextWander(t.to, t.from);
        t.along = 0;
      }
    }
  }
  return { cars, populate, spawnOnRoad, clear, step };
}