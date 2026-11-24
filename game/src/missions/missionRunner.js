import { MISSIONS, DIALOGUE } from './story.js';
export function createMissionRunner(game) {
  const rn = {
    active: null,
    si: 0,
    timer: 0,
    marker: null,
    guards: [],
    rival: null,
    missionList() {
      return MISSIONS.map((m) => {
        const done = game.save.data.missionsDone.includes(m.id);
        return { id: m.id, title: m.title, giver: m.giver, reward: m.reward, done, available: !done && (!rn.active || rn.active.id === m.id) };
      });
    },
    currentStage() {
      if (!rn.active) return null;
      return rn.active.stages[rn.si] || null;
    },
    nextStage() {
      if (!rn.active) return null;
      return rn.active.stages[rn.si + 1] || null;
    },
    start(id) {
      const def = MISSIONS.find((m) => m.id === id);
      if (!def || rn.active) return false;
      rn.active = def;
      rn.si = 0;
      rn.timer = 0;
      rn.guards = [];
      rn.rival = null;
      game.bus.emit('mission-start', { id });
      game.ui.showDialogue(DIALOGUE[id === 'first-errand' ? 'intro' : id === 'gold-paint' ? 'goldPaint' : id === 'market-sweep' ? 'marketSweep' : 'bridgeRun']);
      rn.setupStage();
      return true;
    },
    setupStage() {
      const stage = rn.currentStage();
      if (!stage) return;
      if (stage.marker) {
        const pl = game.plan.placeById.get(stage.marker);
        if (pl) game.ui.setMarker(pl.x, pl.z, stage.text);
      }
      if (stage.vehicle) {
        const pl = game.plan.placeById.get(stage.vehicle === 'phantom' ? 'docks' : 'garage');
        const v = game.fleet.spawn(stage.vehicle, pl.x + 6, pl.z + 4, 1.2, stage.vehicle);
        v.parked = true;
        rn.missionVehicle = v;
      }
      if (stage.type === 'clear') {
        const pl = game.plan.placeById.get(stage.area);
        for (let i = 0; i < stage.count; i++) {
          const g = game.pedestrians.spawn(pl.x + game.rng.range(-22, 22), pl.z + game.rng.range(-22, 22), 'guard');
          g.state = 'walk';
          rn.guards.push(g);
        }
      }
      if (stage.type === 'race') {
        const pl = game.plan.placeById.get('docks');
        const rival = game.fleet.spawn(stage.rival, pl.x - 6, pl.z, 1.2, 'rival');
        rival.parked = false;
        rn.rival = rival;
        rn.raceFrom = { x: pl.x, y: pl.z };
        rn.timer = 0;
        game.ui.setMarker(game.plan.placeById.get(stage.marker).x, game.plan.placeById.get(stage.marker).z, stage.text);
      }
    },
    completeStage() {
      rn.si++;
      const stage = rn.currentStage();
      if (!stage) { rn.complete(); return; }
      game.bus.emit('stage', { index: rn.si });
      rn.setupStage();
    },
    complete() {
      const m = rn.active;
      game.player.money += m.reward;
      game.player.stats.earned += m.reward;
      game.respect.add(m.rp);
      game.save.data.missionsDone.push(m.id);
      game.save.data.money = game.player.money;
      game.ui.showToast(`JOB DONE — ${m.title} +$${m.reward}`);
      game.ui.showDialogue(DIALOGUE.complete);
      game.bus.emit('mission-complete', { id: m.id, reward: m.reward });
      rn.active = null;
      rn.si = 0;
      game.ui.clearMarker();
    },
    fail(reason) {
      game.ui.showToast(`JOB FAILED — ${reason}`);
      game.ui.showDialogue(DIALOGUE.fail);
      for (const g of rn.guards) game.pedestrians.remove(g);
      if (rn.missionVehicle) game.fleet.remove(rn.missionVehicle);
      if (rn.rival) game.fleet.remove(rn.rival);
      rn.active = null;
      rn.si = 0;
      rn.guards = [];
      game.ui.clearMarker();
      game.bus.emit('mission-fail', { reason });
    },
    step(dt) {
      if (!rn.active) return;
      rn.timer += dt;
      const stage = rn.currentStage();
      if (!stage) return;
      const p = game.player;
      if (stage.type === 'enter') {
        if (p.vehicle && p.vehicle.missionKey === stage.vehicle) {
          if (stage.wanted) game.wanted.set(stage.wanted);
          rn.completeStage();
        }
      } else if (stage.type === 'reach') {
        const pl = game.plan.placeById.get(stage.marker);
        const d = Math.hypot(p.position.x - pl.x, p.position.z - pl.z);
        if (d < 12 && (!stage.needsWanted || game.wanted.level <= stage.needsWanted)) rn.completeStage();
      } else if (stage.type === 'clear') {
        const alive = rn.guards.filter((g) => !g.dead).length;
        if (alive === 0) rn.completeStage();
        for (const g of rn.guards) {
          if (g.dead) continue;
          const d = Math.hypot(g.position.x - p.position.x, g.position.z - p.position.z);
          if (d < 26 && game.rng.chance(dt * 0.4)) {
            game.combat.npcShoot(g.position, p.position, 8);
          }
          if (d < 40) {
            g.state = 'walk';
            g.target = { x: p.position.x, z: p.position.z };
          }
        }
      } else if (stage.type === 'race') {
        const pl = game.plan.placeById.get(stage.marker);
        const d = Math.hypot(p.position.x - pl.x, p.position.z - pl.z);
        if (d < 14) {
          const rivalD = rn.rival ? Math.hypot(rn.rival.position.x - pl.x, rn.rival.position.z - pl.z) : 999;
          if (rivalD > 14) rn.complete();
          else rn.fail('The Phantom beat you to the pier.');
          return;
        }
        if (rn.timer > 240) { rn.fail('Out of time on the bridge.'); return; }
        if (rn.rival && !rn.rival.wrecked) {
          const r = rn.rival;
          const dx = pl.x - r.position.x;
          const dz = pl.z - r.position.z;
          const want = Math.atan2(dx, dz);
          let dh = want - r.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          game.driveVehicle(r, { forward: 1, steer: Math.max(-1, Math.min(1, dh * 2)), handbrake: false }, dt);
        }
      }
      if (rn.missionVehicle && rn.missionVehicle.wrecked) rn.fail('The car was destroyed.');
      if (p.health <= 0) rn.fail('You were taken down.');
    },
  };
  return rn;
}