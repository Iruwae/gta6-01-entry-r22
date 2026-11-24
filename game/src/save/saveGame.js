const KEY = 'solmar-bay-save';
export function createSaveGame(game) {
  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }
  function writeAll(slots) {
    try { localStorage.setItem(KEY, JSON.stringify(slots)); } catch { /* storage full or blocked */ }
  }
  const save = {
    data: {
      money: 500,
      rp: 0,
      missionsDone: [],
      carsOwned: ['comet'],
      coinsCollected: 0,
      position: { x: -400, z: 290 },
      station: 0,
    },
    list() {
      const all = readAll();
      return [all[0] || null, all[1] || null, all[2] || null];
    },
    exists(i) { return !!readAll()[i]; },
    save(i = 0) {
      const all = readAll();
      save.data.money = game.player.money;
      save.data.rp = game.respect.rp;
      save.data.coinsCollected = game.activities.coinsCollected;
      save.data.position = { x: game.player.position.x, z: game.player.position.z };
      save.data.station = game.radio.station;
      all[i] = { ...save.data, savedAt: new Date().toISOString() };
      writeAll(all);
      return true;
    },
    load(i = 0) {
      const slot = readAll()[i];
      if (!slot) return false;
      save.data = { ...save.data, ...slot };
      game.player.money = save.data.money;
      game.respect.rp = save.data.rp;
      game.activities.coinsCollected = save.data.coinsCollected;
      game.radio.station = save.data.station || 0;
      game.player.placeAt(save.data.position.x, save.data.position.z);
      return true;
    },
    reset() {
      save.data = { money: 500, rp: 0, missionsDone: [], carsOwned: ['comet'], coinsCollected: 0, position: { x: -400, z: 290 }, station: 0 };
    },
  };
  return save;
}