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
  function setText(el, v) { if (el) el.textContent = v; }
  function setShown(el, on) { if (el) el.style.display = on ? 'block' : 'none'; }
  function setWidth(el, v) { if (el) el.style.width = v; }
  const hud = {
    update(dt) {
      const p = game.player;
      if (els.money && p.money !== lastMoney) { els.money.textContent = fmtMoney(p.money); lastMoney = p.money; }
      if (els.stars) { els.stars.textContent = '★'.repeat(game.wanted.level) + '☆'.repeat(5 - game.wanted.level); els.stars.className = 'wanted-stars' + (game.wanted.level >= 3 ? ' hot' : ''); }
      setText(els.wanted, game.wanted.label());
      setText(els.health, Math.round(p.health));
      setText(els.armor, Math.round(p.armor));
      setWidth(els.healthBar, Math.max(0, p.health) + '%');
      setWidth(els.armorBar, Math.max(0, p.armor) + '%');
      const v = p.vehicle;
      setShown(els.speedWrap, !!v);
      setShown(els.vehicleWrap, !!v);
      if (v) {
        setText(els.speed, String(Math.round(v.speed * 2.237)));
        setText(els.carName, v.spec.name);
        setText(els.condition, Math.round(v.condition) + '%');
      }
      if (els.weapons) {
        els.weapons.innerHTML = game.loadout.bar().map((w) => `<div class="weapon-slot${w.selected ? ' selected' : ''}${!w.owned || w.locked ? ' locked' : ''}"><span class="weapon-name">${w.name}</span><span class="weapon-ammo">${w.locked ? 'LOCKED' : w.ammo}</span></div>`).join('');
      }
      setText(els.respect, 'RANK · ' + game.respect.rank().name);
      setWidth(els.respectBar, Math.round(game.respect.progress() * 100) + '%');
      const rows = game.dispatch.rowsForHud();
      setShown(els.dispatch, rows.length > 0);
      if (els.dispatchRows) {
        els.dispatchRows.innerHTML = rows.map((r) => `<div class="dispatch-row"><span class="dispatch-unit">${r.name}</span><span class="dispatch-dist">${r.dist}m</span><span class="${r.tactic === 'RAMMING' || r.tactic === 'FIRING' ? 'chip hot' : 'chip'}">${r.tactic}</span></div>`).join('');
      }
      const stage = game.missions.currentStage();
      const next = game.missions.nextStage();
      setShown(els.objective, !!stage);
      if (stage) setText(els.objectiveText, stage.text);
      setText(els.objectiveNext, next ? 'NEXT: ' + next.text : '');
      if (els.timer) {
        const t = game.missions.active && game.missions.active.id === 'bridge-run' ? game.missions.timer : (game.activities.fare ? game.activities.fare.timer : 0);
        els.timer.textContent = t > 0 ? fmtTime(t) : '';
      }
      setText(els.radio, game.radio.line());
      const d = game.plan.districtAt(p.position.x, p.position.z);
      if (els.district && d) els.district.textContent = d.name.toUpperCase();
      if (els.standing) {
        const val = game.standing.value(d ? d.id : 'harbor');
        els.standing.textContent = val > 20 ? 'RESPECTED' : val < -20 ? 'HOSTILE' : 'NEUTRAL';
      }
      setShown(els.crosshair, !v && game.loadout.selected !== 'fists');
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
      setText(els.dialogueName, d.name);
      setText(els.dialogueRole, d.role || '');
      if (els.dialogueLines) els.dialogueLines.innerHTML = d.lines.map((l) => `<p>${l}</p>`).join('');
      setText(els.dialoguePortrait, d.name.split(' ').map((w) => w[0]).join(''));
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