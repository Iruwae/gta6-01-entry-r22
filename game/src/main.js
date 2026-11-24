import * as THREE from 'three';
import {makeRng} from './core/rng.js';
import {createBus} from './core/bus.js';
import {createInput} from './core/input.js';
import {createPlan} from './world/cityPlan.js';
import {createCollision} from './world/collision.js';
import {createSky} from './world/sky.js';
import {createCity} from './world/cityBuilder.js';
import {createCarPhysics} from './vehicles/carPhysics.js';
import {createFleet} from './vehicles/vehicleFleet.js';
import {createTraffic} from './vehicles/traffic.js';
import {createPlayer} from './characters/player.js';
import {createPedestrians} from './characters/pedestrians.js';
import {createLoadout} from './combat/weapons.js';
import {createCombat} from './combat/combat.js';
import {createWanted} from './police/wanted.js';
import {createDispatch} from './police/dispatch.js';
import {createStory} from './missions/story.js';
import {createMissionRunner} from './missions/missionRunner.js';
import {createRespect} from './missions/respect.js';
import {createActivities} from './missions/activities.js';
import {createSave} from './save/saveGame.js';
import {createHud} from './ui/hud.js';
import {createMenus} from './ui/menus.js';
import {createMinimap} from './ui/minimap.js';
import {createUi} from './ui/ui.js';
import {createCamera} from './camera/chaseCamera.js';
import {createRadio} from './audio/radio.js';
import {createEffects} from './effects/effects.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '7', 10);

const canvas = document.getElementById('world');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 3000);
camera.position.set(-260, 12, 60);

const g = {
  scene, camera, renderer, mode: 'title', introShown: false, god: false,
  rng: makeRng(seed), clock: {h: 17.6, timeStr() { const hh = Math.floor(g.clock.h) % 24, mm = Math.floor((g.clock.h % 1) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); }},
  time: 0, _eT: 0
};
window.__game = g;
g.canvas = canvas;
g.bus = createBus(g);
g.input = createInput(g);
g.plan = createPlan(g);
g.collision = createCollision(g);
g.sky = createSky(g);
g.city = createCity(g);
g.carPhysics = createCarPhysics(g);
g.fleet = createFleet(g);
const _spawn = g.fleet.spawn.bind(g.fleet);
g.fleet.spawn = function (kind, x, z, heading, color) {
  const v = _spawn(kind, x, z, heading, color);
  if (v) {
    if (v.pos && !v.position) v.position = v.pos;
    if (v.position && !v.pos) v.pos = v.position;
  }
  return v;
};
g.traffic = createTraffic(g);
g.player = createPlayer(g);
g.pedestrians = createPedestrians(g);
g.loadout = createLoadout(g);
if (g.loadout.cur && typeof g.loadout.cur === 'function' && g.loadout.current === undefined) {
  const lo = g.loadout;
  Object.defineProperty(lo, 'current', {get() { const c = lo.cur(); return typeof c === 'string' ? c : (c && c.key) || 'fists'; }});
}
if (typeof g.loadout.cycle !== 'function') {
  g.loadout.cycle = () => {
    const order = ['fists', 'pistol', 'smg', 'shotgun', 'rifle', 'rpg'];
    const cur = g.loadout.current || 'fists';
    const i = order.indexOf(cur);
    for (let k = 1; k <= order.length; k++) {
      const nk = order[(i + k) % order.length];
      if (g.loadout.owned && g.loadout.owned[nk]) { g.loadout.select(nk); return; }
    }
  };
}
g.combat = createCombat(g);
g.wanted = createWanted(g);
g.dispatch = createDispatch(g);
g.story = createStory(g);
g.missions = createMissionRunner(g);
g.respect = createRespect(g);
g.activities = createActivities(g);
g.save = createSave(g);
g.hud = createHud(g);
g.menus = createMenus(g);
g.minimap = createMinimap(g);
g.ui = createUi(g);
g.chaseCamera = createCamera(g);
camera.snap = (pos, heading) => g.chaseCamera.snap(pos, heading);
camera.snapBehind = () => g.chaseCamera.snapBehind();
g.radio = createRadio(g);
g.effects = createEffects(g);

