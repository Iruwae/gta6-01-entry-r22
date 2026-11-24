export const WEAPONS = {
  fists: {name: 'FISTS', dmg: 14, interval: 0.38, range: 2, price: 0, pack: 0, clip: 0, inf: true},
  bat: {name: 'BAT', dmg: 38, interval: 0.5, range: 2.4, price: 120, pack: 0, clip: 0, inf: true},
  pistol: {name: 'PISTOL', dmg: 24, interval: 0.26, range: 90, price: 450, pack: 48, clip: 12},
  smg: {name: 'SMG', dmg: 15, interval: 0.085, range: 80, price: 1400, pack: 120, clip: 30},
  shotgun: {name: 'SHOTGUN', dmg: 13, interval: 0.85, range: 38, price: 1900, pack: 24, clip: 6, pellets: 8},
  rifle: {name: 'RIFLE', dmg: 31, interval: 0.12, range: 150, price: 3600, pack: 120, clip: 30},
  rpg: {name: 'GATOR', dmg: 300, interval: 1.6, range: 220, price: 9000, pack: 4, clip: 1}
};
export const SLOT_ORDER = ['fists', 'pistol', 'smg', 'shotgun', 'rifle', 'rpg'];
export function createLoadout(g) {
  const ammo = {fists: Infinity, pistol: 12, smg: 0, shotgun: 0, rifle: 23, rpg: 0};
  const owned = {fists: true, pistol: true, smg: false, shotgun: false, rifle: true, rpg: false};
  const lo = {
    ammo, owned, current: 'pistol',
    give(name, n) {
      if (!WEAPONS[name]) return;
      owned[name] = true;
      if (WEAPONS[name].inf) ammo[name] = Infinity;
      else ammo[name] = (ammo[name] || 0) + (n || WEAPONS[name].pack);
    },
    select(name) {
      if (owned[name]) lo.current = name;
    },
    has(name) { return !!owned[name]; },
    cur() { return WEAPONS[lo.current]; },
    buy(name) {
      const w = WEAPONS[name];
      if (!w || g.player.money < w.price) return false;
      g.player.money -= w.price;
      lo.give(name, w.pack);
      return true;
    },
    refill(name) {
      const w = WEAPONS[name];
      if (!w || !owned[name]) return false;
      const cost = Math.round(w.price * 0.18);
      if (g.player.money < cost) return false;
      g.player.money -= cost;
      ammo[name] = (ammo[name] || 0) + w.pack;
      return true;
    }
  };
  g.loadout = lo;
  return lo;
}
