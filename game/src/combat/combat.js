import * as THREE from 'three';
import {WEAPONS} from './weapons.js';
export function createCombat(g) {
  let cd = 0, groupCd = 0;
  const ray = new THREE.Raycaster();
  const combat = {
    explodeAt(pos) {
      if (g.effects) g.effects.explosion(pos.x, 1.5, pos.z);
      combat.onExplosion(pos.x, pos.z, 9, 260);
      if (g.audio) g.audio.boom(g.player.pos);
      if (g.pedestrians) g.pedestrians.alarm(pos.x, pos.z, 70, g.player.pos);
      if (g.traffic) g.traffic.panic(pos.x, pos.z, 80);
      if (g.wanted) g.wanted.addHeat(26, pos.x, pos.z);
    },
    onExplosion(x, z, radius, dmg) {
      const p = g.player;
      const dp = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (dp < radius && !p.vehicle) p.damage(dmg * (1 - dp / radius));
      else if (dp < radius && p.vehicle) g.carPhysics.damage(p.vehicle, dmg * 0.5);
      for (const v of g.fleet.list) {
        if (Math.hypot(v.pos.x - x, v.pos.z - z) < radius) g.carPhysics.damage(v, dmg);
      }
      for (const n of g.pedestrians.npcs) {
        if (!n.dead && Math.hypot(n.pos.x - x, n.pos.z - z) < radius) g.pedestrians.kill(n, false);
      }
    },
    punch() {
      const p = g.player;
      if (p.vehicle) return;
      p.punching = 0.38;
      const dir = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
      for (const n of g.pedestrians.npcs) {
        if (n.dead) continue;
        const dx = n.pos.x - p.pos.x, dz = n.pos.z - p.pos.z;
        if (Math.hypot(dx, dz) < 2 && dx * dir.x + dz * dir.z > 0) {
          n.health -= 14;
          if (n.health <= 0) g.pedestrians.kill(n, true);
          else if (Math.random() < 0.3) { n.state = 'fight'; n.target = p.pos; }
          if (g.wanted) g.wanted.addHeat(5, p.pos.x, p.pos.z);
          break;
        }
      }
    },
    tryFire(dt) {
      cd -= dt;
      if (cd > 0) return;
      const p = g.player;
      const lo = g.loadout;
      const w = WEAPONS[lo.current];
      if (!w) return;
      if (!w.inf && (lo.ammo[lo.current] || 0) <= 0) { cd = 0.3; return; }
      cd = w.interval;
      if (!w.inf) lo.ammo[lo.current]--;
      const from = new THREE.Vector3();
      if (p.vehicle) from.copy(p.vehicle.pos).add(new THREE.Vector3(0, 1.4, 0));
      else from.copy(p.pos).add(new THREE.Vector3(0, 1.5, 0));
      const dir = new THREE.Vector3();
      g.camera.getWorldDirection(dir);
      if (p.vehicle) dir.set(Math.sin(p.vehicle.heading), 0, Math.cos(p.vehicle.heading));
      const pellets = w.pellets || 1;
      let hitAny = false;
      for (let i = 0; i < pellets; i++) {
        const d2 = dir.clone();
        d2.x += (Math.random() - 0.5) * 0.02 * pellets;
        d2.z += (Math.random() - 0.5) * 0.02 * pellets;
        d2.normalize();
        ray.set(from, d2);
        ray.far = w.range;
        let best = null, bd = w.range;
        for (const n of g.pedestrians.npcs) {
          if (n.dead) continue;
          const dx = n.pos.x - from.x, dz = n.pos.z - from.z;
          const along = dx * d2.x + dz * d2.z;
          if (along < 0 || along > bd) continue;
          const perp = Math.abs(dx * d2.z - dz * d2.x);
          if (perp < 0.6) { best = n; bd = along; }
        }
        for (const v of g.fleet.list) {
          if (v === p.vehicle) continue;
          const dx = v.pos.x - from.x, dz = v.pos.z - from.z;
          const along = dx * d2.x + dz * d2.z;
          if (along < 0 || along > bd) continue;
          const perp = Math.abs(dx * d2.z - dz * d2.x);
          if (perp < 1.6) { best = v; bd = along; }
        }
        const end = from.clone().addScaledVector(d2, bd);
        if (g.effects) g.effects.tracer(from, end);
        if (best) {
          hitAny = true;
          if (best.npc) {
            best.health -= w.dmg * (w.pellets ? 1 : 1);
            if (best.health <= 0) g.pedestrians.kill(best, true);
            else { best.state = 'fight'; best.target = p.pos; }
          } else {
            g.carPhysics.damage(best, w.dmg * 1.5);
          }
        }
        if (g.effects) g.effects.flash(from);
      }
      if (g.audio) g.audio.shot(w.name);
      if (g.wanted) g.wanted.addHeat(4, p.pos.x, p.pos.z);
      if (g.pedestrians) g.pedestrians.alarm(p.pos.x, p.pos.z, 42, p.pos);
      if (g.traffic) g.traffic.panic(p.pos.x, p.pos.z, 45);
    },
    gunmanFire(dt) {
      groupCd -= dt;
      if (groupCd > 0) return;
      const p = g.player;
      let fired = false;
      for (const n of g.pedestrians.npcs) {
        if (n.dead || n.kind !== 'guard') continue;
        const d = Math.hypot(n.pos.x - p.pos.x, n.pos.z - p.pos.z);
        if (d > 34) continue;
        if (!g.collision.lineOfSight(n.pos.x, n.pos.z, p.pos.x, p.pos.z, 1.6)) continue;
        groupCd = 0.24;
        fired = true;
        const from = n.pos.clone().add(new THREE.Vector3(0, 1.4, 0));
        const to = p.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
        if (g.effects) g.effects.tracer(from, to);
        if (Math.random() < 0.22) {
          const dmg = 15 * 0.36;
          if (p.vehicle) g.carPhysics.damage(p.vehicle, dmg * 2.2);
          else p.damage(dmg);
        }
        break;
      }
      if (fired && g.audio) g.audio.shot('SMG');
    },
    update(dt) {
      combat.gunmanFire(dt);
    }
  };
  g.combat = combat;
  return combat;
}
