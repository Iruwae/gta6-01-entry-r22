import * as THREE from 'three';
import {buildFigure} from './player.js';
const SHIRTS = [0xe04040, 0x40a0e0, 0x40c060, 0xe0a020, 0xc040a0, 0x808080, 0x20c0c0, 0xf0e0d0, 0x6040c0, 0xe08040];
const PANTS = [0x2a2a3a, 0x3a3a4a, 0x5a4a3a, 0x2a4a2a, 0x6a6a6a];
const SKINS = [0xf0c8a0, 0xd8a070, 0xa07040, 0x8a5a30, 0xf0d8b8, 0xc89060];
export function createPedestrians(g) {
  const rng = g.rng.fork('peds');
  let timer = 0;
  const peds = {
    npcs: [],
    spawn(x, z, kind = 'civilian') {
      const shirt = rng.pick(SHIRTS);
      const mesh = buildFigure(g, shirt, rng.pick(PANTS), rng.pick(SKINS), {cap: rng.chance(0.18) ? rng.pick(SHIRTS) : null});
      mesh.position.set(x, g.plan.groundHeight(x, z), z);
      g.scene.add(mesh);
      const n = {
        mesh, pos: mesh.position, kind, npc: true, state: kind === 'guard' ? 'guard' : 'walk',
        heading: rng.float(0, Math.PI * 2), speed: rng.float(1.25, 1.9),
        health: kind === 'guard' ? 130 : 100, panic: 0, cower: false,
        target: null, wanderT: rng.float(2, 6), fightT: 0, dead: false, deadT: 0,
        cash: kind === 'guard' ? 0 : rng.int(8, 90), phase: rng.float(0, 6)
      };
      peds.npcs.push(n);
      return n;
    },
    clear() {
      for (const n of peds.npcs) g.scene.remove(n.mesh);
      peds.npcs.length = 0;
    },
    populate() {
      for (let i = 0; i < 34; i++) {
        const a = rng.float(0, Math.PI * 2);
        const d = rng.float(6, 120);
        const x = g.player.pos.x + Math.cos(a) * d, z = g.player.pos.z + Math.sin(a) * d;
        const cl = g.plan.clampLand(x, z);
        peds.spawn(cl.x, cl.z, 'civilian');
      }
    },
    alarm(x, z, radius, threat) {
      for (const n of peds.npcs) {
        if (n.dead || n.kind === 'guard') continue;
        if (Math.hypot(n.pos.x - x, n.pos.z - z) < radius) {
          n.panic = rng.float(8, 14);
          n.state = rng.chance(0.14) ? 'cower' : 'flee';
          n.target = threat || {x, z};
        }
      }
    },
    kill(n, byPlayer) {
      if (n.dead) return;
      n.dead = true;
      n.deadT = 22;
      n.state = 'down';
      n.mesh.rotation.x = Math.PI / 2;
      n.mesh.position.y = 0.3;
      if (byPlayer) {
        g.player.stats.kills++;
        if (g.wanted) g.wanted.addHeat(n.kind === 'guard' ? 16 : 14, n.pos.x, n.pos.z);
        if (g.respect) g.respect.add(4);
      }
      peds.alarm(n.pos.x, n.pos.z, 22, g.player.pos);
    },
    update(dt) {
      timer += dt;
      if (timer > 0.15) {
        timer = 0;
        const p = g.player.pos;
        for (const n of peds.npcs.slice()) {
          const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z);
          if (n.dead) {
            n.deadT -= 0.15;
            if (n.deadT <= 0 || d > 120) { g.scene.remove(n.mesh); peds.npcs.splice(peds.npcs.indexOf(n), 1); }
            continue;
          }
          if (d > 150) { g.scene.remove(n.mesh); peds.npcs.splice(peds.npcs.indexOf(n), 1); }
        }
        let tries = 0;
        while (peds.npcs.filter(n => n.kind === 'civilian').length < 34 && tries++ < 10) {
          const a = rng.float(0, Math.PI * 2);
          const dd = rng.float(45, 125);
          const x = p.x + Math.cos(a) * dd, z = p.z + Math.sin(a) * dd;
          const cl = g.plan.clampLand(x, z);
          peds.spawn(cl.x, cl.z, 'civilian');
        }
      }
      for (const n of peds.npcs) {
        if (n.dead) continue;
        if (n.panic > 0) n.panic -= dt;
        const p = g.player.pos;
        let sp = 0, mvx = 0, mvz = 0;
        if (n.state === 'flee' && n.panic > 0) {
          const dx = n.pos.x - p.x, dz = n.pos.z - p.z;
          const d = Math.hypot(dx, dz) || 1;
          mvx = dx / d; mvz = dz / d; sp = 6.4;
          n.heading = Math.atan2(mvx, mvz);
        } else if (n.state === 'cower') {
          sp = 0;
        } else if (n.state === 'fight' && n.target) {
          const dx = n.target.x - n.pos.x, dz = n.target.z - n.pos.z;
          const d = Math.hypot(dx, dz) || 1;
          if (d < 1.2) {
            n.fightT -= dt;
            if (n.fightT <= 0) { n.fightT = 0.9; if (g.player) g.player.damage(7); }
          } else { mvx = dx / d; mvz = dz / d; sp = 5; n.heading = Math.atan2(mvx, mvz); }
        } else if (n.state === 'guard') {
          sp = 0;
          const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z);
          if (d < 34 && g.combat) { n.heading = Math.atan2(p.x - n.pos.x, p.z - n.pos.z); }
        } else {
          n.wanderT -= dt;
          if (n.wanderT <= 0) { n.wanderT = rng.float(3, 8); n.heading = rng.float(0, Math.PI * 2); }
          mvx = Math.sin(n.heading); mvz = Math.cos(n.heading); sp = n.speed;
          for (const v of g.fleet.list) {
            if (v.parked || Math.abs(v.speed) < 6) continue;
            const dx = n.pos.x - v.pos.x, dz = n.pos.z - v.pos.z;
            const d = Math.hypot(dx, dz);
            if (d < 12) {
              const fx = Math.sin(v.heading), fz = Math.cos(v.heading);
              const dot = dx * fx + dz * fz;
              if (dot > 0 && dot < 11 && Math.abs(dx * fz - dz * fx) < 2.2) {
                mvx = -fz; mvz = fx; sp = 7;
                n.heading = Math.atan2(mvx, mvz);
                break;
              }
            }
          }
        }
        if (sp > 0) {
          n.pos.x += mvx * sp * dt;
          n.pos.z += mvz * sp * dt;
          const cp = {x: n.pos.x, z: n.pos.z};
          g.collision.resolveCircle(cp, 0.36, 0);
          n.pos.x = cp.x; n.pos.z = cp.z;
          n.phase += 3.1 * sp * dt;
        }
        n.pos.y = g.plan.groundHeight(n.pos.x, n.pos.z);
        const u = n.mesh.userData;
        const sw = sp > 0 ? Math.sin(n.phase) * 0.5 : 0;
        u.legL.rotation.x = sw;
        u.legR.rotation.x = -sw;
        u.armL.rotation.x = -sw * 0.8;
        u.armR.rotation.x = sw * 0.8;
        if (n.state === 'cower') { u.armL.rotation.x = -2.6; u.armR.rotation.x = -2.6; n.mesh.scale.y = 0.85; }
        else n.mesh.scale.y = 1;
        n.mesh.position.copy(n.pos);
        n.mesh.rotation.y = n.heading;
      }
    }
  };
  g.pedestrians = peds;
  return peds;
}
