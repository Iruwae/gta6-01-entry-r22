export function createCarPhysics(g) {
  const phys = {
    step(v, inp, dt) {
      if (v.wrecked) return;
      const fwd = inp.forward ? 1 : 0;
      const back = inp.back ? 1 : 0;
      const hb = inp.handbrake ? 1 : 0;
      const sr = Math.abs(v.speed) / v.top;
      const steerMax = 0.52 - (0.52 - 0.06) * sr;
      const steerTarget = (inp.left ? 1 : 0) - (inp.right ? 1 : 0);
      v.steer += (steerTarget * steerMax - v.steer) * Math.min(1, dt * 8);
      const yawMax = (2.3 - (2.3 - 0.9) * sr) * (hb ? 1.55 : 1);
      const yaw = v.steer * yawMax * Math.min(1, Math.abs(v.speed) / 4 + 0.2) * Math.sign(v.speed || 1);
      v.heading += yaw * dt;
      let acc = 0;
      if (fwd) acc += v.accel * (v.health < v.maxHealth / 2 ? 0.45 : 1);
      if (back) acc -= v.accel * 0.6;
      if (!fwd && !back) acc -= Math.sign(v.speed) * 4;
      if (inp.brake) acc -= Math.sign(v.speed) * 26;
      v.speed += acc * dt;
      if (hb && Math.abs(v.speed) > 6) v.speed *= (1 - dt * 0.4);
      v.speed = Math.max(-v.top * 0.6, Math.min(v.top, v.speed));
      if (Math.abs(v.speed) < 0.15 && !fwd && !back) v.speed = 0;
      const nx = v.pos.x + Math.sin(v.heading) * v.speed * dt;
      const nz = v.pos.z + Math.cos(v.heading) * v.speed * dt;
      const before = {x: v.pos.x, z: v.pos.z};
      v.pos.x = nx; v.pos.z = nz;
      const p = {x: v.pos.x, z: v.pos.z};
      const hit = g.collision.resolveCircle(p, 1.6, 0);
      v.pos.x = p.x; v.pos.z = p.z;
      if (hit) {
        const imp = Math.abs(v.speed);
        if (imp > 4) phys.damage(v, imp * imp * 0.5);
        v.speed *= 0.4;
        if (g.effects) g.effects.sparks(v.pos.x, 1, v.pos.z, 6);
      }
      const gy = g.plan.groundHeight(v.pos.x, v.pos.z);
      v.pos.y = gy;
      v.mesh.position.copy(v.pos);
      v.mesh.rotation.y = v.heading;
      v.mesh.rotation.z = -v.steer * 0.12;
      v.velocity.set(Math.sin(v.heading) * v.speed, 0, Math.cos(v.heading) * v.speed);
      if (v.health < v.maxHealth * 0.45 && !v.burning && v.health > 0) { v.burning = true; v.burnT = 3.2; }
      if (v.burning) {
        v.burnT -= dt;
        if (g.effects) g.effects.smoke(v.pos.x, 1.5, v.pos.z, dt);
        if (v.burnT <= 0) phys.explode(v);
      }
      if (v.health <= 0 && !v.wrecked) phys.explode(v);
    },
    damage(v, amt) {
      if (v.wrecked) return;
      v.health -= amt;
      if (v.health <= 0) { v.health = 0; phys.explode(v); }
    },
    explode(v) {
      if (v.wrecked) return;
      v.wrecked = true;
      v.burning = false;
      if (g.effects) g.effects.explosion(v.pos.x, 1.5, v.pos.z);
      if (g.combat) g.combat.onExplosion(v.pos.x, v.pos.z, 9, 260);
      if (g.audio) g.audio.boom(v.pos);
      v.mesh.traverse((m) => { if (m.material && m.material.color) m.material = m.material.clone(); });
      v.mesh.scale.y = 0.55;
    }
  };
  g.carPhysics = phys;
  return phys;
}