g.applyPhotos = function () {
  const tex = {};
  const load = (key, file) => new Promise((res) => {
    new THREE.TextureLoader().load('./' + file, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      tex[key] = t;
      res();
    }, undefined, () => res());
  });
  const facadeTex = (base, label) => {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 256;
    const c = cv.getContext('2d');
    c.fillStyle = base;
    c.fillRect(0, 0, 256, 256);
    const fr = g.rng.fork('facade' + label);
    for (let r = 0; r < 10; r++) for (let col = 0; col < 6; col++) {
      const x = 14 + col * 40, y = 12 + r * 24;
      const v = fr.float(0, 1);
      c.fillStyle = v < 0.55 ? '#141c28' : v < 0.8 ? '#ffcf7a' : '#bcd8ff';
      c.fillRect(x, y, 24, 15);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const genGlass = facadeTex('#2b3648', 'g');
  const genConc = facadeTex('#5a5148', 'c');
  return Promise.all([
    load('brick', 'tex2-brick.png'), load('glass', 'tex2-glass.png'),
    load('concrete', 'tex2-concrete.png'), load('barber', 'tex2-barber.png')
  ]).then(() => {
    let heroes = 0, fixed = 0;
    scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== 'BoxGeometry') return;
      if (!o.material || Array.isArray(o.material)) return;
      const p = o.geometry.parameters;
      const col = o.material.color;
      const lum = col ? (col.r + col.g + col.b) / 3 : 0;
      if (o.userData && o.userData.hero) {
        const band = p.height <= 60 ? 'brick' : p.height <= 90 ? 'concrete' : 'glass';
        const t = tex[band] || tex.brick;
        if (!t) return;
        const tt = t.clone();
        tt.needsUpdate = true;
        tt.repeat.set(1, Math.max(1, Math.round(p.height / 56)));
        tt.wrapS = tt.wrapT = THREE.RepeatWrapping;
        o.material = o.material.clone();
        o.material.color.set(0xbbbbbb); if (o.material.emissive) o.material.emissiveIntensity = 0.08;
        o.material.map = tt;
        o.material.needsUpdate = true;
        heroes++;
      } else if (p.height >= 30 && lum > 0.7) {
        const t = genGlass.clone();
        t.needsUpdate = true;
        t.repeat.set(Math.max(1, Math.round(p.width / 14)), Math.max(1, Math.round(p.height / 26)));
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        o.material = o.material.clone();
        o.material.color.set(0xffffff); if (o.material.emissive) o.material.emissiveIntensity = 0.08;
        o.material.map = t;
        o.material.needsUpdate = true;
        fixed++;
      } else if (!o.material.map && p.height >= 15 && lum > 0.65) {
        const t = (p.height >= 40 ? genGlass : genConc).clone();
        t.needsUpdate = true;
        t.repeat.set(Math.max(1, Math.round(p.width / 14)), Math.max(1, Math.round(p.height / 26)));
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        o.material = o.material.clone();
        o.material.color.set(0xffffff); if (o.material.emissive) o.material.emissiveIntensity = 0.08;
        o.material.map = t;
        o.material.needsUpdate = true;
        fixed++;
      }
    });
    return {heroes, fixed};
  });
};

g.newGame = function () {
  g.player.money = 500;
  g.player.health = g.player.maxHealth();
  g.player.armour = 0;
  g.respect.set(0);
  g.story.done = 0;
  g.wanted.clear();
  g.dispatch.clear();
  g.missions.active = null;
  g.player.placeAt(-225, -45, 0);
  g.mode = 'play';
  g.menus.hideTitle();
  g.missions.start('first-errand');
  g.chaseCamera.snapBehind();
};

g.finishStory = function (n) {
  g.story.done = Math.min(8, n);
  g.respect.set(g.story.done * 400);
  g.player.money = 500 + g.story.done * 3000;
};

const VPOS = (v) => v.pos || v.position;

