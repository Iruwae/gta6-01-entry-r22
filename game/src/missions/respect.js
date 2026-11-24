export const RESPECT_RANKS = [
  { name: 'NOBODY', rp: 0 },
  { name: 'DOCK HAND', rp: 40 },
  { name: 'HARBOR FIXER', rp: 130 },
  { name: 'FIXER', rp: 270 },
  { name: 'SHOT CALLER', rp: 470 },
  { name: 'KINGPIN', rp: 700 },
];
export function createRespect(game) {
  const respect = {
    rp: 0,
    rank() {
      let cur = RESPECT_RANKS[0];
      for (const r of RESPECT_RANKS) if (respect.rp >= r.rp) cur = r;
      return cur;
    },
    next() {
      for (const r of RESPECT_RANKS) if (r.rp > respect.rp) return r;
      return null;
    },
    progress() {
      const cur = respect.rank();
      const next = respect.next();
      if (!next) return 1;
      return (respect.rp - cur.rp) / (next.rp - cur.rp);
    },
    add(amount) {
      const before = respect.rank().name;
      respect.rp += amount;
      const after = respect.rank().name;
      if (after !== before) {
        game.ui.showToast(`RESPECT UP — ${after}`);
        game.bus.emit('rank-up', { rank: after });
      }
      game.save.data.rp = respect.rp;
    },
  };
  return respect;
}
export function createStanding(game) {
  const standing = {
    values: {},
    init() {
      for (const d of game.plan.districts) standing.values[d.id] = 0;
    },
    value(id) { return standing.values[id] || 0; },
    add(id, amount) {
      if (standing.values[id] === undefined) standing.values[id] = 0;
      standing.values[id] = Math.max(-100, Math.min(100, standing.values[id] + amount));
    },
    districtAt(x, z) {
      const d = game.plan.districtAt(x, z);
      return d ? d.id : 'harbor';
    },
    bars() {
      return game.plan.districts.map((d) => ({ id: d.id, name: d.name, value: standing.value(d.id) }));
    },
  };
  return standing;
}