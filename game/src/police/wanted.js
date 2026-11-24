export function createWanted(g) {
  const TH = [0, 10, 28, 60, 110, 180];
  const w = {
    heat: 0, stars: 0, minStars: 0, hiddenT: 0, seen: false, lastSeen: {x: 0, z: 0},
    searchR: 24, escapeT: 0, _heatT: 0,
    set(level) {
      w.stars = Math.max(0, Math.min(5, level));
      w.minStars = w.stars;
      w.heat = TH[w.stars];
      w.seen = true;
      w.lastSeen.x = g.player.pos.x; w.lastSeen.z = g.player.pos.z;
      g.bus.emit('wanted', w.stars);
    },
    clear() {
      w.heat = 0; w.stars = 0; w.minStars = 0; w.seen = false;
      g.bus.emit('wanted', 0);
    },
    addHeat(amount, x, z) {
      w._heatT -= 1;
      if (amount >= 4 && w._heatT > 0 && amount < 14) return;
      if (amount >= 4) w._heatT = 1.5;
      let witnessed = false;
      if (g.pedestrians) for (const n of g.pedestrians.npcs) {
        if (!n.dead && Math.hypot(n.pos.x - x, n.pos.z - z) < 55) { witnessed = true; break; }
      }
      if (!witnessed && g.dispatch) for (const u of g.dispatch.units) {
        const up = u.vehicle.pos || u.vehicle.position;
        if (Math.hypot(up.x - x, up.z - z) < 40) { witnessed = true; break; }
      }
      if (!witnessed && w.stars === 0 && amount < 14) return;
      w.heat += amount;
      w.seen = true;
      w.hiddenT = 0;
      w.lastSeen.x = x; w.lastSeen.z = z;
      w.recalc();
    },
    recalc() {
      let s = 0;
      for (let i = 5; i >= 0; i--) if (w.heat >= TH[i]) { s = i; break; }
      s = Math.max(s, w.minStars);
      if (s !== w.stars) {
        w.stars = s;
        g.bus.emit('wanted', s);
        if (g.hud) g.hud.wantedBanner(s);
      }
    },
    update(dt) {
      const p = g.player.pos;
      const d = Math.hypot(p.x - w.lastSeen.x, p.z - w.lastSeen.z);
      let anyoneSees = false;
      if (g.dispatch) for (const u of g.dispatch.units) {
        const up = u.vehicle.pos || u.vehicle.position;
        if (Math.hypot(up.x - p.x, up.z - p.z) < 100) { anyoneSees = true; break; }
      }
      if (anyoneSees || d < 14) {
        w.seen = true;
        w.hiddenT = 0;
        w.lastSeen.x = p.x; w.lastSeen.z = p.z;
        w.escapeT = 0;
      } else {
        w.hiddenT += dt;
        if (w.hiddenT > 2.5) {
          w.heat = Math.max(w.minStars > 0 ? TH[w.minStars] : 0, w.heat - 0.4 * dt);
          w.searchR = Math.min(140, 24 + 7 * (w.hiddenT - 2.5));
          w.escapeT += dt;
          if (w.escapeT > 8 + 3.5 * w.stars && w.stars > 0) {
            w.minStars = 0;
            w.heat = 0;
            w.stars = 0;
            w.seen = false;
            g.bus.emit('wanted', 0);
            if (g.player) g.player.stats.copsEvaded++;
            if (g.hud) g.hud.notify('Lost the heat');
          }
        }
      }
      w.recalc();
    }
  };
  g.wanted = w;
  return w;
}
