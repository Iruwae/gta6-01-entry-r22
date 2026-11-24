export const WEAPON_SLOTS = [
  { key: 'fists', name: 'FISTS', ammo: Infinity, damage: 8, range: 2.2, rate: 0.5, price: 0, locked: false },
  { key: 'pistol', name: 'PISTOL', ammo: 12, damage: 18, range: 42, rate: 0.28, price: 400, locked: false },
  { key: 'smg', name: 'SMG', ammo: 30, damage: 10, range: 36, rate: 0.09, price: 1200, locked: false },
  { key: 'shotgun', name: 'SHOTGUN', ammo: 6, damage: 42, range: 16, rate: 0.8, price: 2400, locked: false },
  { key: 'rifle', name: 'RIFLE', ammo: 24, damage: 30, range: 80, rate: 0.18, price: 5200, locked: false },
  { key: 'gator', name: 'GATOR', ammo: 6, damage: 70, range: 60, rate: 1.2, price: 14000, locked: true },
];
export function createLoadout(game) {
  const loadout = {
    slots: {},
    selected: 'fists',
    give(slot, ammo) {
      const def = WEAPON_SLOTS.find((w) => w.key === slot);
      if (!def) return false;
      if (!loadout.slots[slot]) loadout.slots[slot] = { ammo: 0 };
      loadout.slots[slot].ammo = Math.min(def.ammo * 4, (loadout.slots[slot].ammo || 0) + ammo);
      return true;
    },
    select(slot) {
      const def = WEAPON_SLOTS.find((w) => w.key === slot);
      if (!def || def.locked) return false;
      if (slot !== 'fists' && !(loadout.slots[slot] && loadout.slots[slot].ammo > 0)) return false;
      loadout.selected = slot;
      return true;
    },
    current() {
      return WEAPON_SLOTS.find((w) => w.key === loadout.selected);
    },
    ammo(slot) {
      if (slot === 'fists') return Infinity;
      return (loadout.slots[slot] && loadout.slots[slot].ammo) || 0;
    },
    spendAmmo(slot, n = 1) {
      if (slot === 'fists') return true;
      const s = loadout.slots[slot];
      if (!s || s.ammo <= 0) return false;
      s.ammo -= n;
      return true;
    },
    bar() {
      return WEAPON_SLOTS.map((w) => ({
        key: w.key,
        name: w.name,
        ammo: w.key === 'fists' ? '∞' : String(loadout.ammo(w.key)),
        owned: w.key === 'fists' || (loadout.slots[w.key] && loadout.slots[w.key].ammo > 0),
        selected: loadout.selected === w.key,
        locked: w.locked,
      }));
    },
  };
  loadout.give('pistol', 12);
  return loadout;
}