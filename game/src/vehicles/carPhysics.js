export const CAR_SPECS = {
  comet: { name: 'SOLMAR COMET', top: 34, accel: 16, grip: 8.5, color: '#c93a3a', price: 0 },
  tide: { name: 'TIDE RUNNER', top: 30, accel: 14, grip: 8, color: '#3a7ac9', price: 1200 },
  coral: { name: 'CORAL CRUISER', top: 28, accel: 12, grip: 7.5, color: '#e8a83a', price: 2400 },
  marisol: { name: 'MARISOL GT', top: 40, accel: 20, grip: 9.5, color: '#ff7a2e', price: 8500 },
  phantom: { name: 'VANE PHANTOM', top: 44, accel: 23, grip: 10, color: '#d8b45a', price: 22000 },
  taxi: { name: 'SUNLINE CAB', top: 26, accel: 11, grip: 7, color: '#ffd23d', price: 0 },
  van: { name: 'TIDE VAN', top: 24, accel: 10, grip: 6.5, color: '#8a8a82', price: 0 },
  interceptor: { name: 'SBPD INTERCEPTOR', top: 38, accel: 19, grip: 9.5, color: '#f0f0f0', price: 0 },
  bulwark: { name: 'SBPD BULWARK', top: 30, accel: 13, grip: 7, color: '#3a3f4a', price: 0 },
};
export function createVehicle(specKey, x, z, heading) {
  const spec = CAR_SPECS[specKey] || CAR_SPECS.comet;
  return {
    specKey, spec,
    position: { x, z },
    heading,
    velocity: { x: 0, z: 0 },
    steer: 0,
    speed: 0,
    condition: 100,
    health: 100,
    burnTimer: 0,
    parked: true,
    driver: null,
    stolenByPlayer: false,
    missionKey: null,
    color: spec.color,
    length: 4.4,
    width: 2,
  };
}
export function stepVehicle(v, input, dt, groundHeight, collide) {
  const spec = v.spec;
  const forward = input.forward || 0;
  const steerIn = input.steer || 0;
  const handbrake = !!input.handbrake;
  const dirX = Math.sin(v.heading);
  const dirZ = Math.cos(v.heading);
  let speed = v.velocity.x * dirX + v.velocity.z * dirZ;
  if (forward > 0) speed += spec.accel * forward * dt * (speed < 0 ? 2.2 : 1);
  else if (forward < 0) speed += spec.accel * forward * dt * 1.6;
  speed -= speed * 0.55 * dt;
  if (handbrake) speed -= speed * 1.8 * dt;
  speed = Math.max(-12, Math.min(spec.top * (v.condition / 100 * 0.5 + 0.5), speed));
  const steerTarget = steerIn * (handbrake ? 1.5 : 1) * Math.max(0.25, 1 - Math.abs(speed) / (spec.top * 1.6));
  v.steer += (steerTarget - v.steer) * Math.min(1, dt * 8);
  if (Math.abs(speed) > 0.5) {
    v.heading += v.steer * (speed / spec.top) * spec.grip * 0.28 * dt * (speed < 0 ? -1 : 1);
  }
  const ndx = Math.sin(v.heading);
  const ndz = Math.cos(v.heading);
  const latX = v.velocity.x - (v.velocity.x * ndx + v.velocity.z * ndz) * ndx;
  const latZ = v.velocity.z - (v.velocity.x * ndx + v.velocity.z * ndz) * ndz;
  const gripK = Math.exp(-(handbrake ? spec.grip * 0.4 : spec.grip) * dt);
  v.velocity.x = ndx * speed + latX * gripK;
  v.velocity.z = ndz * speed + latZ * gripK;
  v.position.x += v.velocity.x * dt;
  v.position.z += v.velocity.z * dt;
  v.speed = Math.hypot(v.velocity.x, v.velocity.z);
  const gy = groundHeight ? groundHeight(v.position.x, v.position.z) : 0;
  v.y = gy;
  if (collide) {
    const hit = collide.resolveCircle(v.position, 1.6, gy);
    if (hit && v.speed > 4) {
      v.condition = Math.max(0, v.condition - v.speed * 0.4);
      v.health = Math.max(0, v.health - v.speed * 0.5);
      v.velocity.x *= 0.4; v.velocity.z *= 0.4;
    } else if (hit) {
      v.velocity.x *= 0.5; v.velocity.z *= 0.5;
    }
  }
  if (v.burnTimer > 0) {
    v.burnTimer -= dt;
    v.health = Math.max(0, v.health - 12 * dt);
    if (v.health <= 0 && !v.wrecked) v.wrecked = true;
  }
  return v.speed;
}
export function collideVehicles(a, b) {
  const dx = b.position.x - a.position.x;
  const dz = b.position.z - a.position.z;
  const d = Math.hypot(dx, dz);
  const min = 3.4;
  if (d >= min || d < 1e-4) return false;
  const push = (min - d) / 2;
  const nx = dx / d; const nz = dz / d;
  a.position.x -= nx * push; a.position.z -= nz * push;
  b.position.x += nx * push; b.position.z += nz * push;
  const rel = Math.abs((a.velocity.x - b.velocity.x) * nx + (a.velocity.z - b.velocity.z) * nz);
  if (rel > 3) {
    a.condition = Math.max(0, a.condition - rel * 0.5);
    b.condition = Math.max(0, b.condition - rel * 0.5);
    a.velocity.x *= 0.7; a.velocity.z *= 0.7;
    b.velocity.x *= 0.7; b.velocity.z *= 0.7;
    return true;
  }
  return false;
}