let eCooldown = 0;
function handleKeys(dt) {
  const inp = g.input;
  eCooldown -= dt;
  if (inp.hit('KeyE') && eCooldown <= 0) {
    eCooldown = 0.35;
    if (g.player.vehicle) g.player.exitVehicle();
    else {
      const v = g.fleet.nearest(g.player.pos.x, g.player.pos.z, 4.5);
      if (v) g.player.enterVehicle(v);
    }
  }
  if (inp.hit('KeyQ')) g.loadout.cycle();
  if (inp.hit('KeyM') && !g.missions.active) g.missions.startNext();
  if (inp.hit('KeyP') || inp.hit('Escape')) {
    if (g.mode === 'play') { g.mode = 'paused'; g.menus.showPause(); }
    else if (g.mode === 'paused') { g.mode = 'play'; g.menus.hidePause(); }
  }
  if (inp.hit('KeyG')) {
    const sh = document.getElementById('shop-screen');
    if (sh.classList.contains('hidden')) g.menus.showShop(); else g.menus.hideShop();
  }
  if (inp.hit('KeyT')) g.activities.startFare();
  if (inp.hit('KeyR')) g.activities.startRace(0);
  if (inp.hit('Digit1') || inp.hit('Digit2') || inp.hit('Digit3')) g.radio.next();
  if (inp.hit('KeyZ') && g.wanted) { g.wanted.heat = Math.max(0, g.wanted.heat - 20); g.wanted.recalc(); if (g.hud) g.hud.notify('Dee: heat dropped'); }
  if (inp.hit('KeyX')) { if (g.hud) g.hud.notify('Pilar: eyes on the SBPD'); }
  if (inp.hit('KeyC') && g.player.vehicle) { g.player.vehicle.health = Math.min(g.player.vehicle.maxHealth, g.player.vehicle.health + 50); if (g.hud) g.hud.notify('Juno: patched up'); }
  if (inp.hit('KeyF') && !g.player.vehicle) g.combat.punch();
  if (inp.down('Mouse0') && !g.player.vehicle) g.combat.tryFire(dt);
  if (inp.down('Mouse0') && g.player.vehicle && g.player.vehicle.kind === 'sprint') g.combat.tryFire(dt);
  if (inp.hit('Space') && !g.player.vehicle && g.player.jump) g.player.jump();
}

function fixedStep(dt) {
  g.time += dt;
  g.clock.h = (g.clock.h + dt / 360) % 24;
  g.sky.setHour(g.clock.h);
  if (g.mode === 'play') {
    handleKeys(dt);
    g.player.update(dt, g.input);
    g.traffic.update(dt);
    g.fleet.update(dt);
    g.pedestrians.update(dt);
    g.combat.update(dt);
    g.wanted.update(dt);
    g.dispatch.update(dt);
    g.missions.update(dt);
    g.activities.update(dt);
    g.ui.update(dt);
    g.radio.update(dt);
    const tp = g.player.vehicle ? VPOS(g.player.vehicle) : g.player.pos;
    const ty = g.player.vehicle ? 2 : 1.6;
    g.chaseCamera.update(dt, new THREE.Vector3(tp.x, ty, tp.z), g.player.vehicle ? g.player.vehicle.heading : g.player.yaw);
  }
  g.effects.update(dt);
  g.sky.update(dt, g.time);
  if (g.city.update) g.city.update(dt);
  if (g.mode === 'play' || g.mode === 'paused') g.hud.update(dt);
  g.input.endFrame();
}

g.fixedStep = fixedStep;
g.render = function () { renderer.render(scene, camera); };

