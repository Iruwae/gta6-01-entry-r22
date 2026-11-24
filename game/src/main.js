import * as THREE from 'three';
import { createRng } from './core/rng.js';
import { createBus } from './core/bus.js';
import { createInput } from './core/input.js';
import { createCityPlan } from './world/cityPlan.js';
import { createCollision } from './world/collision.js';
import { createSky } from './world/sky.js';
import { buildCity } from './world/cityBuilder.js';
import { createFleet } from './vehicles/vehicleFleet.js';
import { createTrafficSystem } from './vehicles/traffic.js';
import { stepVehicle, collideVehicles } from './vehicles/carPhysics.js';
import { createPlayer } from './characters/player.js';
import { createPedestrianSystem } from './characters/pedestrians.js';
import { createWantedLevel } from './police/wanted.js';
import { createPoliceDispatch } from './police/dispatch.js';
import { createLoadout } from './combat/weapons.js';
import { createCombat } from './combat/combat.js';
import { createMissionRunner } from './missions/missionRunner.js';
import { createRespect, createStanding } from './missions/respect.js';
import { createActivities } from './missions/activities.js';
import { createChaseCamera } from './camera/chaseCamera.js';
import { createEffects } from './effects/effects.js';
import { createHud } from './ui/hud.js';
import { createMinimap } from './ui/minimap.js';
import { createMenus } from './ui/menus.js';
import { createRadio } from './audio/radio.js';
import { createSaveGame } from './save/saveGame.js';
import { DIALOGUE } from './missions/story.js';
const SEED = 20261124;
export function createGame() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 6000);
  const game = {
    renderer, scene, camera,
    time: 0,
    timeOfDay: 18.2,
    mode: 'title',
    introShown: false,
    aimPoint: null,
    bustedTimer: 0,
    crewCooldown: { getaway: 0, fix: 0, eyes: 0 },
    eyesOut: false,
  };
  game.rng = createRng(SEED);
  game.bus = createBus();
  game.input = createInput(canvas);
  game.plan = createCityPlan(game.rng.fork('plan'));
  const DISTRICT_IDS = ['palmera-strand', 'sundial-square', 'vidrio-heights', 'old-cannery', 'marina-row', 'saltflats-port', 'seaglass-beach', 'coral-keys'];
  const RECTS = [[360, -225, 180, 270], [0, 135, 900, 450], [-90, 0, 720, 360], [-90, -270, 720, 180], [360, 135, 180, 450], [-360, 180, 180, 180], [0, 225, 540, 90], [857, -90, 238, 252]];
  game.plan.DISTRICTS.forEach((d, i) => {
    d.id = DISTRICT_IDS[i];
    [d.x, d.z, d.w, d.h] = RECTS[i];
  });
  game.plan.districts = game.plan.DISTRICTS;
  game.plan.places = game.plan.PLACES;
  const synth = [
    { id: 'coral-pier', name: 'Coral Keys Pier', x: 630, z: 135 },
    { id: 'juno-shop', name: "Juno's Shop", x: -410, z: -300 },
    { id: 'night-market', name: 'Night Market', x: -230, z: -60 },
    { id: 'coral-keys', name: 'Coral Keys', x: 850, z: -90 },
  ];
  for (const p of synth) {
    game.plan.placeById.set(p.id, p);
    game.plan.PLACES.push(p);
  }
  game.collision = createCollision();
  const skyObj = createSky(scene, game.rng.fork('sky'));
  skyObj.setTime = (hour) => skyObj.update(hour, { x: game.player.position.x, y: 0, z: game.player.position.z }, camera);
  game.sky = skyObj;
  game.city = buildCity(scene, game.plan, game.collision, game.rng.fork('city'));
  game.fleet = createFleet(scene, game.plan, game.rng.fork('fleet'));
  game.loadout = createLoadout(game);
  game.player = createPlayer(game);
  game.pedestrians = createPedestrianSystem(game);
  game.wanted = createWantedLevel(game);
  game.dispatch = createPoliceDispatch(game);
  game.combat = createCombat(game);
  game.missions = createMissionRunner(game);
  game.respect = createRespect(game);
  game.standing = createStanding(game);
  game.standing.init();
  game.activities = createActivities(game);
  game.traffic = createTrafficSystem(game);
  game.camera = createChaseCamera(camera);
  game.effects = createEffects(game);
  game.radio = createRadio(game);
  game.save = createSaveGame(game);
  game.ui = createHud(game);
  game.minimap = createMinimap(game);
  game.menus = createMenus(game);
  game.menus.wire();
  game.driveVehicle = (v, input, dt) => {
    stepVehicle(v, input, dt, game.plan.groundHeight, game.collision);
    return v.speed;
  };
  game.aimAt = (x, z) => { game.aimPoint = { x, z }; };
  game.fixedStep = (dt) => {
    game.time += dt;
    game.timeOfDay += dt / 240;
    if (game.timeOfDay >= 24) game.timeOfDay -= 24;
    game.sky.setTime(game.timeOfDay);
    if (game.city.update) game.city.update(game.time, game.sky.nightFactor);
    const p = game.player;
    const input = game.input;
    if (p.onFoot) {
      p.step(dt, input);
    } else if (p.vehicle) {
      const fwd = (input.isHeld('KeyW', 'ArrowUp') ? 1 : 0) - (input.isHeld('KeyS', 'ArrowDown') ? 1 : 0);
      const steer = (input.isHeld('KeyD', 'ArrowRight') ? 1 : 0) - (input.isHeld('KeyA', 'ArrowLeft') ? 1 : 0);
      game.driveVehicle(p.vehicle, { forward: fwd, steer, handbrake: input.isHeld('Space') }, dt);
      p.stats.distanceDriven += p.vehicle.speed * dt;
      if (p.vehicle.speed > 24) game.wanted.addHeat(2 * dt);
    }
    const cars = game.fleet.vehicles;
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i]; const b = cars[j];
        if (Math.abs(a.position.x - b.position.x) > 5 || Math.abs(a.position.z - b.position.z) > 5) continue;
        if (collideVehicles(a, b)) {
          if (a === p.vehicle || b === p.vehicle) game.wanted.addHeat(8);
        }
      }
    }
    game.traffic.step(dt);
    game.pedestrians.step(dt);
    const anySees = game.dispatch.step(dt);
    game.wanted.step(dt, anySees || game.dispatch.helicopter.active);
    game.missions.step(dt);
    game.activities.step(dt);
    game.combat.step(dt);
    game.effects.step(dt);
    game.radio.step(dt);
    for (const k of Object.keys(game.crewCooldown)) {
      if (game.crewCooldown[k] > 0) game.crewCooldown[k] -= dt;
    }
    if (p.health <= 0) {
      game.wasted();
    } else if (p.onFoot && game.wanted.level > 0) {
      let nearest = 999;
      for (const u of game.dispatch.units) {
        nearest = Math.min(nearest, Math.hypot(u.vehicle.position.x - p.position.x, u.vehicle.position.z - p.position.z));
      }
      if (nearest < 4) {
        game.bustedTimer += dt;
        if (game.bustedTimer > 2) game.busted();
      } else game.bustedTimer = 0;
    }
  };
  game.wasted = () => {
    const p = game.player;
    p.money = Math.max(0, p.money - 100);
    p.health = 100;
    p.armor = 0;
    game.wanted.set(0);
    game.dispatch.clearUnits();
    if (p.vehicle) { p.vehicle.driver = null; p.vehicle = null; p.onFoot = true; p.model.visible = true; }
    const hosp = game.plan.placeById.get('hospital');
    p.placeAt(hosp.x, hosp.z, 0);
    game.ui.showToast('WASTED — you woke up at Solmar General, -$100');
    game.camera.snap({ x: hosp.x, z: hosp.z, y: 0 }, 0);
  };
  game.busted = () => {
    const p = game.player;
    p.money = Math.max(0, p.money - 150);
    p.health = 100;
    game.wanted.set(0);
    game.dispatch.clearUnits();
    game.bustedTimer = 0;
    const hq = game.plan.placeById.get('hq');
    p.placeAt(hq.x, hq.z, 0);
    game.ui.showToast('BUSTED — SBPD let you go, -$150');
    game.camera.snap({ x: hq.x, z: hq.z, y: 0 }, 0);
  };
  game.startPlay = () => {
    game.mode = 'play';
    const p = game.player;
    const target = p.vehicle ? p.vehicle.position : p.position;
    game.camera.snap({ x: target.x, z: target.z, y: 0 }, p.vehicle ? p.vehicle.heading : p.heading);
    if (!game.introShown) {
      game.introShown = true;
      game.ui.showDialogue(DIALOGUE.intro, 10);
    }
  };
  game.resume = () => { game.mode = 'play'; };
  game.toTitle = () => {
    game.mode = 'title';
    game.wanted.set(0);
    game.dispatch.clearUnits();
    game.missions.active = null;
    game.ui.clearMarker();
  };
  game.load = (i) => game.save.load(i);
  game.crewAbility = (key) => {
    if (key === 'getaway') {
      if (game.crewCooldown.getaway > 0) { game.ui.showToast(`Getaway ready in ${Math.ceil(game.crewCooldown.getaway)}s`); return; }
      if (game.wanted.level === 0) { game.ui.showToast('No heat to lose'); return; }
      game.wanted.set(game.wanted.level - 1);
      game.crewCooldown.getaway = 60;
      game.ui.showToast('PILAR — getaway route clear, heat down');
    } else if (key === 'fix') {
      if (game.crewCooldown.fix > 0) { game.ui.showToast(`Quick Fix ready in ${Math.ceil(game.crewCooldown.fix)}s`); return; }
      const v = game.player.vehicle;
      if (!v) { game.ui.showToast('No car to fix'); return; }
      v.condition = 100; v.health = 100; v.burnTimer = 0;
      game.crewCooldown.fix = 45;
      game.ui.showToast('VIC — car patched up, good as new');
    } else if (key === 'eyes') {
      if (game.crewCooldown.eyes > 0) { game.ui.showToast(`Eyes Out ready in ${Math.ceil(game.crewCooldown.eyes)}s`); return; }
      game.eyesOut = true;
      game.crewCooldown.eyes = 30;
      game.ui.showToast('JUNO — police positions marked');
      setTimeout(() => { game.eyesOut = false; }, 20000);
    }
  };
  const prevKeys = new Set();
  function pressed(code) {
    return game.input.isHeld(code) && !prevKeys.has(code);
  }
  function handleKeys() {
    const input = game.input;
    const p = game.player;
    if (pressed('KeyE')) {
      if (p.vehicle) {
        game.effects.detachHeadlight();
        p.exitVehicle();
      } else {
        const v = game.fleet.nearestEnterable(p.position.x, p.position.z, 4.5);
        if (v) {
          p.enterVehicle(v);
          game.effects.attachHeadlight(game.fleet.meshes.get(v));
          game.ui.showToast(v.spec.name + ' — yours now');
        }
      }
    }
    if (pressed('KeyG')) {
      const g = game.plan.placeById.get('garage');
      if (p.onFoot && Math.hypot(p.position.x - g.x, p.position.z - g.z) < 14) {
        game.mode = 'shop';
        game.menus.showShop();
      }
    }
    if (pressed('KeyT') && p.vehicle) game.activities.startFare();
    if (pressed('KeyR') && p.vehicle) game.activities.startRace();
    if (pressed('KeyM')) {
      const list = game.missions.missionList().filter((m) => m.available);
      if (list.length) game.missions.start(list[0].id);
      else game.ui.showToast('No jobs left — free roam');
    }
    if (pressed('KeyZ')) game.crewAbility('getaway');
    if (pressed('KeyX')) game.crewAbility('fix');
    if (pressed('KeyC')) game.crewAbility('eyes');
    if (pressed('Digit1')) game.radio.switchTo(0);
    if (pressed('Digit2')) game.radio.switchTo(1);
    if (pressed('Digit3')) game.radio.switchTo(2);
    if (pressed('KeyQ')) {
      const order = ['fists', 'pistol', 'smg', 'shotgun', 'rifle', 'gator'];
      const i = order.indexOf(game.loadout.selected);
      for (let k = 1; k <= order.length; k++) {
        if (game.loadout.select(order[(i + k) % order.length])) break;
      }
    }
    if (pressed('Escape') || pressed('KeyP')) {
      if (game.mode === 'play') { game.mode = 'pause'; game.menus.showPause(); }
      else if (game.mode === 'pause') { game.menus.hidePause(); game.mode = 'play'; }
      else if (game.mode === 'shop') { game.menus.hideShop(); game.mode = 'play'; }
    }
    if (p.onFoot) {
      const v = game.fleet.nearestEnterable(p.position.x, p.position.z, 4.5);
      const g = game.plan.placeById.get('garage');
      if (v) game.ui.showPrompt(`E — ENTER ${v.spec.name}`);
      else if (Math.hypot(p.position.x - g.x, p.position.z - g.z) < 14) game.ui.showPrompt('G — GARAGE SHOP');
      else game.ui.hidePrompt();
    } else if (p.vehicle) {
      game.ui.showPrompt('E — EXIT CAR · T — TAXI FARE · R — STREET RACE · M — NEXT JOB');
    }
    prevKeys.clear();
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyG', 'KeyT', 'KeyR', 'KeyM', 'KeyZ', 'KeyX', 'KeyC', 'Digit1', 'Digit2', 'Digit3', 'KeyQ', 'Escape', 'KeyP']) {
      if (input.isHeld(code)) prevKeys.add(code);
    }
  }
  let dragging = false;
  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    if (game.mode === 'play' && game.player.onFoot && game.loadout.selected !== 'fists') {
      const weapon = game.loadout.current();
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const origin = camera.position.clone();
      origin.y -= 0.3;
      game.combat.playerShoot(origin, dir, weapon);
    }
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('click', () => {
    if (game.mode === 'play' && document.pointerLockElement !== canvas) canvas.requestPointerLock();
  });
  canvas.addEventListener('wheel', (e) => { game.camera.zoom(e.deltaY); }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  game.render = () => {
    const p = game.player;
    const target = p.vehicle ? { x: p.vehicle.position.x, y: 0, z: p.vehicle.position.z } : { x: p.position.x, y: 0, z: p.position.z };
    const heading = p.vehicle ? p.vehicle.heading : p.yaw;
    const speed = p.vehicle ? p.vehicle.speed : p.speed;
    const mdx = game.input.mouseDX;
    const mdy = game.input.mouseDY;
    if (dragging && p.vehicle && mdx) game.camera.orbit(mdx, mdy);
    game.camera.update(0.016, target, heading, speed, game.effects.shakeAmount);
    game.fleet.sync(0.016, game.time);
    renderer.render(scene, camera);
  };
  const garage = game.plan.placeById.get('garage');
  game.player.placeAt(garage.x, garage.z, 0.6);
  const starter = game.fleet.spawn('comet', garage.x + 8, garage.z + 6, 0.6);
  starter.parked = true;
  game.fleet.parkRandom(14, game.player.position);
  game.traffic.populate();
  game.pedestrians.populate();
  game.activities.placeCoins();
  game.bus.on('mission-complete', () => game.save.save(0));
  game.bus.on('escaped', () => { game.player.stats.copsEvaded++; });
  let last = performance.now();
  let acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dtFrame = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (game.mode === 'play') {
      acc += dtFrame;
      let n = 0;
      while (acc >= 1 / 60 && n < 5) {
        game.fixedStep(1 / 60);
        acc -= 1 / 60;
        n++;
      }
      handleKeys();
      game.ui.update(dtFrame);
      game.minimap.draw();
    } else if (game.mode === 'title') {
      game.time += dtFrame;
      const t = game.time * 0.02;
      camera.position.set(-420 + Math.sin(t) * 40, 26 + Math.sin(t * 0.7) * 4, 320 + Math.cos(t) * 30);
      camera.lookAt(-200, 12, 60);
      game.sky.setTime(18.2);
      game.traffic.step(dtFrame);
      game.fleet.sync(dtFrame, game.time);
    }
    game.render();
  }
  game.menus.showTitle();
  requestAnimationFrame(loop);
  return game;
}
const game = createGame();
window.__game = game;
export default game;