export const WANTED_TIERS = [
  { stars: 0, units: 0, label: '' },
  { stars: 1, units: 1, label: 'UNITS RESPONDING', searchTime: 12 },
  { stars: 2, units: 2, label: 'UNITS RESPONDING', searchTime: 16 },
  { stars: 3, units: 3, label: 'ROADBLOCKS UP', searchTime: 22 },
  { stars: 4, units: 4, label: 'AIR UNIT DEPLOYED', searchTime: 30 },
  { stars: 5, units: 6, label: 'FULL RESPONSE', searchTime: 40 },
];
export function createWantedLevel(game) {
  const wanted = {
    level: 0,
    heat: 0,
    lockedMinimum: 0,
    hidden: false,
    searchTimer: 0,
    lastSeen: { x: 0, z: 0 },
    set(level) {
      wanted.level = Math.max(wanted.lockedMinimum, Math.min(5, level));
      wanted.heat = wanted.level === 0 ? 0 : (wanted.level - 1) * 100 + 50;
      wanted.searchTimer = WANTED_TIERS[wanted.level].searchTime || 0;
      game.bus.emit('wanted', { level: wanted.level });
    },
    addHeat(amount) {
      wanted.heat += amount;
      const next = wanted.heat <= 0 ? 0 : Math.min(5, Math.floor(wanted.heat / 100) + 1);
      if (next > wanted.level) wanted.set(next);
    },
    crime(type) {
      const values = { theft: 60, gunfire: 40, kill: 80, speeding: 10, explosion: 90 };
      wanted.addHeat(values[type] || 20);
      wanted.lastSeen = { x: game.player.position.x, z: game.player.position.z };
    },
    step(dt, anyUnitSees) {
      if (wanted.level === 0) { wanted.heat = 0; return; }
      if (anyUnitSees) {
        wanted.searchTimer = WANTED_TIERS[wanted.level].searchTime || 10;
        wanted.lastSeen = { x: game.player.position.x, z: game.player.position.z };
      } else {
        wanted.searchTimer -= dt;
        if (wanted.searchTimer <= 0) {
          wanted.level = Math.max(wanted.lockedMinimum, wanted.level - 1);
          wanted.heat = wanted.level === 0 ? 0 : (wanted.level - 1) * 100 + 50;
          wanted.searchTimer = WANTED_TIERS[wanted.level].searchTime || 0;
          if (wanted.level === 0) game.bus.emit('escaped', {});
          else game.bus.emit('wanted', { level: wanted.level });
        }
      }
    },
    label() {
      if (wanted.level === 0) return '';
      const tier = WANTED_TIERS[wanted.level];
      return tier.label;
    },
  };
  return wanted;
}