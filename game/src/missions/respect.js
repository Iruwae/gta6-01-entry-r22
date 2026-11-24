export function createRespect(g) {
  const RANKS = [
    {rp: 0, name: 'NOBODY'},
    {rp: 150, name: 'HARBOR FIXER'},
    {rp: 400, name: 'STREET FIXER'},
    {rp: 800, name: 'FIXER'},
    {rp: 1400, name: 'GETAWAY KID'},
    {rp: 2200, name: 'WHEELMAN'},
    {rp: 3300, name: 'KINGPIN'},
    {rp: 5000, name: 'BAY LEGEND'}
  ];
  const r = {
    rp: 0, ranks: RANKS,
    rankIndex() {
      let i = 0;
      for (let k = 0; k < RANKS.length; k++) if (r.rp >= RANKS[k].rp) i = k;
      return i;
    },
    name() { return RANKS[r.rankIndex()].name; },
    next() { return RANKS[Math.min(RANKS.length - 1, r.rankIndex() + 1)]; },
    progress() {
      const i = r.rankIndex();
      const cur = RANKS[i].rp, nxt = RANKS[Math.min(RANKS.length - 1, i + 1)].rp;
      if (nxt <= cur) return 1;
      return (r.rp - cur) / (nxt - cur);
    },
    add(n) {
      const before = r.rankIndex();
      r.rp += n;
      if (r.rankIndex() > before && g.hud) g.hud.notify('Rank up: ' + r.name());
    },
    set(n) { r.rp = n; }
  };
  g.respect = r;
  return r;
}
