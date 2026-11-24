import * as THREE from 'three';
export function createPlayerModel(colors) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: colors.skin, roughness: 0.8 });
  const shirt = new THREE.MeshStandardMaterial({ color: colors.shirt, roughness: 0.85 });
  const pants = new THREE.MeshStandardMaterial({ color: colors.pants, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: colors.hair, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), shirt);
  torso.position.y = 1.15; torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.34), skin);
  head.position.y = 1.72; head.castShadow = true;
  g.add(head);
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.36), hair);
  hairTop.position.y = 1.94;
  g.add(hairTop);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.26), pants);
  legL.position.set(-0.17, 0.36, 0); legL.castShadow = true;
  g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.17;
  g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.2), shirt);
  armL.position.set(-0.42, 1.18, 0); armL.castShadow = true;
  g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.42;
  g.add(armR);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.55), new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.4, metalness: 0.6 }));
  gun.position.set(0.42, 1.05, 0.3);
  gun.visible = false;
  g.add(gun);
  g.userData = { legL, legR, armL, armR, gun, walkPhase: 0 };
  return g;
}
export function createPlayer(game) {
  const { plan, collision, rng } = game;
  const model = createPlayerModel({ skin: 0xc98a5e, shirt: 0x2a7a5a, pants: 0x2a2f3a, hair: 0x1a1a1a });
  game.scene.add(model);
  const p = {
    position: { x: -400, z: 290 },
    heading: 0,
    yaw: 0,
    speed: 0,
    health: 100,
    armor: 0,
    money: 500,
    vehicle: null,
    lastVehicle: null,
    onFoot: true,
    model,
    stats: { kills: 0, carsStolen: 0, distanceDriven: 0, copsEvaded: 0, earned: 0 },
    walkPhase: 0,
    placeAt(x, z, heading = 0) {
      p.position.x = x;
      p.position.z = z;
      p.heading = heading;
      p.yaw = heading;
      p.vehicle = null;
      p.onFoot = true;
      model.visible = true;
    },
    enterVehicle(v) {
      p.vehicle = v;
      p.lastVehicle = v;
      v.driver = 'player';
      v.parked = false;
      if (!v.stolenByPlayer) {
        v.stolenByPlayer = true;
        p.stats.carsStolen++;
        game.bus.emit('crime', { type: 'theft', vehicle: v });
      }
      p.onFoot = false;
      model.visible = false;
    },
    exitVehicle() {
      const v = p.vehicle;
      if (!v) return;
      p.vehicle = null;
      v.driver = null;
      p.onFoot = true;
      const side = { x: v.position.x + Math.cos(v.heading) * 2.2, z: v.position.z - Math.sin(v.heading) * 2.2 };
      p.position.x = side.x;
      p.position.z = side.z;
      p.heading = v.heading;
      p.yaw = v.heading;
      model.visible = true;
    },
    giveWeapon(slot, ammo) { game.loadout.give(slot, ammo); },
    selectWeapon(slot) { game.loadout.select(slot); },
    step(dt, input) {
      if (!p.onFoot) return;
      p.yaw -= (input.mouseDX || 0) * 0.0032;
      const fwd = input.axis(['KeyW', 'ArrowUp']) - input.axis(['KeyS', 'ArrowDown']);
      const strafe = input.axis(['KeyD', 'ArrowRight']) - input.axis(['KeyA', 'ArrowLeft']);
      const run = input.isHeld('ShiftLeft', 'ShiftRight');
      const speed = run ? 7.5 : 4.2;
      const mx = Math.sin(p.yaw) * fwd + Math.cos(p.yaw) * strafe;
      const mz = Math.cos(p.yaw) * fwd - Math.sin(p.yaw) * strafe;
      const len = Math.hypot(mx, mz) || 1;
      const moving = Math.abs(fwd) + Math.abs(strafe) > 0;
      p.speed = moving ? speed : 0;
      if (moving) {
        p.position.x += (mx / len) * speed * dt;
        p.position.z += (mz / len) * speed * dt;
        p.heading = Math.atan2(mx, mz);
        p.walkPhase += dt * (run ? 11 : 7);
      }
      const clamped = plan.landClamp(p.position.x, p.position.z);
      p.position.x = clamped.x;
      p.position.z = clamped.z;
      collision.resolveCircle(p.position, 0.45, 0);
      const u = model.userData;
      const sw = moving ? Math.sin(p.walkPhase) * 0.55 : 0;
      u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
      u.armL.rotation.x = -sw * 0.8; u.armR.rotation.x = sw * 0.8;
      const aiming = input.mouseHeld ? input.mouseHeld[0] : false;
      u.gun.visible = game.loadout.selected !== 'fists';
      if (aiming && u.gun.visible) {
        u.armR.rotation.x = -1.2;
        u.armL.rotation.x = -1.2;
      }
      model.position.set(p.position.x, plan.groundHeight(p.position.x, p.position.z), p.position.z);
      model.rotation.y = p.heading;
    },
  };
  return p;
}