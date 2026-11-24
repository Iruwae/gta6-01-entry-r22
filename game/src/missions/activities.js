import { createVehicle } from '../vehicles/carPhysics.js';
export function createActivities(game) {
  const acts = {
    fare: null,
    race: null,
    coins: [],
    coinsCollected: 0,
    rangeActive: false,
    rangeTargets: [],
    rangeScore: 0,
    startFare() {
      if (acts.fare) return false;
      const p = game.player;
      const j = game.plan.nearestJunction(p.position.x + game.rng.range(-80, 80), p.position.z + game.rng.range(-80, 80));
      const dest = game.plan.nearestJunction(p.position.x + game.rng.range(-500, 500), p.position.z + game.rng.range(-500, 500));
      acts.fare = { pickup: j, dest, timer: 90, pickedUp: false, startCondition: p.vehicle ? p.vehicle.condition : 100 };
      game.ui.setMarker(j.x, j.z, 'Pick up the fare');
      game.ui.showToast('FARE — pick up the passenger');
      return true;
    },
    completeFare() {
      const f = acts.fare;
      const d = Math.hypot(f.dest.x - f.pickup.x, f.dest.z - f.pickup.z);
      const pay = Math.round(40 + d * 0.4);
      const tip = game.player.vehicle && game.player.vehicle.condition >= f.startCondition - 5 ? 25 : 0;
      game.player.money += pay + tip;
      game.player.stats.earned += pay + tip;
      game.respect.add(6);
      game.ui.showToast(`FARE DONE +$${pay + tip}`);
      acts.fare = null;
      game.ui.clearMarker();
    },
    failFare(reason) {
      game.ui.showToast(`FARE LOST — ${reason}`);
      acts.fare = null;
      game.ui.clearMarker();
    },
    startRace() {
      if (acts.race) return false;
      const p = game.player;
      if (game.player.money < 150) { game.ui.showToast('Need $150 to enter the race'); return false; }
      game.player.money -= 150;
      const j = game.plan.nearestJunction(p.position.x, p.position.z);
      const cps = [];
      for (let i = 1; i <= 3; i++) cps.push(game.plan.nearestJunction(p.position.x + game.rng.range(-400, 400) * i, p.position.z + game.rng.range(-400, 400) * i));
      const rival = game.fleet.spawn('marisol', j.x - 8, j.z, 1.2, 'race-rival');
      rival.parked = false;
      acts.race = { checkpoints: cps, index: 0, rival, timer: 0 };
      game.ui.setMarker(cps[0].x, cps[0].z, 'Race checkpoint 1 of 3');
      game.ui.showToast('STREET RACE — first to checkpoint 3 wins');
      return true;
    },
    finishRace(won) {
      if (won) {
        game.player.money += 600;
        game.player.stats.earned += 600;
        game.respect.add(25);
        game.ui.showToast('RACE WON +$600');
      } else {
        game.ui.showToast('RACE LOST — the rival took the $150');
      }
      if (acts.race.rival) game.fleet.remove(acts.race.rival);
      acts.race = null;
      game.ui.clearMarker();
    },
    placeCoins() {
      const spots = game.plan.places.filter((p) => p.id !== 'hq');
      for (let i = 0; i < 20; i++) {
        const place = spots[i % spots.length];
        const x = place.x + game.rng.range(-18, 18);
        const z = place.z + game.rng.range(-18, 18);
        const mesh = game.effects.coinMesh(x, z);
        acts.coins.push({ x, z, mesh, taken: false });
      }
    },
    collectCoins() {
      const p = game.player;
      for (const c of acts.coins) {
        if (c.taken) continue;
        if (Math.hypot(p.position.x - c.x, p.position.z - c.z) < 3) {
          c.taken = true;
          c.mesh.visible = false;
          acts.coinsCollected++;
          game.player.money += 50;
          game.respect.add(2);
          game.ui.showToast(`SOL COIN ${acts.coinsCollected}/20 +$50`);
        }
      }
    },
    startRange() {
      if (acts.rangeActive) return false;
      const place = game.plan.placeById.get('coral-keys');
      acts.rangeActive = true;
      acts.rangeScore = 0;
      acts.rangeTimer = 30;
      for (let i = 0; i < 6; i++) {
        const t = game.effects.targetMesh(place.x + game.rng.range(-20, 20), place.z + game.rng.range(-20, 20));
        acts.rangeTargets.push({ mesh: t, alive: true });
      }
      game.ui.showToast('SHOOTING RANGE — 30 seconds, hit the targets');
      return true;
    },
    endRange() {
      acts.rangeActive = false;
      const pay = acts.rangeScore * 20;
      game.player.money += pay;
      game.ui.showToast(`RANGE DONE — ${acts.rangeScore} hits +$${pay}`);
      for (const t of acts.rangeTargets) game.effects.removeMesh(t.mesh);
      acts.rangeTargets = [];
    },
    step(dt) {
      const p = game.player;
      if (acts.fare) {
        acts.fare.timer -= dt;
        if (acts.fare.timer <= 0) { acts.failFare('Too slow'); return; }
        if (!acts.fare.pickedUp) {
          const d = Math.hypot(p.position.x - acts.fare.pickup.x, p.position.z - acts.fare.pickup.z);
          if (d < 8 && p.vehicle) {
            acts.fare.pickedUp = true;
            game.ui.setMarker(acts.fare.dest.x, acts.fare.dest.z, 'Drop off the fare');
            game.ui.showToast('Passenger aboard — drive to the marker');
          }
        } else {
          const d = Math.hypot(p.position.x - acts.fare.dest.x, p.position.z - acts.fare.dest.z);
          if (d < 10 && p.vehicle) acts.completeFare();
        }
      }
      if (acts.race) {
        acts.race.timer += dt;
        const cp = acts.race.checkpoints[acts.race.index];
        const d = Math.hypot(p.position.x - cp.x, p.position.z - cp.z);
        if (d < 12) {
          acts.race.index++;
          if (acts.race.index >= acts.race.checkpoints.length) { acts.finishRace(true); return; }
          const next = acts.race.checkpoints[acts.race.index];
          game.ui.setMarker(next.x, next.z, `Race checkpoint ${acts.race.index + 1} of 3`);
        }
        const r = acts.race.rival;
        if (r && !r.wrecked) {
          const rdx = cp.x - r.position.x;
          const rdz = cp.z - r.position.z;
          const want = Math.atan2(rdx, rdz);
          let dh = want - r.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          game.driveVehicle(r, { forward: 1, steer: Math.max(-1, Math.min(1, dh * 2)), handbrake: false }, dt);
          if (Math.hypot(r.position.x - cp.x, r.position.z - cp.z) < 12) {
            acts.race.index++;
            if (acts.race.index >= acts.race.checkpoints.length) { acts.finishRace(false); return; }
          }
        }
        if (acts.race.timer > 300) acts.finishRace(false);
      }
      if (acts.rangeActive) {
        acts.rangeTimer -= dt;
        if (acts.rangeTimer <= 0) acts.endRange();
      }
      acts.collectCoins();
    },
  };
  return acts;
}