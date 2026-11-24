import {WEAPONS, SLOT_ORDER} from '../combat/weapons.js';
export function createHud(g) {
  const $ = (id) => document.getElementById(id);
  const els = {
    job: $('hud-job'), jobTitle: $('job-title'), jobStep: $('job-step'),
    dispatch: $('hud-dispatch'), rows: $('dispatch-rows'),
    radio: $('hud-radio'), money: $('money'), stars: $('stars'),
    wantedPill: $('wanted-pill'), rankPanel: $('rank-panel'), rpFill: $('rp-fill'),
    weapons: $('hud-weapons'), district: $('district-name'), stand: $('district-stand'),
    hpFill: $('hp-fill'), hpNum: $('hp-num'), arFill: $('ar-fill'), arNum: $('ar-num'),
    carName: $('car-name'), speed: $('speed'), cond: $('cond'),
    hint: $('hud-hint'), dlg: $('hud-dialogue'), dlgName: $('dlg-name'),
    dlgRole: $('dlg-role'), dlgText: $('dlg-text'), portrait: $('portrait'),
    notify: $('hud-notify'), banner: $('hud-banner')
  };
  let dispT = 0, uiT = 0;
  const hud = {
    notify(msg) {
      const n = document.createElement('div');
      n.className = 'note';
      n.textContent = msg;
      els.notify.appendChild(n);
      while (els.notify.children.length > 4) els.notify.removeChild(els.notify.firstChild);
      setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 4500);
    },
    wantedBanner(s) {
      if (s > 0) hud.flashBanner('★'.repeat(s) + ' WANTED', 2000);
    },
    flashBanner(text, ms = 2500) {
      els.banner.textContent = text;
      els.banner.classList.remove('hidden');
      setTimeout(() => els.banner.classList.add('hidden'), ms);
    },
    missionCard(m) {
      hud.flashBanner('JOB ' + (g.story.done + 1) + '/8 · ' + m.title.toUpperCase(), 3000);
      hud.job(m);
    },
    missionPass(m, reward) {
      hud.flashBanner('JOB PASSED · +$' + reward, 3000);
      hud.notify('Job passed: ' + m.title + ' +$' + reward);
      hud.job(null);
    },
    missionFail(m, reason) {
      hud.flashBanner('JOB FAILED · ' + reason, 3000);
      hud.job(null);
    },
    job(m) {
      if (!m) {
        const cur = g.missions ? g.missions.active : null;
        if (!cur) { els.jobTitle.textContent = 'No active job — press M'; els.jobStep.textContent = 'NEXT: Visit Lena at the garage'; return; }
        m = cur;
      }
      const s = g.missions.curStep();
      els.jobTitle.textContent = m.title + ' — ' + (s ? s.text : '');
      els.jobStep.textContent = 'NEXT: ' + (s ? s.next : 'Job done');
    },
    radioLine() {
      const st = g.radio.station();
      els.radio.textContent = st.name + ' — ' + st.song;
    },
    buildWeapons() {
      els.weapons.innerHTML = '';
      for (const key of SLOT_ORDER) {
        const w = WEAPONS[key];
        const div = document.createElement('div');
        div.className = 'wslot' + (g.loadout.current === key ? ' sel' : '') + (!g.loadout.owned[key] ? ' locked' : '');
        div.id = 'ws-' + key;
        div.innerHTML = '<div class="wn">' + w.name + '</div><div class="wa">' + (g.loadout.owned[key] ? ((w.inf || g.loadout.ammo[key] === Infinity) ? '∞' : g.loadout.ammo[key]) : 'LOCKED') + '</div>';
        els.weapons.appendChild(div);
      }
    },
    update(dt) {
      const p = g.player;
      els.money.textContent = '$' + Math.floor(p.money).toLocaleString('en-US');
      const stars = g.wanted ? g.wanted.stars : 0;
      els.stars.textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      const rp = g.respect ? g.respect : null;
      els.rankPanel.childNodes[0].textContent = 'RANK · ' + (rp ? rp.name() : 'NOBODY');
      if (rp) els.rpFill.style.width = Math.round(rp.progress() * 100) + '%';
      const inCar = !!p.vehicle;
      els.carName.textContent = inCar ? p.vehicle.name.toUpperCase() : 'ON FOOT';
      const mph = inCar ? Math.round(Math.abs(p.vehicle.speed) * 2.237) : 0;
      els.speed.innerHTML = mph + '<span>MPH</span>';
      els.cond.textContent = inCar ? Math.round(p.vehicle.health / p.vehicle.maxHealth * 100) + '%' : '';
      els.hpFill.style.width = Math.round(p.health / p.maxHealth() * 100) + '%';
      els.hpNum.textContent = Math.round(p.health);
      els.arFill.style.width = Math.round(p.armour) + '%';
      els.arNum.textContent = Math.round(p.armour);
      const d = g.plan.districtAt(p.pos.x, p.pos.z);
      els.district.textContent = d.name;
      els.stand.textContent = 'NEUTRAL';
      dispT += dt;
      if (dispT > 0.25) {
        dispT = 0;
        const units = g.dispatch ? g.dispatch.units : [];
        els.dispatch.style.display = units.length || (g.dispatch && g.dispatch.roadblock) ? 'block' : 'none';
        els.rows.innerHTML = '';
        for (const u of units.slice(0, 5)) {
          const row = document.createElement('div');
          row.className = 'urow';
          row.innerHTML = '<span class="uname">' + u.name + '</span><span class="udist">' + u.dist() + 'm</span><span class="tactic ' + u.tactic.split(' ')[0] + '">' + u.tactic + '</span>';
          els.rows.appendChild(row);
        }
        const wp = els.wantedPill;
        if (g.dispatch && g.dispatch.roadblock) { wp.textContent = 'ROADBLOCKS UP'; wp.classList.remove('hidden'); }
        else if (stars > 0) { wp.textContent = 'UNITS RESPONDING'; wp.classList.remove('hidden'); }
        else wp.classList.add('hidden');
        hud.buildWeapons();
        hud.job();
      }
      uiT += dt;
      if (uiT > 0.25) {
        uiT = 0;
        if (g.minimap) g.minimap.draw();
      }
    }
  };
  g.hud = hud;
  return hud;
}
