export function createUi(g) {
  const $ = (id) => document.getElementById(id);
  const el = $('hud-dialogue');
  const pc = $('portrait').getContext('2d');
  const FACES = {
    'Lena Cruz': {skin: '#e8b890', hair: '#2a1a12', style: 'long', lip: '#c04050'},
    'Vic Torres': {skin: '#d8a878', hair: '#1a1a1a', style: 'short', lip: '#a06050'},
    'Marco': {skin: '#c89878', hair: '#3a2a1a', style: 'cap', lip: '#905040'}
  };
  const ui = {
    queue: [], cur: null, t: 0,
    queueDialogue(lines) {
      if (!lines || !lines.length) return;
      ui.queue.push(...lines);
      if (!ui.cur) ui.next();
    },
    next() {
      ui.cur = ui.queue.shift() || null;
      ui.t = 0;
      if (!ui.cur) { ui.hideDialogue(); return; }
      $('dlg-name').textContent = ui.cur.who;
      $('dlg-role').textContent = ui.cur.role || '';
      $('dlg-text').textContent = ui.cur.text;
      ui.drawFace(ui.cur.who);
      el.classList.remove('hidden');
    },
    hideDialogue() {
      ui.cur = null;
      el.classList.add('hidden');
    },
    drawFace(who) {
      const f = FACES[who] || FACES['Vic Torres'];
      pc.clearRect(0, 0, 72, 72);
      pc.fillStyle = '#2a3a4a';
      pc.fillRect(0, 0, 72, 72);
      pc.fillStyle = f.skin;
      pc.beginPath(); pc.arc(36, 38, 20, 0, Math.PI * 2); pc.fill();
      pc.fillStyle = f.hair;
      if (f.style === 'long') { pc.beginPath(); pc.arc(36, 30, 21, Math.PI, 0); pc.fill(); pc.fillRect(14, 28, 6, 30); pc.fillRect(52, 28, 6, 30); }
      else if (f.style === 'cap') { pc.beginPath(); pc.arc(36, 28, 20, Math.PI, 0); pc.fill(); pc.fillRect(14, 26, 44, 5); }
      else { pc.beginPath(); pc.arc(36, 28, 20, Math.PI * 1.05, Math.PI * 1.95); pc.fill(); }
      pc.fillStyle = '#1a1a1a';
      pc.beginPath(); pc.arc(29, 38, 2.4, 0, Math.PI * 2); pc.fill();
      pc.beginPath(); pc.arc(43, 38, 2.4, 0, Math.PI * 2); pc.fill();
      pc.fillStyle = f.lip;
      pc.fillRect(31, 52, 10, 3);
    },
    update(dt) {
      if (!ui.cur) return;
      ui.t += dt;
      if (ui.t > 7) ui.next();
    }
  };
  el.addEventListener('click', () => ui.next());
  g.ui = ui;
  return ui;
}
