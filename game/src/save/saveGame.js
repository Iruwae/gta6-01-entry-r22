export function createSave(g) {
  const KEY = 'solmar-bay-save-';
  const s = {
    slots: [null, null, null],
    read(i) {
      try { return JSON.parse(localStorage.getItem(KEY + i)); } catch (e) { return null; }
    },
    write(i) {
      const data = {
        money: g.player.money, rp: g.respect ? g.respect.rp : 0,
        missions: g.story ? g.story.done : 0,
        conches: g.activities ? g.activities.coinsCollected : 0,
        stats: g.player.stats, time: g.clock.h,
        x: g.player.pos.x, z: g.player.pos.z
      };
      try { localStorage.setItem(KEY + i, JSON.stringify(data)); } catch (e) {}
      s.slots[i] = data;
      return data;
    },
    load(i) {
      const d = s.read(i);
      if (!d) return false;
      g.player.money = d.money;
      if (g.respect) g.respect.set(d.rp);
      if (g.story) g.story.done = d.missions;
      if (g.activities) g.activities.coinsCollected = d.conches;
      Object.assign(g.player.stats, d.stats || {});
      g.player.placeAt(d.x, d.z, 0);
      return true;
    },
    auto() { s.write(0); },
    summary(i) {
      const d = s.slots[i] || s.read(i);
      if (!d) return 'SLOT ' + (i + 1) + ' — EMPTY';
      return 'SLOT ' + (i + 1) + ' — $' + d.money + ' · ' + d.missions + '/8 jobs';
    }
  };
  for (let i = 0; i < 3; i++) s.slots[i] = s.read(i);
  g.save = s;
  return s;
}
