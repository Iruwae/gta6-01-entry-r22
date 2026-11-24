import { WEAPON_SLOTS } from '../combat/weapons.js';
import { CAR_SPECS } from '../vehicles/carPhysics.js';
import { MISSIONS } from '../missions/story.js';
const fmt$ = (n) => '$' + Math.round(n).toLocaleString('en-US');
export function createMenus(game) {
  const $ = (id) => document.getElementById(id);
  const menus = {
    showTitle() {
      $('screen-title').style.display = 'flex';
      $('screen-pause').style.display = 'none';
      $('screen-shop').style.display = 'none';
      $('hud').style.display = 'none';
      menus.refreshSlots();
    },
    hideTitle() {
      $('screen-title').style.display = 'none';
      $('hud').style.display = 'block';
    },
    showPause() {
      $('screen-pause').style.display = 'flex';
      menus.fillStats();
    },
    hidePause() {
      $('screen-pause').style.display = 'none';
    },
    showShop() {
      $('screen-shop').style.display = 'flex';
      menus.fillShop();
    },
    hideShop() {
      $('screen-shop').style.display = 'none';
    },
    refreshSlots() {
      const list = $('save-slots');
      if (!list) return;
      const slots = game.save.list();
      list.innerHTML = slots.map((s, i) => {
        const label = s ? `SLOT ${i + 1} — ${s.money ? '$' + s.money : ''} · ${s.missionsDone ? s.missionsDone.length : 0} jobs` : `SLOT ${i + 1} — EMPTY`;
        return `<button class="save-slot" data-slot="${i}">${label}</button>`;
      }).join('');
      list.querySelectorAll('.save-slot').forEach((b) => {
        b.addEventListener('click', () => {
          const i = Number(b.dataset.slot);
          if (game.save.exists(i)) game.load(i);
          else game.save.save(i);
          menus.hideTitle();
          game.startPlay();
        });
      });
    },
    fillStats() {
      const p = game.player;
      const moneyEl = $('pause-money');
      if (moneyEl) moneyEl.textContent = fmt$(p.money);
      const rows = [
        ['MONEY', fmt$(p.money)],
        ['RESPECT', game.respect.rank().name + ' (' + game.respect.rp + ' RP)'],
        ['JOBS DONE', game.save.data.missionsDone.length + ' / ' + MISSIONS.length],
        ['WANTED', '★'.repeat(game.wanted.level) + '☆'.repeat(5 - game.wanted.level)],
        ['CARS STOLEN', p.stats.carsStolen],
        ['KILLS', p.stats.kills],
        ['COPS EVADED', p.stats.copsEvaded],
        ['EARNED', fmt$(p.stats.earned)],
        ['SOL COINS', game.activities.coinsCollected + ' / 20'],
        ['DISTRICT', game.plan.districtAt(p.position.x, p.position.z).name],
      ];
      const el = $('stats-rows');
      if (el) el.innerHTML = rows.map(([k, v]) => `<div class="stats-row"><span>${k}</span><span>${v}</span></div>`).join('');
      const standings = $('stats-standing');
      if (standings) {
        standings.innerHTML = game.standing.bars().map((b) => {
          const w = Math.round(((b.value + 100) / 200) * 100);
          return `<div class="standing-row"><span>${b.name}</span><div class="standing-bar"><div style="width:${w}%"></div></div><span>${b.value}</span></div>`;
        }).join('');
      }
    },
    fillShop() {
      const p = game.player;
      const moneyEl = $('shop-money');
      if (moneyEl) moneyEl.textContent = fmt$(p.money);
      const weaponsEl = $('shop-weapons');
      if (weaponsEl) {
        weaponsEl.innerHTML = WEAPON_SLOTS.filter((w) => w.key !== 'fists').map((w) => {
          const owned = game.loadout.ammo(w.key) > 0;
          const btn = w.locked
            ? '<span class="locked-tag">LOCKED — RANK FIXER</span>'
            : owned
              ? `<button data-buy-weapon="${w.key}">AMMO $${Math.round(w.price / 2)}</button>`
              : `<button data-buy-weapon="${w.key}">BUY $${w.price}</button>`;
          return `<div class="shop-row"><span>${w.name}</span><span>${game.loadout.ammo(w.key)} ammo</span>${btn}</div>`;
        }).join('');
      }
      const carsEl = $('shop-cars');
      if (carsEl) {
        carsEl.innerHTML = Object.entries(CAR_SPECS).filter(([k]) => !['interceptor', 'bulwark', 'taxi', 'van'].includes(k)).map(([k, spec]) => {
          const owned = game.save.data.carsOwned.includes(k);
          const btn = owned
            ? '<span class="owned-tag">OWNED</span>'
            : `<button data-buy-car="${k}">BUY ${fmt$(spec.price)}</button>`;
          return `<div class="shop-row"><span>${spec.name}</span><span>TOP ${Math.round(spec.top * 2.237)} mph</span>${btn}</div>`;
        }).join('');
      }
      document.querySelectorAll('[data-buy-weapon]').forEach((b) => {
        b.addEventListener('click', () => {
          const w = WEAPON_SLOTS.find((x) => x.key === b.dataset.buyWeapon);
          const owned = game.loadout.ammo(w.key) > 0;
          const price = owned ? Math.round(w.price / 2) : w.price;
          if (game.player.money < price) { game.ui.showToast('Not enough money'); return; }
          game.player.money -= price;
          game.loadout.give(w.key, w.ammo);
          game.ui.showToast(`${w.name} ${owned ? 'ammo' : 'bought'} — $${price}`);
          menus.fillShop();
        });
      });
      document.querySelectorAll('[data-buy-car]').forEach((b) => {
        b.addEventListener('click', () => {
          const spec = CAR_SPECS[b.dataset.buyCar];
          if (game.player.money < spec.price) { game.ui.showToast('Not enough money'); return; }
          game.player.money -= spec.price;
          game.save.data.carsOwned.push(b.dataset.buyCar);
          const place = game.plan.placeById.get('garage');
          const v = game.fleet.spawn(b.dataset.buyCar, place.x + 10, place.z + 8, 1.2);
          v.parked = true;
          game.ui.showToast(`${spec.name} parked at Lena’s Garage`);
          menus.fillShop();
        });
      });
    },
    wire() {
      const startBtn = $('btn-start');
      if (startBtn) startBtn.addEventListener('click', () => { menus.hideTitle(); game.startPlay(); });
      const continueBtn = $('btn-continue');
      if (continueBtn) continueBtn.addEventListener('click', () => { menus.hideTitle(); game.startPlay(); });
      const resumeBtn = $('btn-resume');
      if (resumeBtn) resumeBtn.addEventListener('click', () => { menus.hidePause(); game.resume(); });
      const quitBtn = $('btn-quit');
      if (quitBtn) quitBtn.addEventListener('click', () => { game.save.save(0); menus.hidePause(); menus.showTitle(); game.toTitle(); });
      const shopBtn = $('btn-shop');
      if (shopBtn) shopBtn.addEventListener('click', () => { menus.showShop(); });
      const shopClose = $('btn-shop-close');
      if (shopClose) shopClose.addEventListener('click', () => { menus.hideShop(); });
      const saveBtn = $('btn-save');
      if (saveBtn) saveBtn.addEventListener('click', () => { game.save.save(0); game.ui.showToast('Saved to slot 1'); });
    },
  };
  return menus;
}