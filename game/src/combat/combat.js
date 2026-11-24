import * as THREE from 'three';
export function createCombat(game) {
  const { scene, plan, collision, rng } = game;
  const tracers = [];
  const tracerGeo = new THREE.BufferGeometry();
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 });
  function addTracer(from, to, life = 0.12) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(from.x, from.y, from.z), new THREE.Vector3(to.x, to.y, to.z)]);
    const line = new THREE.Line(geo, tracerMat.clone());
    scene.add(line);
    tracers.push({ line, life });
  }
  function muzzleFlash(at) {
    const flash = new THREE.PointLight(0xffc861, 8, 12);
    flash.position.set(at.x, at.y, at.z);
    scene.add(flash);
    tracers.push({ line: flash, life: 0.06, isLight: true });
  }
  function explodeAt(pos, radius = 9, damage = 90) {
    const fire = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffa22e, transparent: true, opacity: 0.95 }));
    fire.position.set(pos.x, (pos.y ?? 0) + 1.2, pos.z);
    scene.add(fire);
    const light = new THREE.PointLight(0xff7a2e, 40, 40);
    light.position.set(pos.x, (pos.y ?? 0) + 2, pos.z);
    scene.add(light);
    tracers.push({ line: fire, life: 0.7, isFire: true, radius });
    tracers.push({ line: light, life: 0.7, isLight: true });
    game.effects.shake(0.6);
    for (const v of game.fleet.vehicles) {
      const d = Math.hypot(v.position.x - pos.x, v.position.z - pos.z);
      if (d < radius) {
        v.health = Math.max(0, v.health - damage * (1 - d / (radius * 1.4)));
        v.condition = Math.max(0, v.condition - damage * 0.6);
        if (v.health <= 0) game.fleet.explode(v);
      }
    }
    for (const n of game.pedestrians.npcs) {
      const d = Math.hypot(n.position.x - pos.x, n.position.z - pos.z);
      if (d < radius && !n.dead) {
        n.health -= damage;
        if (n.health <= 0) { n.dead = true; n.model.visible = false; game.player.stats.kills++; }
      }
    }
    const pd = Math.hypot(game.player.position.x - pos.x, game.player.position.z - pos.z);
    if (pd < radius && !game.player.vehicle) {
      game.player.health = Math.max(0, game.player.health - damage * 0.5);
    }
    game.pedestrians.panicAt(pos.x, pos.z, radius * 4);
    game.wanted.crime('explosion');
    game.bus.emit('explosion', { x: pos.x, z: pos.z });
    return { fire, light };
  }
  function playerShoot(og, dir, weapon) {
    if (!game.loadout.spendAmmo(weapon.key)) return null;
    muzzleFlash({ x: og.x + dir.x * 1.2, y: og.y - 0.2, z: og.z + dir.z * 1.2 });
    let best = null;
    let bestT = weapon.range;
    const end = { x: og.x + dir.x * weapon.range, y: og.y + dir.y * weapon.range, z: og.z + dir.z * weapon.range };
    for (const n of game.pedestrians.npcs) {
      if (n.dead) continue;
      const to = { x: n.position.x - og.x, y: 1.2 - og.y, z: n.position.z - og.z };
      const t = to.x * dir.x + to.y * dir.y + to.z * dir.z;
      if (t < 0 || t > bestT) continue;
      const px = og.x + dir.x * t - n.position.x;
      const py = og.y + dir.y * t - 1.2;
      const pz = og.z + dir.z * t - n.position.z;
      if (px * px + py * py + pz * pz < 1.2) {
        bestT = t; best = { point: { x: n.position.x, y: 1.2, z: n.position.z }, npc: n };
      }
    }
    for (const v of game.fleet.vehicles) {
      if (v === game.player.vehicle) continue;
      const to = { x: v.position.x - og.x, y: 1 - og.y, z: v.position.z - og.z };
      const t = to.x * dir.x + to.y * dir.y + to.z * dir.z;
      if (t < 0 || t > bestT) continue;
      const px = og.x + dir.x * t - v.position.x;
      const py = og.y + dir.y * t - 1;
      const pz = og.z + dir.z * t - v.position.z;
      if (px * px + py * py + pz * pz < 4) {
        bestT = t; best = { point: { x: v.position.x, y: 1, z: v.position.z }, vehicle: v };
      }
    }
    if (best) {
      end.x = best.point.x; end.y = best.point.y; end.z = best.point.z;
      if (best.npc) {
        best.npc.health -= weapon.damage;
        if (best.npc.health <= 0 && !best.npc.dead) {
          best.npc.dead = true; best.npc.model.visible = false;
          game.player.stats.kills++;
          game.wanted.crime('kill');
        }
      }
      if (best.vehicle) {
        best.vehicle.health -= weapon.damage;
        best.vehicle.condition -= weapon.damage * 0.5;
        if (best.vehicle.health <= 0) game.fleet.explode(best.vehicle);
      }
    }
    addTracer(og, end);
    game.wanted.crime('gunfire');
    game.pedestrians.panicAt(game.player.position.x, game.player.position.z, 30);
    return end;
  }
  function npcShoot(from, target, damage) {
    const from3 = { x: from.x, y: 1.4, z: from.z };
    const to3 = { x: target.x, y: 1.2, z: target.z };
    addTracer(from3, to3);
    muzzleFlash(from3);
    const dist = Math.hypot(target.x - from.x, target.z - from.z);
    const hitChance = Math.max(0.08, 0.5 - dist / 90);
    if (rng.chance(hitChance)) {
      if (game.player.vehicle) {
        game.player.vehicle.health = Math.max(0, game.player.vehicle.health - damage);
        game.player.vehicle.condition = Math.max(0, game.player.vehicle.condition - damage * 0.5);
      } else {
        const absorbed = Math.min(game.player.armor, damage);
        game.player.armor -= absorbed;
        game.player.health = Math.max(0, game.player.health - (damage - absorbed));
      }
    }
    return hitChance;
  }
  function step(dt) {
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        scene.remove(t.line);
        if (t.line.geometry) t.line.geometry.dispose();
        tracers.splice(i, 1);
      } else if (t.isFire) {
        const k = 1 + (0.7 - t.life) * 2.2;
        t.line.scale.set(k, k, k);
        t.line.material.opacity = Math.max(0, t.life / 0.7);
      } else if (t.isLight) {
        t.line.intensity = Math.max(0, t.life * 60);
      } else {
        t.line.material.opacity = Math.max(0, t.life / 0.12);
      }
    }
  }
  return { playerShoot, npcShoot, explodeAt, addTracer, muzzleFlash, step };
}