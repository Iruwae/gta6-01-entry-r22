import * as THREE from 'three';
const SHIRTS = [0xe04040, 0x40a0e0, 0x40c060, 0xe0a020, 0xc040a0, 0x808080, 0x20c0c0, 0xf0e0d0, 0x6040c0, 0xe08040];
const SKINS = [0xf0c8a0, 0xd8a070, 0xa07040, 0x8a5a30, 0xf0d8b8, 0xc89060];
export function buildFigure(g, shirt, pants, skin, opts = {}) {
  const grp = new THREE.Group();
  const sMat = new THREE.MeshStandardMaterial({color: shirt, roughness: 0.85});
  const pMat = new THREE.MeshStandardMaterial({color: pants, roughness: 0.9});
  const kMat = new THREE.MeshStandardMaterial({color: skin, roughness: 0.8});
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.28), sMat);
  torso.position.y = 1.22;
  torso.castShadow = true;
  grp.add(torso);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.3), new THREE.MeshStandardMaterial({color: 0xf0c040, roughness: 0.8}));
  stripe.position.y = 1.3;
  grp.add(stripe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), kMat);
  head.position.y = 1.68;
  head.castShadow = true;
  grp.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 6, 0, Math.PI * 2, 0, 1.4), new THREE.MeshStandardMaterial({color: opts.hair || 0x2a1a10, roughness: 0.95}));
  hair.position.y = 1.7;
  grp.add(hair);
  if (opts.cap) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.08, 10), new THREE.MeshStandardMaterial({color: opts.cap, roughness: 0.8}));
    cap.position.y = 1.84;
    grp.add(cap);
  }
  const armL = new THREE.Group(); armL.position.set(-0.3, 1.48, 0);
  const armLm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.58, 0.13), sMat);
  armLm.position.y = -0.29;
  armL.add(armLm);
  grp.add(armL);
  const armR = new THREE.Group(); armR.position.set(0.3, 1.48, 0);
  const armRm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.58, 0.13), sMat);
  armRm.position.y = -0.29;
  armR.add(armRm);
  grp.add(armR);
  const legL = new THREE.Group(); legL.position.set(-0.13, 0.92, 0);
  const legLm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.9, 0.17), pMat);
  legLm.position.y = -0.45;
  legL.add(legLm);
  grp.add(legL);
  const legR = new THREE.Group(); legR.position.set(0.13, 0.92, 0);
  const legRm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.9, 0.17), pMat);
  legRm.position.y = -0.45;
  legR.add(legRm);
  grp.add(legR);
  grp.userData = {armL, armR, legL, legR, torso, head};
  return grp;
}
export function createPlayer(g) {
  const rng = g.rng.fork('player');
  const mesh = buildFigure(g, 0x208080, 0x2a2a3a, 0xd8a070, {cap: 0x203040});
  mesh.position.set(-225, 0, -45);
  g.scene.add(mesh);
  const p = {
    mesh, pos: mesh.position, heading: 0, yaw: 0, pitch: 0,
    vel: new THREE.Vector3(), vy: 0, grounded: true,
    health: 100, armour: 0, money: 500, vehicle: null,
    god: false, dead: false, down: false,
    stats: {kills: 0, carsStolen: 0, copsEvaded: 0, earned: 0, metres: 0, fares: 0, robberies: 0, carsSold: 0, conches: 0},
    phase: 0, aiming: false, punching: 0,
    placeAt(x, z, heading = 0) {
      p.pos.set(x, g.plan.groundHeight(x, z), z);
      p.heading = heading;
      p.yaw = heading;
      p.vel.set(0, 0, 0);
      if (p.vehicle) { p.vehicle = null; }
      mesh.position.copy(p.pos);
      mesh.rotation.y = heading;
    },
    enterVehicle(v) {
      if (!v || v.wrecked) return false;
      if (v.driver && v.driver !== p) { v.driver = null; }
      p.vehicle = v;
      v.parked = false;
      v.driver = p;
      mesh.visible = false;
      g.bus.emit('enterVehicle', v);
      return true;
    },
    exitVehicle() {
      const v = p.vehicle;
      if (!v) return;
      const sx = v.pos.x + Math.cos(v.heading) * 2.4, sz = v.pos.z - Math.sin(v.heading) * 2.4;
      p.vehicle = null;
      v.driver = null;
      mesh.visible = true;
      const sp = Math.abs(v.speed);
      p.placeAt(sx, sz, v.heading);
      if (sp > 9) p.damage((sp - 9) * 1.6);
      if (v.health <= 0) p.damage(55);
      g.bus.emit('exitVehicle', v);
    },
    damage(amt) {
      if (p.god || p.dead) return;
      let a = amt;
      if (p.armour > 0) {
        const ab = Math.min(p.armour, a * 0.8);
        p.armour -= ab;
        a -= ab;
      }
      p.health -= a;
      if (p.health <= 0) { p.health = 0; p.die(); }
    },
    heal(amt) { p.health = Math.min(p.maxHealth(), p.health + amt); },
    maxHealth() { return 100 + (g.respect ? g.respect.rankIndex() : 0) * 5; },
    die() {
      if (p.god || p.dead) return;
      p.dead = true;
      p.down = true;
      g.bus.emit('wasted', {});
      if (g.menus) g.menus.showRespawn('WASTED');
    },
    busted() {
      if (p.god || p.dead) return;
      p.dead = true;
      g.bus.emit('busted', {});
      if (g.menus) g.menus.showRespawn('BUSTED');
    },
    respawn() {
      p.dead = false; p.down = false;
      p.health = p.maxHealth(); p.armour = 0;
      if (g.wanted) g.wanted.clear();
      p.placeAt(-225, -45, 0);
      if (g.menus) g.menus.hideRespawn();
    },
    update(dt, inp) {
      if (p.dead) return;
      const f = inp.fake || null;
      const fw = f ? f.forward : (inp.down('KeyW') || inp.down('ArrowUp'));
      const bw = f ? f.back : (inp.down('KeyS') || inp.down('ArrowDown'));
      const lf = f ? f.left : (inp.down('KeyA') || inp.down('ArrowLeft'));
      const rt = f ? f.right : (inp.down('KeyD') || inp.down('ArrowRight'));
      const run = inp.down('ShiftLeft') || inp.down('ShiftRight');
      const fire = f ? f.fire : (inp.down('Mouse0') || inp.down('KeyF'));
      if (p.vehicle) {
        const v = p.vehicle;
        const vin = {forward: fw, back: bw, left: lf, right: rt, brake: inp.down('Space'), handbrake: inp.down('KeyX')};
        g.carPhysics.step(v, vin, dt);
        p.pos.copy(v.pos);
        p.stats.metres += Math.abs(v.speed) * dt;
        if (inp.hit('KeyE') || f?.exit) p.exitVehicle();
        return;
      }
      p.yaw -= (inp.mx || 0) * 0.0026;
      p.pitch = Math.max(-0.32, Math.min(1.25, p.pitch + (inp.my || 0) * 0.0026));
      p.aiming = inp.down('Mouse1') || inp.down('KeyQ');
      const sp = p.aiming ? 4.05 : run ? 8.4 : fw || bw || lf || rt ? 5.4 : 2.4;
      let mx = (rt ? 1 : 0) - (lf ? 1 : 0);
      let mz = (fw ? 1 : 0) - (bw ? 1 : 0);
      const ml = Math.hypot(mx, mz) || 1;
      mx /= ml; mz /= ml;
      const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
      const vx = (mx * cos - mz * sin) * sp * (mz || mx ? 1 : 0);
      const vz = (mx * sin + mz * cos) * sp * (mz || mx ? 1 : 0);
      const moving = (mx !== 0 || mz !== 0);
      p.vel.x = vx; p.vel.z = vz;
      p.pos.x += vx * dt;
      p.pos.z += vz * dt;
      if (moving) p.heading = Math.atan2(vx, vz);
      const cp = {x: p.pos.x, z: p.pos.z};
      g.collision.resolveCircle(cp, 0.38, 0);
      p.pos.x = cp.x; p.pos.z = cp.z;
      const cl = g.plan.clampLand(p.pos.x, p.pos.z);
      p.pos.x = cl.x; p.pos.z = cl.z;
      if (inp.hit('Space') && p.grounded) { p.vy = 5.6; p.grounded = false; }
      if (!p.grounded) {
        p.vy -= 18 * dt;
        p.pos.y += p.vy * dt;
        if (p.pos.y <= g.plan.groundHeight(p.pos.x, p.pos.z)) { p.pos.y = g.plan.groundHeight(p.pos.x, p.pos.z); p.vy = 0; p.grounded = true; }
      } else {
        p.pos.y = g.plan.groundHeight(p.pos.x, p.pos.z);
      }
      if (moving) p.phase += 3.1 * sp * dt;
      const u = mesh.userData;
      const sw = moving ? Math.sin(p.phase) * 0.55 : 0;
      u.legL.rotation.x = sw;
      u.legR.rotation.x = -sw;
      u.armL.rotation.x = -sw * 0.8;
      u.armR.rotation.x = sw * 0.8;
      if (p.aiming) { u.armL.rotation.x = -1.3; u.armR.rotation.x = -1.3; }
      if (p.punching > 0) { p.punching -= dt; u.armR.rotation.x = -1.8 + Math.sin(p.punching * 20) * 0.3; }
      mesh.position.copy(p.pos);
      mesh.rotation.y = p.heading;
      if (fire && g.combat) g.combat.tryFire(dt);
      if (inp.hit('KeyE')) {
        const v = g.fleet.nearest(p.pos.x, p.pos.z, 2.6, (vv) => !vv.wrecked);
        if (v) {
          if (v.driver && v.driver !== p) {
            const d = v.driver;
            if (d.npc) { d.state = 'flee'; d.panic = 12; }
            v.driver = null;
          }
          p.enterVehicle(v);
          p.stats.carsStolen++;
          if (g.wanted) g.wanted.addHeat(4, p.pos.x, p.pos.z);
        }
      }
      if (inp.hit('KeyV') && g.combat) g.combat.punch();
    }
  };
  g.player = p;
  return p;
}
