export function createHud(game) {
  const $ = (id) => document.getElementById(id);
  const els = {};
  for (const id of ['money', 'wanted', 'stars', 'health', 'armor', 'health-bar', 'armor-bar', 'speed', 'car', 'condition', 'weapons', 'respect', 'respect-bar', 'dispatch', 'dispatch-rows', 'objective', 'objective-text', 'objective-next', 'timer', 'radio', 'district', 'standing', 'toast', 'dialogue', 'dialogue-name', 'dialogue-role', 'dialogue-lines', 'dialogue-portrait', 'prompt', 'marker', 'crosshair', 'speed-wrap', 'vehicle']) {
    els[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = $('hud-' + id);
  }
  els.carName = els.car;
  els.vehicleWrap = els.vehicle;
  let toastTimer = 0;
  let dialogueTimer = 0;
  let lastMoney = null;
  function fmtMoney(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  const hud = {
    update(dt) {
      const p = game.player;
      if (els.money && p.money !== lastMoney) {
        els.money.textContent = fmtMoney(p.money);
        lastMoney = p.money;
      }
      if (els.stars) {
        const stars = '★'.repeat(game.wanted.level) + '☆'.repeat(5 - game.wanted.level);
        els.stars.textContent = stars;
        els.stars.className = 'wanted-stars' + (game.wanted.level >= 3 ? ' hot' : '');
      }
      if (els.wanted) els.wanted.textContent = game.wanted.label();
      if (els.health) els.health.textContent = Math.round(p.health);
      if (els.armor) els.armor.textContent = Math.round(p.armor);
      if (els.healthBar) els.healthBar.style.width = Math.max(0, p.health) + '%';
      if (els.armorBar) els.armorBar.style.width = Math.max(0, p.armor) + '%';
      const v = p.vehicle;
      if (els.speedWrap) els.speedWrap.style.display = v ? 'block' : 'none';
      if (els.vehicleWrap) els.vehicleWrap.style.display = v ? 'block' : 'none';
      if (v) {
        if (els.speed) els.speed.textContent = String(Math.round(v.speed * 2.237));
        if (els.carName) els.carName.textContent = v.spec.name;
        if (els.condition) els.condition.textContent = Math.round(v.condition) + '%';
      }
      if (els.weapons) {
        const bar = game.loadout.bar();
        els.weapons.innerHTML = bar.map((w) => {
          const cls = ['weapon-slot'];
          if (w.selected) cls.push('selected');
          if (!w.owned || w.locked) cls.push('locked');
          return `<div class="${cls.join(' ')}"><span class="weapon-name">${w.name}</span><span class="weapon-ammo">${w.locked ? 'LOCKED' : w.ammo}</span></div>`;
        }).join('');
      }
      if (els.respect) els.respect.textContent = 'RANK · ' + game.respect.rank().name;
      if (els.respectBar) els.respectBar.style.width = Math.round(game.respect.progress() * 100) + '%';
      const rows = game.dispatch.rowsForHud();
      if (els.dispatch) els.dispatch.style.display = rows.length ? 'block' : 'none';
      if (els.dispatchRows) {
        els.dispatchRows.innerHTML = rows.map((r) => {
          const chipCls = r.tactic === 'RAMMING' || r.tactic === 'FIRING' ? 'chip hot' : 'chip';
          return `<div class="dispatch-row"><span class="dispatch-unit">${r.name}</span><span class="dispatch-dist">${r.dist}m</span><span class="${chipCls}">${r.tactic}</span></div>`;
        }).join('');
      }
      const stage = game.missions.currentStage();
      const next = game.missions.nextStage();
      if (els.objective) els.objective.style.display = stage ? 'block' : 'none';
      if (stage && els.objectiveText) els.objectiveText.textContent = stage.text;
      if (els.objectiveNext) els.objectiveNext.textContent = next ? 'NEXT: ' + next.text : '';
      if (els.timer) {
        const t = game.missions.active && game.missions.active.id === 'bridge-run' ? game.missions.timer : (game.activities.fare ? game.activities.fare.timer : 0);
        els.timer.textContent = t > 0 ? fmtTime(t) : '';
      }
      if (els.radio) els.radio.textContent = game.radio.line();
      const d = game.plan.districtAt(p.position.x, p.position.z);
      if (els.district && d) els.district.textContent = d.name.toUpperCase();
      if (els.standing) {
        const val = game.standing.value(d ? d.id : 'harbor');
        els.standing.textContent = val > 20 ? 'RESPECTED' : val < -20 ? 'HOSTILE' : 'NEUTRAL';
      }
      if (els.crosshair) els.crosshair.style.display = (!v && game.loadout.selected !== 'fists') ? 'block' : 'none';
      if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0 && els.toast) els.toast.textContent = ''; }
      if (dialogueTimer > 0) {
        dialogueTimer -= dt;
        if (dialogueTimer <= 0) hud.hideDialogue();
      }
    },
    showToast(text, seconds = 4) {
      if (els.toast) els.toast.textContent = text;
      toastTimer = seconds;
    },
    showDialogue(d, seconds = 8) {
      if (!els.dialogue) return;
      els.dialogue.style.display = 'block';
      if (els.dialogueName) els.dialogueName.textContent = d.name;
      if (els.dialogueRole) els.dialogueRole.textContent = d.role || '';
      if (els.dialogueLines) els.dialogueLines.innerHTML = d.lines.map((l) => `<p>${l}</p>`).join('');
      if (els.dialoguePortrait) els.dialoguePortrait.textContent = d.name.split(' ').map((w) => w[0]).join('');
      dialogueTimer = seconds;
    },
    hideDialogue() {
      if (els.dialogue) els.dialogue.style.display = 'none';
    },
    setMarker(x, z, text) {
      if (els.marker) {
        els.marker.style.display = 'block';
        els.marker.textContent = '◆ ' + text;
      }
    },
    clearMarker() {
      if (els.marker) els.marker.style.display = 'none';
    },
    showPrompt(text) {
      if (els.prompt) { els.prompt.style.display = 'block'; els.prompt.textContent = text; }
    },
    hidePrompt() {
      if (els.prompt) els.prompt.style.display = 'none';
    },
  };
  return hud;
}
function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}