import { createPlayerModel } from './player.js';
const SHIRTS = [0xff7a5c, 0x6db9ff, 0xffd23d, 0x7ee2a8, 0xff7ad9, 0xc9a86a, 0x9be7ff, 0xe8e0c8];
const SKINS = [0xc98a5e, 0x8a5a3a, 0xe8b88a, 0x6a4a2e, 0xd8a878];
const PANTS = [0x2a2f3a, 0x3a3f4a, 0x5a4a3a, 0x2e4a3a, 0x4a2e3a];
export function createPedestrianSystem(game) {
  const { plan, collision, rng, scene } = game;
  const npcs = [];
  const MAX_NPCS = 90;
  function spawn(x, z, role = 'civilian') {
    const model = createPlayerModel({
      skin: rng.pick(SKINS),
      shirt: role === 'guard' ? 0x1a1d24 : rng.pick(SHIRTS),
      pants: rng.pick(PANTS),
      hair: rng.pick([0x1a1a1a, 0x3a2a1a, 0x6a6a6a, 0x8a4a2a]),
    });
    scene.add(model);
    const npc = {
      role,
      model,
      position: { x, z },
      heading: rng.range(0, Math.PI * 2),
      state: 'walk',
      speed: rng.range(1.1, 1.9),
      target: null,
      memory: { block: null, direction: 1, corner: 0, panic: 0, threatX: 0, threatZ: 0, alert: false },
      walkPhase: rng.range(0, 6),
      health: role === 'guard' ? 60 : 30,
      dead: false,
    };
    npcs.push(npc);
    return npc;
  }
  function civilians() { return npcs.filter((n) => n.role === 'civilian' && !n.dead); }
  function populate() {
    const p = game.player;
    while (civilians().length < 64) {
      const j = plan.nearestJunction(p.position.x + rng.range(-120, 120), p.position.z + rng.range(-120, 120));
      spawn(j.x + rng.range(-25, 25), j.z + rng.range(-25, 25));
    }
  }
  function remove(npc) {
    scene.remove(npc.model);
    const i = npcs.indexOf(npc);
    if (i >= 0) npcs.splice(i, 1);
  }
  function panicAt(x, z, radius = 40) {
    for (const n of civilians()) {
      const d = Math.hypot(n.position.x - x, n.position.z - z);
      if (d < radius) {
        n.state = rng.chance(0.5) ? 'flee' : 'cower';
        n.memory.panic = 60;
        n.memory.threatX = x;
        n.memory.threatZ = z;
      }
    }
  }
  function step(dt) {
    const p = game.player;
    for (let i = npcs.length - 1; i >= 0; i--) {
      const n = npcs[i];
      if (n.dead) continue;
      const dPlayer = Math.hypot(n.position.x - p.position.x, n.position.z - p.position.z);
      if (dPlayer > 260 && n.role === 'civilian') { remove(n); continue; }
      if (n.memory.panic > 0) n.memory.panic -= dt;
      let moving = false;
      if (n.state === 'flee') {
        const dx = n.position.x - n.memory.threatX;
        const dz = n.position.z - n.memory.threatZ;
        const len = Math.hypot(dx, dz) || 1;
        n.heading = Math.atan2(dx / len, dz / len);
        n.position.x += (dx / len) * 5.2 * dt;
        n.position.z += (dz / len) * 5.2 * dt;
        moving = true;
        if (n.memory.panic <= 0) n.state = 'walk';
      } else if (n.state === 'cower') {
        n.heading = Math.atan2(p.position.x - n.position.x, p.position.z - n.position.z);
        if (n.memory.panic <= 0) n.state = 'walk';
      } else if (n.state === 'walk') {
        if (!n.target || Math.hypot(n.target.x - n.position.x, n.target.z - n.position.z) < 3) {
          const j = plan.nearestJunction(n.position.x + rng.range(-60, 60), n.position.z + rng.range(-60, 60));
          n.target = { x: j.x + rng.range(-20, 20), z: j.z + rng.range(-20, 20) };
        }
        const dx = n.target.x - n.position.x;
        const dz = n.target.z - n.position.z;
        const len = Math.hypot(dx, dz) || 1;
        n.heading = Math.atan2(dx / len, dz / len);
        n.position.x += (dx / len) * n.speed * dt;
        n.position.z += (dz / len) * n.speed * dt;
        moving = true;
      }
      const clamped = plan.landClamp(n.position.x, n.position.z);
      n.position.x = clamped.x; n.position.z = clamped.z;
      collision.resolveCircle(n.position, 0.4, 0);
      if (moving) n.walkPhase += dt * 7;
      const u = n.model.userData;
      const sw = moving ? Math.sin(n.walkPhase) * 0.5 : 0;
      u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
      u.armL.rotation.x = n.state === 'cower' ? -2.4 : -sw * 0.8;
      u.armR.rotation.x = n.state === 'cower' ? -2.4 : sw * 0.8;
      n.model.position.set(n.position.x, plan.groundHeight(n.position.x, n.position.z), n.position.z);
      n.model.rotation.y = n.heading;
    }
    while (civilians().length < 64) {
      const j = plan.nearestJunction(p.position.x + rng.range(-120, 120), p.position.z + rng.range(-120, 120));
      spawn(j.x + rng.range(-25, 25), j.z + rng.range(-25, 25));
    }
  }
  return { npcs, spawn, civilians, populate, remove, panicAt, step };
}