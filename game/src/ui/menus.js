import {WEAPONS} from '../combat/weapons.js';
export function createMenus(g) {
  const $ = (id) => document.getElementById(id);
  const el = {
    title: $('title-screen'), pause: $('pause-screen'), respawn: $('respawn-screen'),
    shop: $('shop-screen'), wheel: $('wheel'), hud: $('hud'),
    tsNew: $('ts-new'), tsContinue: $('ts-continue'), slots: document.querySelectorAll('#ts-slots .slot'),
    btnResume: $('btn-resume'), btnGarage: $('btn-garage'), btnSave: $('btn-save'), btnQuit: $('btn-quit'),
    btnRespawn: $('btn-respawn'), respawnTitle: $('respawn-title'), respawnText: $('respawn-text'),
    shopRows: $('shop-rows'), btnShopClose: $('btn-shop-close'),
    pauseMoney: $('pause-money'), careerRows: $('career-rows'), standingRows: $('standing-rows')
  };
  const show = (e, on) => { if (e) e.classList.toggle('hidden', !on); };
  const menus = {
    showTitle() {
      show(el.title, true); show(el.pause, false); show(el.respawn, false); show(el.shop, false); show(el.hud, false);
      menus.refreshSlots();
    },
    hideTitle() {
      show(el.title, false); show(el.hud, true);
      if (g.ui) g.ui.queueDialogue(g.story.list[0].dialogue);
    },
    showPause() {
      show(el.pause, true);
      const p = g.player;
      el.pauseMoney.textContent = '$' + Math.floor(p.money).toLocaleString('en-US');
      const st = p.stats;
      const rows = [
        ['MONEY', '$' + Math.floor(p.money).toLocaleString('en-US')],
        ['RANK', (g.respect ? g.respect.name() : 'NOBODY') + ' (' + (g.respect ? g.respect.rp : 0) + ' RP)'],
        ['JOBS DONE', (g.story ? g.story.done : 0) + '/8'],
        ['CARS STOLEN', st.carsStolen],
        ['KILLS', st.kills],
        ['EARNED', '$' + Math.floor(st.earned).toLocaleString('en-US')],
        ['SOL COINS', (g.activities ? g.activities.coinsCollected : 0) + '/20'],
        ['TIME', g.clock.timeStr()]
      ];
      el.careerRows.innerHTML = rows.map(r => '<div class="crow"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('');
      const districts = ['PALMERA STRAND', 'SUNDIAL SQUARE', 'VIDRIO HEIGHTS', 'OLD CANNERY', 'MARINA ROW', 'SALTFLATS PORT', 'SEAGLASS BEACH', 'CORAL KEYS'];
      el.standingRows.innerHTML = districts.map(d => '<div class="crow"><span>' + d + '</span><div class="sbar"><div style="width:' + Math.min(100, (g.respect ? g.respect.rp : 0) / 50) + '%"></div></div><b>NEUTRAL</b></div>').join('');
    },
    hidePause() { show(el.pause, false); },
    showRespawn(kind, fee) {
      el.respawnTitle.textContent = kind;
      el.respawnText.textContent = 'You lost $' + fee + ' in hospital bills / bail.';
      show(el.respawn, true);
    },
    hideRespawn() { show(el.respawn, false); },
    showShop() {
      show(el.shop, true);
      const rows = [];
      for (const key of Object.keys(WEAPONS)) {
        const w = WEAPONS[key];
        if (w.price > 0) rows.push({label: w.name + ' — $' + w.price, buy: () => g.loadout.buy(key)});
        if (w.refill > 0) rows.push({label: w.name + ' refill — $' + w.refill, buy: () => g.loadout.refill(key)});
      }
      rows.push({label: 'RESPRAY — $350', buy: () => g.activities.buyService('respray')});
      rows.push({label: 'ARMOUR — $400', buy: () => g.activities.buyService('armour')});
      el.shopRows.innerHTML = '';
      for (const r of rows) {
        const div = document.createElement('div');
        div.className = 'srow';
        const sp = document.createElement('span');
        sp.textContent = r.label;
        const b = document.createElement('button');
        b.textContent = 'BUY';
        b.addEventListener('click', () => { if (r.buy()) { if (g.hud) g.hud.notify('Bought ' + r.label); } });
        div.appendChild(sp); div.appendChild(b);
        el.shopRows.appendChild(div);
      }
    },
    hideShop() { show(el.shop, false); },
    showWheel() {
      show(el.wheel, true);
      el.wheel.innerHTML = '';
      const keys = ['fists', 'pistol', 'smg', 'shotgun', 'rifle', 'rpg'];
      keys.forEach((k, i) => {
        const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
        const sp = document.createElement('div');
        sp.className = 'wseg';
        sp.textContent = WEAPONS[k].name;
        sp.style.transform = 'translate(' + (Math.cos(a) * 140) + 'px,' + (Math.sin(a) * 140) + 'px) translate(-50%,-50%)';
        el.wheel.appendChild(sp);
      });
    },
    hideWheel() { show(el.wheel, false); },
    refreshSlots() {
      el.slots.forEach((s, i) => {
        s.textContent = g.save ? g.save.summary(i) : 'SLOT ' + (i + 1) + ' — EMPTY';
      });
    }
  };
  el.tsNew.addEventListener('click', () => { g.newGame(); });
  el.tsContinue.addEventListener('click', () => { if (g.save && g.save.read(0)) { g.newGame(); g.save.load(0); } });
  el.slots.forEach((s, i) => s.addEventListener('click', () => {
    if (g.save && g.save.read(i)) { g.newGame(); g.save.load(i); }
    else g.newGame();
  }));
  el.btnResume.addEventListener('click', () => { g.mode = 'play'; menus.hidePause(); });
  el.btnGarage.addEventListener('click', () => { menus.showShop(); });
  el.btnSave.addEventListener('click', () => { if (g.save) { g.save.write(0); if (g.hud) g.hud.notify('Saved'); } });
  el.btnQuit.addEventListener('click', () => { g.mode = 'title'; menus.hidePause(); menus.showTitle(); });
  el.btnRespawn.addEventListener('click', () => { menus.hideRespawn(); g.player.respawn(); });
  el.btnShopClose.addEventListener('click', () => menus.hideShop());
  g.menus = menus;
  return menus;
}
