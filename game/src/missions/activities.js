import * as THREE from 'three';
export function createActivities(g) {
  const rng = g.rng.fork('activities');
  const coins = [];
  const coinGeo = new THREE.OctahedronGeometry(0.5);
  const coinMat = new THREE.MeshStandardMaterial({color: 0xf0c040, emissive: 0xa08020, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.3});
  const act = {
    coinsCollected: 0, coins, pickups: [],
    fare: null, race: null, vigilante: null, robbery: null,
    init() {
      for (let i = 0; i < 20; i++) {
        const jn = g.plan.junctions[rng.int(0, g.plan.junctions.length - 1)];
        const m = new THREE.Mesh(coinGeo, coinMat);
        m.position.set(jn.x + rng.float(-8, 8), 1.2, jn.z + rng.float(-8, 8));
        g.scene.add(m);
        coins.push({mesh: m, taken: false});
      }
    },
    addPickup(x, z, kind) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({color: 0x40e080, emissive: 0x208040, emissiveIntensity: 0.5}));
      m.position.set(x, 1, z);
      g.scene.add(m);
      const pk = {mesh: m, x, z, kind, taken: false};
      act.pickups.push(pk);
      return pk;
    },
    startFare() {
      if (act.fare) return;
      const p = g.player.pos;
      const a = rng.float(0, Math.PI * 2);
      const d = rng.float(90, 260);
      const jn = g.plan.nearestJunction(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d);
      act.fare = {pickup: jn, stage: 'pickup', t: 0, streak: 0};
      if (g.hud) g.hud.notify('Taxi fare: pick up at ' + g.plan.streetName(jn.x, jn.z));
    },
    startRace(idx) {
      const races = [
        {name: 'Ocean Drive Dash', par: 62},
        {name: 'Vidrio Loop', par: 48},
        {name: 'Tarpon Bridge Run', par: 70}
      ];
      const r = races[idx % 3];
      act.race = {name: r.name, par: r.par, t: 0, gates: 0};
      if (g.hud) g.hud.notify('Race: ' + r.name + ' — par ' + r.par + 's');
    },
    startVigilante() {
      if (act.vigilante) return;
      const p = g.player.pos;
      const a = rng.float(0, Math.PI * 2);
      const d = rng.float(130, 320);
      const v = g.fleet.spawn('fizz', p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, 0, 0x802020);
      v.parked = false;
      v.cruise = 17;
      v.ai = (vv, dt) => {
        const jn = g.plan.nearestJunction(vv.pos.x + Math.cos(rng.float(0, 6.28)) * 100, vv.pos.z + Math.sin(rng.float(0, 6.28)) * 100);
        const want = Math.atan2(jn.x - vv.pos.x, jn.z - vv.pos.z);
        let dh = want - vv.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        g.carPhysics.step(vv, {forward: true, back: false, left: dh > 0.1, right: dh < -0.1, brake: false, handbrake: false}, dt);
      };
      act.vigilante = {car: v, level: 1, t: 75 + d / 6};
      if (g.hud) g.hud.notify('Vigilante: stop the getaway car');
    },
    robStore() {
      if (act.robbery) return;
      act.robbery = {hold: 3.2, t: 0};
      if (g.hud) g.hud.notify('Hold up the store…');
    },
    buyService(kind) {
      const prices = {respray: 350, food: 12, clinic: 80, armour: 400};
      const cost = prices[kind];
      if (cost === undefined || g.player.money < cost) return false;
      g.player.money -= cost;
      if (kind === 'food') g.player.heal(40);
      if (kind === 'clinic') g.player.health = g.player.maxHealth();
      if (kind === 'armour') g.player.armour = 100;
      if (kind === 'respray' && g.player.vehicle) g.player.vehicle.health = g.player.vehicle.maxHealth;
      return true;
    },
    update(dt) {
      const p = g.player.pos;
      for (const c of coins) {
        if (c.taken) continue;
        c.mesh.rotation.y += dt * 2;
        if (Math.hypot(p.x - c.mesh.position.x, p.z - c.mesh.position.z) < (g.player.vehicle ? 2.6 : 1.4)) {
          c.taken = true;
          g.scene.remove(c.mesh);
          act.coinsCollected++;
          g.player.stats.conches++;
          g.player.money += 250;
          if (g.respect) g.respect.add(10);
          if (g.hud) g.hud.notify('SOL coin ' + act.coinsCollected + '/20  +$250');
          if (act.coinsCollected === 20) { g.player.money += 10000; if (g.hud) g.hud.notify('All 20 SOL coins! +$10,000'); }
        }
      }
      for (const pk of act.pickups) {
        if (pk.taken) continue;
        pk.mesh.rotation.y += dt * 2;
        if (Math.hypot(p.x - pk.x, p.z - pk.z) < 2) {
          pk.taken = true;
          g.scene.remove(pk.mesh);
          if (g.missions) g.missions.collected++;
        }
      }
      if (act.fare) {
        const f = act.fare;
        f.t += dt;
        const tgt = f.stage === 'pickup' ? f.pickup : f.drop;
        if (tgt && Math.hypot(p.x - tgt.x, p.z - tgt.z) < 10) {
          if (f.stage === 'pickup') {
            const a = rng.float(0, Math.PI * 2);
            const dd = rng.float(180, 480);
            const jn = g.plan.nearestJunction(p.x + Math.cos(a) * dd, p.z + Math.sin(a) * dd);
            f.drop = jn;
            f.stage = 'drop';
            f.allow = 16 + dd / 8.5;
            f.t = 0;
            f.dist = dd;
          } else {
            const pay = Math.round(40 + 0.45 * (f.dist || 200) + 3 * Math.max(0, f.allow - f.t) + 15 * f.streak);
            g.player.money += pay;
            g.player.stats.earned += pay;
            g.player.stats.fares++;
            if (g.respect) g.respect.add(15);
            if (g.hud) g.hud.notify('Fare done +$' + pay);
            act.fare = null;
          }
        } else if (f.stage === 'drop' && f.t > f.allow) {
          if (g.hud) g.hud.notify('Fare failed');
          act.fare = null;
        }
      }
      if (act.race) {
        act.race.t += dt;
        if (act.race.t > act.race.par * 1.5) {
          const pay = act.race.t <= act.race.par ? 900 : act.race.t <= act.race.par * 1.25 ? 400 : 120;
          g.player.money += pay;
          if (g.respect) g.respect.add(45);
          if (g.hud) g.hud.notify('Race done +$' + pay);
          act.race = null;
        }
      }
      if (act.vigilante) {
        const vg = act.vigilante;
        vg.t -= dt;
        if (vg.car.wrecked || vg.car.health <= 0) {
          const pay = 300 + 150 * vg.level;
          g.player.money += pay;
          if (g.respect) g.respect.add(30);
          if (g.hud) g.hud.notify('Vigilante +$' + pay);
          act.vigilante = null;
        } else if (vg.t <= 0) {
          g.fleet.remove(vg.car);
          act.vigilante = null;
        }
      }
      if (act.robbery) {
        act.robbery.t += dt;
        if (act.robbery.t >= 3.2) {
          const pay = rng.int(240, 620);
          g.player.money += pay;
          g.player.stats.robberies++;
          if (g.respect) g.respect.add(25);
          if (g.wanted) g.wanted.addHeat(8, p.x, p.z);
          if (g.hud) g.hud.notify('Robbery +$' + pay);
          act.robbery = null;
        }
      }
    }
  };
  g.activities = act;
  return act;
}
