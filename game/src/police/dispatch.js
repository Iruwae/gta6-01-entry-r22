import * as THREE from 'three';
import { stepVehicle } from '../vehicles/carPhysics.js';
const UNIT_NAMES = ['TIDE-12', 'SURF-07', 'REEF-22', 'CORAL-48', 'PIER-05', 'TIDE-02', 'SURF-31', 'REEF-09', 'CORAL-85', 'PIER-14', 'TIDE-37', 'SURF-19'];
const TACTICS = ['RAMMING', 'FLANKING', 'FIRING', 'PURSUIT', 'CLOSING IN'];
export function createPoliceDispatch(game) {
  const { plan, fleet, rng, scene } = game;
  const units = [];
  const rb = [];
  let nameIdx = 0;
  const hg = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.6, 2.2), new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.5 }));
    hg.add(body);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 2), new THREE.MeshStandardMaterial({ color: 0x9fd4ff, roughness: 0.2, metalness: 0.6 }));
    glass.position.set(1.4, 0.2, 0);
    hg.add(glass);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.6), new THREE.MeshStandardMaterial({ color: 0x1a1d24 }));
    rotor.position.y = 1.1;
    hg.add(rotor);
    hg.userData.rotor = rotor;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x2a4a6a }));
    tail.position.set(-3.6, 0.3, 0);
    hg.add(tail);
    const coneGeo = new THREE.ConeGeometry(9, 26, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = -14;
    cone.rotation.x = Math.PI;
    hg.add(cone);
    const spot = new THREE.SpotLight(0xfff2c8, 60, 60, 0.5, 0.5);
    spot.position.set(0, -1, 0);
    spot.target.position.set(0, -26, 0);
    hg.add(spot);
    hg.add(spot.target);
    hg.visible = false;
    scene.add(hg);
  }
  const hel = {
    group: hg,
    position: { x: 0, y: 40, z: 0 },
    active: false,
    placeNear(player, back = 0.25) {
      hel.position.x = player.position.x - Math.sin(player.heading) * 40 * back - 6;
      hel.position.z = player.position.z - Math.cos(player.heading) * 40 * back - 4;
      hel.position.y = 42;
      hel.active = true;
      hg.visible = true;
    },
    aimAt(player) {
      hg.lookAt(player.position.x, 0, player.position.z);
    },
    fireAt(player) {
      game.bus.emit('gunfire', { from: 'heli', at: player.position });
    },
    step(dt, time) {
      if (!hel.active) return;
      hg.userData.rotor.rotation.y += dt * 22;
      const p = game.player;
      const tx = p.position.x - Math.sin(p.heading) * 10;
      const tz = p.position.z - Math.cos(p.heading) * 10;
      hel.position.x += (tx - hel.position.x) * Math.min(1, dt * 0.8);
      hel.position.z += (tz - hel.position.z) * Math.min(1, dt * 0.8);
      hg.position.set(hel.position.x, 42 + Math.sin(time * 0.8) * 1.5, hel.position.z);
      hg.lookAt(p.position.x, 0, p.position.z);
    },
    hide() { hel.active = false; hg.visible = false; },
  };
  function spawnUnit(specKey = 'interceptor') {
    const hq = plan.placeById.get('hq');
    const v = fleet.spawn(specKey, hq.x + rng.range(-10, 10), hq.z + rng.range(-10, 10), rng.range(0, 6));
    v.parked = false;
    const unit = {
      vehicle: v,
      name: UNIT_NAMES[nameIdx++ % UNIT_NAMES.length],
      tactic: rng.pick(TACTICS),
      from: plan.nearestJunction(v.position.x, v.position.z).id,
      to: plan.nearestJunction(game.player.position.x, game.player.position.z).id,
      along: 0,
      searchX: 0,
      searchZ: 0,
    };
    units.push(unit);
    return unit;
  }
  function takeUpPursuit(v) {
    const unit = {
      vehicle: v,
      name: UNIT_NAMES[nameIdx++ % UNIT_NAMES.length],
      tactic: 'RAMMING',
      from: plan.nearestJunction(v.position.x, v.position.z).id,
      to: plan.nearestJunction(game.player.position.x, game.player.position.z).id,
      along: 0,
      searchX: 0,
      searchZ: 0,
    };
    units.push(unit);
    return unit;
  }
  function clearUnits() {
    for (const u of [...units]) {
      fleet.remove(u.vehicle);
      units.splice(units.indexOf(u), 1);
    }
    hel.hide();
    for (const r of [...rb]) {
      scene.remove(r.mesh);
      rb.splice(rb.indexOf(r), 1);
    }
  }
  function placeRoadblock(count = 1) {
    const p = game.player;
    const ahead = plan.nearestJunction(p.position.x + Math.sin(p.heading) * 120, p.position.z + Math.cos(p.heading) * 120);
    for (let i = 0; i < count; i++) {
      const x = ahead.x + rng.range(-14, 14);
      const z = ahead.z + rng.range(-14, 14);
      const mesh = new THREE.Group();
      const car = fleet.spawn('bulwark', x, z, rng.range(0, 6));
      car.parked = true;
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 0.4), new THREE.MeshStandardMaterial({ color: 0xff7a2e }));
      barrier.position.set(x, 1, z);
      barrier.rotation.y = rng.range(0, 3);
      scene.add(barrier);
      mesh.add(barrier);
      rb.push({ x, z, mesh: barrier, vehicle: car });
      game.bus.emit('roadblock', { x, z });
    }
  }
  function rowsForHud() {
    return units.slice(0, 5).map((u) => {
      const d = Math.round(Math.hypot(u.vehicle.position.x - game.player.position.x, u.vehicle.position.z - game.player.position.z));
      return { name: u.name, dist: d, tactic: u.tactic };
    });
  }
  function step(dt) {
    const wanted = game.wanted.level;
    const wantUnits = wanted === 0 ? 0 : [0, 1, 2, 3, 4, 6][wanted];
    while (units.length < wantUnits) spawnUnit(rng.chance(0.25) ? 'bulwark' : 'interceptor');
    while (units.length > wantUnits) {
      const u = units.pop();
      fleet.remove(u.vehicle);
    }
    if (wanted >= 4) hel.active = true, hel.group.visible = true;
    else if (wanted < 4) hel.hide();
    if (wanted >= 3 && rb.length === 0) placeRoadblock(1);
    if (wanted < 3) {
      for (const r of [...rb]) { scene.remove(r.mesh); fleet.remove(r.vehicle); rb.splice(rb.indexOf(r), 1); }
    }
    const p = game.player;
    let anySees = false;
    for (const u of units) {
      const v = u.vehicle;
      if (v.wrecked) continue;
      const target = p.vehicle || p;
      const tp = p.vehicle ? p.vehicle.position : p.position;
      const dx = tp.x - v.position.x;
      const dz = tp.z - v.position.z;
      const dist = Math.hypot(dx, dz);
      const sees = dist < 90 && game.collision.lineOfSight(v.position.x, v.position.z, tp.x, tp.z, 2);
      if (sees) anySees = true;
      if (u.tactic === 'FLANKING' && dist > 40) {
        const j = plan.nearestJunction(tp.x + 90, tp.z);
        u.to = j.id;
      } else {
        u.to = plan.pursuitNext(u.from, u.to, tp.x, tp.z);
      }
      const pt = plan.pointAlongRoad(u.from, u.to, u.along);
      if (!pt) { u.from = u.to; u.along = 0; continue; }
      const wantHeading = Math.atan2(pt.x - v.position.x, pt.z - v.position.z);
      let dh = wantHeading - v.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const steer = Math.max(-1, Math.min(1, dh * 2.4));
      let forward = 1;
      if (u.tactic === 'RAMMING' && dist < 8) forward = 1;
      else if (dist < 6) forward = 0.4;
      stepVehicle(v, { forward, steer, handbrake: false }, dt, plan.groundHeight, game.collision);
      u.along += Math.max(0, v.speed) * dt;
      const segLen = Math.hypot(plan.byId.get(u.to).x - plan.byId.get(u.from).x, plan.byId.get(u.to).z - plan.byId.get(u.from).z);
      if (u.along >= segLen) { u.from = u.to; u.along = 0; }
      if (p.vehicle && dist < 3.6) {
        p.vehicle.condition = Math.max(0, p.vehicle.condition - 14 * dt);
        p.vehicle.health = Math.max(0, p.vehicle.health - 10 * dt);
        v.velocity.x *= 0.6; v.velocity.z *= 0.6;
      }
      if (u.tactic === 'FIRING' && dist < 30 && sees && rng.chance(dt * 0.5)) {
        game.combat.npcShoot(v.position, tp, 6);
      }
    }
    hel.step(dt, game.time);
    return anySees;
  }
  return { units, rb, helicopter: hel, spawnUnit, takeUpPursuit, clearUnits, placeRoadblock, rowsForHud, step };
}