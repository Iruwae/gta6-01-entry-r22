import * as THREE from 'three';
export function createCamera(g) {
  const cam = g.camera;
  const c = {
    yaw: 0, pitch: 0.32, dist: 6.2, shake: 0, shakeT: 0, idleT: 0, lookBack: false,
    snap(pos, heading) {
      c.yaw = heading;
      c.pitch = 0.32;
      c.idleT = 0;
      const tgt = pos.clone ? pos.clone() : new THREE.Vector3(pos.x, pos.y || 1.5, pos.z);
      c.update(0, tgt, heading);
    },
    snapBehind() {
      const p = g.player;
      const hd = p.vehicle ? p.vehicle.heading : p.heading;
      c.yaw = hd;
      c.pitch = 0.32;
      c.shake = 0;
    },
    update(dt, targetPos, targetHeading) {
      const p = g.player;
      const inCar = !!p.vehicle;
      const sp = inCar ? Math.abs(p.vehicle.speed) : 0;
      const maxFov = inCar ? 78 : 62;
      const fovT = p.aiming ? 54 : (inCar ? 62 + Math.min(16, sp * 0.4) : 62);
      if (Math.abs(cam.fov - fovT) > 0.1) { cam.fov += (fovT - cam.fov) * Math.min(1, dt * 5); cam.updateProjectionMatrix(); }
      const baseDist = inCar ? 6.2 + 0.75 * (p.vehicle.len || 4.4) : p.aiming ? 3.7 : 5.2;
      const baseH = inCar ? 1.25 + 0.35 * 1.4 : p.aiming ? 1.78 : 1.66;
      c.idleT += dt;
      const moving = inCar ? sp > 1 : (p.vel.x !== 0 || p.vel.z !== 0);
      if (moving) c.idleT = 0;
      const wantYaw = targetHeading !== undefined ? targetHeading : (inCar ? p.vehicle.heading : p.yaw);
      if (c.idleT > 0.9 && inCar) {
        let dy = wantYaw - c.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        const rate = 2.2 + 3.5 * Math.min(1, sp / 30);
        c.yaw += dy * Math.min(1, dt * rate);
      } else if (!inCar) {
        c.yaw = p.yaw;
        c.pitch = p.pitch;
      }
      if (c.lookBack) c.yaw = wantYaw + Math.PI;
      const dist = baseDist;
      const cx = targetPos.x - Math.sin(c.yaw) * Math.cos(c.pitch) * dist;
      const cz = targetPos.z - Math.cos(c.yaw) * Math.cos(c.pitch) * dist;
      const cy = targetPos.y + baseH + Math.sin(c.pitch) * dist;
      let fx = cx, fz = cz, fy = cy;
      const dx = cx - targetPos.x, dz = cz - targetPos.z;
      const dd = Math.hypot(dx, dz);
      if (dd > 0.9) {
        const steps = Math.floor(dd / 2);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const b = g.collision.solidAt(targetPos.x + dx * t, targetPos.z + dz * t, 0);
          if (b && b.h > targetPos.y + 1) {
            const tt = Math.max(0.15, t - 0.4 / dd);
            fx = targetPos.x + dx * tt; fz = targetPos.z + dz * tt;
            break;
          }
        }
      }
      fy = Math.max(fy, g.plan.groundHeight(fx, fz) + 0.35);
      if (c.shake > 0) {
        c.shakeT += dt;
        const s = c.shake * Math.exp(-5 * c.shakeT);
        fx += Math.sin(c.shakeT * 47) * s * 0.3;
        fy += Math.sin(c.shakeT * 39) * s * 0.3;
        if (s < 0.01) c.shake = 0;
      }
      cam.position.set(fx, fy, fz);
      cam.lookAt(targetPos.x, targetPos.y + 1.2, targetPos.z);
    },
    addShake(a) { c.shake = Math.min(1.2, c.shake + a); c.shakeT = 0; }
  };
  g.chaseCamera = c;
  return c;
}
