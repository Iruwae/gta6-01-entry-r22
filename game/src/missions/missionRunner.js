export function createMissionRunner(g) {
  const rng = g.rng.fork('missions');
  const mr = {
    active: null, stepIdx: 0, stepState: null, timer: 0, kills: 0, collected: 0,
    start(id) {
      const m = g.story.byId(id);
      if (!m) return false;
      mr.active = m;
      mr.stepIdx = 0;
      mr.kills = 0;
      mr.collected = 0;
      mr.setupStep();
      if (g.hud) g.hud.missionCard(m);
      if (g.ui) g.ui.queueDialogue(m.dialogue);
      g.bus.emit('missionStart', m);
      return true;
    },
    startNext() {
      const idx = g.story.done;
      if (idx >= g.story.list.length) return false;
      return mr.start(g.story.list[idx].id);
    },
    curStep() {
      return mr.active ? mr.active.steps[mr.stepIdx] : null;
    },
    setupStep() {
      const s = mr.curStep();
      if (!s) return;
      mr.timer = s.timer || 0;
      mr.stepState = {count: s.count || 0};
      const place = g.plan.places[s.target];
      if (place && (s.kind === 'kill' || s.kind === 'boss')) {
        const n = s.kind === 'boss' ? 1 : (s.count || 4);
        mr.stepState.guards = [];
        for (let i = 0; i < n; i++) {
          const gx = place.x + rng.float(-12, 12), gz = place.z + rng.float(-12, 12);
          const gd = g.pedestrians.spawn(gx, gz, 'guard');
          if (s.kind === 'boss') gd.health = 520;
          mr.stepState.guards.push(gd);
        }
      }
      if (place && s.kind === 'collect') {
        for (let i = 0; i < (s.count || 3); i++) {
          const jn = g.plan.junctions[rng.int(0, g.plan.junctions.length - 1)];
          if (g.activities) g.activities.addPickup(jn.x, jn.z, 'package');
        }
      }
      if (place && s.kind === 'steal') {
        const v = g.fleet.spawn('sprint', place.x + 10, place.z + 6, 0, 0xd8b020);
        v.parked = true;
        mr.stepState.car = v;
      }
    },
    advance() {
      mr.stepIdx++;
      if (mr.stepIdx >= mr.active.steps.length) mr.complete();
      else mr.setupStep();
    },
    complete() {
      const m = mr.active;
      const reward = m.payout;
      g.player.money += reward;
      g.player.stats.earned += reward;
      if (g.respect) g.respect.add(120 + Math.round(reward / 60));
      g.story.done++;
      if (g.hud) g.hud.missionPass(m, reward);
      if (g.save) g.save.auto();
      g.bus.emit('missionPass', m);
      mr.active = null;
      mr.stepIdx = 0;
    },
    fail(reason) {
      const m = mr.active;
      if (g.hud) g.hud.missionFail(m, reason);
      g.bus.emit('missionFail', m);
      mr.active = null;
      mr.stepIdx = 0;
    },
    update(dt) {
      if (!mr.active) return;
      const s = mr.curStep();
      if (!s) return;
      if (mr.timer > 0) {
        mr.timer -= dt;
        if (mr.timer <= 0) { mr.fail('Out of time'); return; }
      }
      const p = g.player.pos;
      const place = g.plan.places[s.target];
      if (!place) return;
      const d = Math.hypot(p.x - place.x, p.z - place.z);
      if (s.kind === 'drive' || s.kind === 'deliver') {
        if (d < 12) mr.advance();
      } else if (s.kind === 'steal') {
        if (g.player.vehicle === mr.stepState.car) mr.advance();
      } else if (s.kind === 'escape') {
        if (g.wanted && g.wanted.stars === 0) mr.advance();
      } else if (s.kind === 'kill' || s.kind === 'boss') {
        const gs = mr.stepState.guards || [];
        if (gs.length > 0 && gs.every(n => n.dead)) mr.advance();
      } else if (s.kind === 'collect') {
        if (mr.collected >= (s.count || 3)) mr.advance();
      }
      if (g.player.dead) mr.fail('Wasted');
    }
  };
  g.missions = mr;
  return mr;
}