function stageShot(name) {
  g.god = true;
  g.menus.hideTitle();
  g.mode = 'play';
  if (name === 'drive') {
    const v = g.fleet.spawn('sprint', -90, -45, Math.PI / 2, 0xc02030);
    v.parked = false;
    g.player.placeAt(-90, -45, Math.PI / 2);
    g.player.enterVehicle(v);
    v.speed = 19;
    v.velocity.set(Math.sin(v.heading) * 19, 0, Math.cos(v.heading) * 19);
    g.wanted.set(2);
    g.dispatch.spawnUnit('interceptor');
    g.dispatch.spawnUnit('interceptor');
    const u0 = g.dispatch.units[0], u1 = g.dispatch.units[1];
    if (u0) { VPOS(u0.vehicle).set(-104, 0, -71); u0.vehicle.heading = Math.PI / 2; u0.vehicle.speed = 17; }
    if (u1) { VPOS(u1.vehicle).set(-58, 0, -45); u1.vehicle.heading = -Math.PI / 2; u1.vehicle.speed = 15; }
    g.missions.start('first-errand');
    g.ui.hideDialogue();
    document.getElementById('hud-banner').classList.add('hidden');
    g.chaseCamera.snap(new THREE.Vector3(-90, 2, -45), Math.PI / 2);
    for (let i = 0; i < 30; i++) fixedStep(1 / 60);
    g.player.money = 500;
    if (g.respect) g.respect.set(0);
    g.hud.update(0.3);
    const cp = VPOS(v);
    const hd = v.heading;
    g.camera.position.set(cp.x - Math.sin(hd) * 11 + Math.cos(hd) * 4.5, 3.4, cp.z - Math.cos(hd) * 11 - Math.sin(hd) * 4.5);
    g.camera.lookAt(cp.x + Math.sin(hd) * 8, 1.5, cp.z + Math.cos(hd) * 8);
  } else if (name === 'chase') {
    g.player.placeAt(45, -45, Math.PI);
    g.player.aiming = true;
    g.loadout.select('rifle');
    g.wanted.set(3);
    g.dispatch.spawnUnit('interceptor');
    g.dispatch.spawnUnit('interceptor');
    g.dispatch.spawnUnit('bulwark');
    const jn = g.plan.nearestJunction(45, -20);
    const v1 = g.fleet.spawn('interceptor', jn.x - 6, jn.z, 0);
    const v2 = g.fleet.spawn('interceptor', jn.x + 6, jn.z, 0);
    v1.parked = true; v2.parked = true;
    g.dispatch.roadblock = [v1, v2];
    for (let i = 0; i < 3; i++) g.pedestrians.spawn(45 + i * 6 - 6, -30, 'guard');
    g.missions.start('raid-stand');
    g.combat.explodeAt({x: 45, z: -18});
    for (let i = 0; i < 16; i++) fixedStep(1 / 60);
    g.ui.hideDialogue();
    document.getElementById('hud-banner').classList.add('hidden');
    g.camera.position.set(41.5, 3.4, -36.5);
    g.camera.lookAt(45, 1.6, -20);
  } else if (name === 'mission') {
    g.player.money = 2840;
    g.respect.set(150);
    g.player.stats.kills = 12;
    g.player.stats.carsStolen = 7;
    g.player.stats.earned = 3200;
    g.activities.coinsCollected = 6;
    g.story.done = 0;
    g.missions.start('first-errand');
    for (let i = 0; i < 20; i++) fixedStep(1 / 60);
    g.mode = 'paused';
    g.menus.showPause();
    g.ui.hideDialogue();
    document.getElementById('hud-banner').classList.add('hidden');
    g.camera.position.set(-225, 14, -10);
    g.camera.lookAt(-225, 2, -45);
  } else if (name === 'title') {
    g.mode = 'title';
    g.menus.showTitle();
    g.camera.position.set(120, 42, 250);
    g.camera.lookAt(45, 60, -45);
  }
  g.render();
  g.render();
  window.__shotReady = true;
  window.__gameReady = true;
  window.__ready = true;
  document.title = 'SOLMAR BAY — shot ready';
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

g.player.placeAt(-225, -45, 0);
if (g.traffic.init) g.traffic.init();
if (g.pedestrians.init) g.pedestrians.init();
if (g.activities.init) g.activities.init();
g.sky.setHour(g.clock.h);

g.applyPhotos().then(() => {
  if (shot) {
    stageShot(shot);
  } else {
    g.menus.showTitle();
    let last = performance.now();
    let acc = 0;
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= 1 / 60) { fixedStep(1 / 60); acc -= 1 / 60; }
      if (g.mode === 'title') {
        g.time += dt;
        g.sky.update(dt, g.time);
        camera.position.set(-225 + Math.sin(g.time * 0.05) * 40, 16, -45 + 90);
        camera.lookAt(45, 50, -45);
      }
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
});
